"""TodoList API 사용자 시나리오 통합 테스트"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import json
import urllib.request
import urllib.error
import time

BASE = "http://localhost:3000/api"
TS   = str(int(time.time()))
EMAIL_A = f"testa_{TS}@example.com"
EMAIL_B = f"testb_{TS}@example.com"
PW = "password123!"

PASS = 0
FAIL = 0

# ── 헬퍼 ──────────────────────────────────────────────────

def req(method, path, body=None, token=None):
    url = f"{BASE}/{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json; charset=utf-8"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as resp:
            body = resp.read()
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read()
        return e.code, json.loads(body) if body else {}


def chk(id_, desc, expected, actual):
    global PASS, FAIL
    ok = str(actual) == str(expected)
    mark = "✅ PASS" if ok else "❌ FAIL"
    line = f"{mark} [{id_}] {desc}"
    if not ok:
        line += f"  (expected={expected} actual={actual})"
    print(line)
    if ok:
        PASS += 1
    else:
        FAIL += 1


# ─────────────────────────────────────────────────────────
print(f"""
========================================================
 TodoList API 시나리오 테스트
========================================================
 서버: {BASE}
 사용자A: {EMAIL_A}
 사용자B: {EMAIL_B}
""")

# ─────────────────────────────────────────────────────────
print("▶ [1] 인증 시나리오")
# ─────────────────────────────────────────────────────────

s, r = req("POST", "auth/register", {"email": EMAIL_A, "password": PW})
chk("SC-A-10", "신규 회원가입 → 201", 201, s)

s, r = req("POST", "auth/register", {"email": EMAIL_A, "password": PW})
chk("SC-E-01", "중복 이메일 → 409", 409, s)

s, r = req("POST", "auth/register", {"email": f"short_{TS}@x.com", "password": "abc1234"})
chk("SC-E-02", "비밀번호 7자 → 400", 400, s)

s, r = req("POST", "auth/login", {"email": EMAIL_A, "password": PW})
chk("SC-A-11", "로그인 성공 → 200", 200, s)
TOKEN_A = r.get("accessToken", "")
REFRESH_A = r.get("refreshToken", "")

s, r = req("POST", "auth/login", {"email": EMAIL_A, "password": "wrongpw!"})
chk("SC-E-03", "잘못된 비밀번호 → 401", 401, s)

s, r = req("POST", "auth/login", {"email": "nobody@x.com", "password": PW})
chk("SC-E-04", "미가입 이메일 → 401", 401, s)

s, r = req("GET", "todos")
chk("SC-E-05", "토큰 없이 todos 접근 → 401", 401, s)

s, r = req("POST", "auth/logout", token=TOKEN_A)
chk("SC-A-12", "로그아웃 → 200", 200, s)

s, r = req("POST", "auth/refresh", {"refreshToken": REFRESH_A})
chk("SC-A-13", "Refresh Token으로 갱신 → 200", 200, s)
TOKEN_A = r.get("accessToken", TOKEN_A)  # 갱신된 토큰

s, r = req("POST", "auth/refresh", {"refreshToken": "invalid.token.here"})
chk("SC-A-13b", "만료/위조 Refresh Token → 401", 401, s)

# 사용자B
req("POST", "auth/register", {"email": EMAIL_B, "password": PW})
s, r = req("POST", "auth/login", {"email": EMAIL_B, "password": PW})
TOKEN_B = r.get("accessToken", "")

# ─────────────────────────────────────────────────────────
print("\n▶ [2] 카테고리 시나리오")
# ─────────────────────────────────────────────────────────

s, r = req("POST", "categories", {"name": "업무"}, TOKEN_A)
chk("SC-B-10", "카테고리 생성 → 201", 201, s)
CAT_ID = r.get("id", "")

s, r = req("POST", "categories", {"name": "업무"}, TOKEN_A)
chk("SC-E-11", "중복 카테고리명 → 409", 409, s)

s, r = req("POST", "categories", {"name": "a" * 51}, TOKEN_A)
chk("SC-E-13", "카테고리명 51자 초과 → 400", 400, s)

s, r = req("POST", "categories", {"name": "개인"}, TOKEN_A)
chk("SC-B-10b", "두 번째 카테고리 생성 → 201", 201, s)
CAT_ID2 = r.get("id", "")

s, r = req("PATCH", f"categories/{CAT_ID2}", {"name": "개인생활"}, TOKEN_A)
chk("SC-B-11", "카테고리 이름 수정 → 200", 200, s)

s, r = req("PATCH", f"categories/{CAT_ID2}", {"name": "업무"}, TOKEN_A)
chk("SC-E-12", "중복 이름으로 수정 → 409", 409, s)

s, r = req("POST", "categories", {"name": "업무"}, TOKEN_B)
chk("SC-B-10c", "다른 사용자 동일 이름 허용 → 201", 201, s)

# ─────────────────────────────────────────────────────────
print("\n▶ [3] 할일 시나리오")
# ─────────────────────────────────────────────────────────

from datetime import datetime, timezone, timedelta
FUTURE = (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%SZ")
PAST   = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")

s, r = req("POST", "todos", {"title": "팀 주간 보고서 작성"}, TOKEN_A)
chk("SC-A-20", "제목만 할일 생성 → 201", 201, s)
TODO_NULL_DUE = r.get("id", "")
chk("SC-A-20b", "마감일 null → status=in_progress", "in_progress", r.get("status"))

s, r = req("POST", "todos", {"title": "경쟁사 광고 분석 리포트", "categoryId": CAT_ID, "dueDate": FUTURE}, TOKEN_A)
chk("SC-A-21", "카테고리+마감일 할일 생성 → 201", 201, s)
TODO_FUTURE = r.get("id", "")
chk("SC-A-21b", "미래 마감일 → status=in_progress", "in_progress", r.get("status"))

s, r = req("POST", "todos", {"title": "어린이집 준비물 챙기기", "dueDate": PAST}, TOKEN_A)
chk("과거마감", "과거 마감일 할일 생성 → 201", 201, s)
TODO_PAST = r.get("id", "")
chk("과거마감b", "과거 마감일 → status=overdue", "overdue", r.get("status"))

s, r = req("POST", "todos", {"title": ""}, TOKEN_A)
chk("SC-E-06", "제목 없이 생성 → 400", 400, s)

s, r = req("POST", "todos", {"title": "a" * 101}, TOKEN_A)
chk("SC-E-07", "제목 101자 초과 → 400", 400, s)

s, r = req("GET", "todos?status=overdue", token=TOKEN_A)
chk("SC-A-22", "status=overdue 필터 → 200", 200, s)
chk("SC-A-22b", "overdue 필터 결과 모두 overdue", True, r and all(t["status"] == "overdue" for t in r))

s, r = req("GET", "todos?status=in_progress", token=TOKEN_A)
chk("SC-E-14a", "status=in_progress 필터 → 200", 200, s)
chk("SC-E-14b", "마감일 null 할일이 in_progress 포함", True,
    isinstance(r, list) and any(t["id"] == TODO_NULL_DUE for t in r))

s, r = req("GET", f"todos?categoryId={CAT_ID}", token=TOKEN_A)
chk("SC-A-23", "categoryId 필터 → 200", 200, s)
chk("SC-A-23b", "필터 결과 모두 해당 categoryId", True,
    isinstance(r, list) and len(r) > 0 and all(t["categoryId"] == CAT_ID for t in r))

# 사용자A vs B 데이터 분리 확인
s_a, r_a = req("GET", "todos", token=TOKEN_A)
s_b, r_b = req("GET", "todos", token=TOKEN_B)
chk("DR-02", "본인 데이터만 조회 (A/B 데이터 분리)", True,
    not any(t["id"] in [t2["id"] for t2 in r_b] for t in r_a) if r_a and r_b else True)

s, r = req("PATCH", f"todos/{TODO_FUTURE}", {"title": "경쟁사 광고 분석 리포트 (완성본)"}, TOKEN_A)
chk("SC-A-24", "할일 제목 수정 → 200", 200, s)
chk("SC-A-24b", "수정된 제목 반영", "경쟁사 광고 분석 리포트 (완성본)", r.get("title"))

s, r = req("PATCH", f"todos/{TODO_FUTURE}", {"isCompleted": True}, TOKEN_A)
chk("SC-A-25", "완료 처리 → 200", 200, s)
chk("SC-A-25b", "완료 후 status=completed", "completed", r.get("status"))

s, r = req("PATCH", f"todos/{TODO_FUTURE}", {"isCompleted": False}, TOKEN_A)
chk("SC-A-26", "완료 취소 → 200", 200, s)
chk("SC-A-26b", "미래 마감일 완료취소 → in_progress", "in_progress", r.get("status"))

req("PATCH", f"todos/{TODO_PAST}", {"isCompleted": True}, TOKEN_A)  # 완료 처리
s, r = req("PATCH", f"todos/{TODO_PAST}", {"isCompleted": False}, TOKEN_A)  # 취소
chk("SC-E-10", "완료취소 + 과거마감일 → overdue", "overdue", r.get("status"))

s, r = req("POST", "todos", {"title": "사용자B의 할일"}, TOKEN_B)
TODO_B = r.get("id", "")
s, r = req("PATCH", f"todos/{TODO_B}", {"title": "해킹시도"}, TOKEN_A)
chk("SC-E-08", "타인 할일 수정 → 403", 403, s)

s, r = req("DELETE", f"todos/{TODO_B}", token=TOKEN_A)
chk("SC-E-09", "타인 할일 삭제 → 403", 403, s)

s, r = req("DELETE", f"todos/{TODO_NULL_DUE}", token=TOKEN_A)
chk("SC-A-27", "할일 삭제 → 204", 204, s)
s, r = req("GET", "todos", token=TOKEN_A)
chk("SC-A-27b", "삭제 후 목록에 없음 (Hard Delete)", True,
    isinstance(r, list) and not any(t["id"] == TODO_NULL_DUE for t in r))

# ─────────────────────────────────────────────────────────
print("\n▶ [4] 카테고리 삭제 + 할일 보존 (DR-06)")
# ─────────────────────────────────────────────────────────

s, r = req("POST", "categories", {"name": "장보기"}, TOKEN_A)
CART_ID = r.get("id", "")
req("POST", "todos", {"title": "우유 2L",   "categoryId": CART_ID}, TOKEN_A)
req("POST", "todos", {"title": "계란 30구", "categoryId": CART_ID}, TOKEN_A)
req("POST", "todos", {"title": "세제",      "categoryId": CART_ID}, TOKEN_A)

s, r = req("DELETE", f"categories/{CART_ID}", token=TOKEN_A)
chk("SC-B-12", "카테고리 삭제 → 204", 204, s)

s, r = req("GET", "todos", token=TOKEN_A)
cart_titles = {"우유 2L", "계란 30구", "세제"}
cart_todos  = [t for t in r if t["title"] in cart_titles] if isinstance(r, list) else []
chk("SC-B-12b", "카테고리 삭제 후 할일 3건 보존 + categoryId=null", True,
    len(cart_todos) == 3 and all(t["categoryId"] is None for t in cart_todos))

# ─────────────────────────────────────────────────────────
print(f"""
========================================================
 결과: ✅ PASS={PASS}  ❌ FAIL={FAIL}  TOTAL={PASS+FAIL}
========================================================
""")
sys.exit(0 if FAIL == 0 else 1)
