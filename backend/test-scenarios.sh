#!/bin/bash
# =========================================================
# TodoList API 시나리오 통합 테스트
# =========================================================
BASE="http://localhost:3000/api"
TS=$(date +%s)
EMAIL_A="testa_${TS}@example.com"
EMAIL_B="testb_${TS}@example.com"
PW="password123!"
PASS=0; FAIL=0

# Windows/Unix 호환 임시 파일 경로
TB=$(python -c "import tempfile,os; print(os.path.join(tempfile.gettempdir(),'api_tb.json').replace(chr(92),'/'))")

# ── 헬퍼 ──────────────────────────────────────────────────
chk() {
  local id="$1" desc="$2" expected="$3" actual="$4"
  if [ "$actual" = "$expected" ]; then
    echo "✅ PASS [$id] $desc"
    PASS=$((PASS+1))
  else
    echo "❌ FAIL [$id] $desc  (expected=$expected actual=$actual)"
    FAIL=$((FAIL+1))
  fi
}

req() {
  local method="$1" path="$2" data="$3" auth="$4"
  local args=(-s -o "$TB" -w "%{http_code}" -X "$method" "$BASE/$path" -H "Content-Type: application/json")
  [ -n "$auth" ] && args+=(-H "Authorization: Bearer $auth")
  [ -n "$data" ] && args+=(-d "$data")
  curl "${args[@]}"
}

jget()  { python -c "import json; d=json.load(open('$TB')); print(d.get('$1') or '')" 2>/dev/null; }
jlen()  { python -c "import json; print(len(json.load(open('$TB'))))" 2>/dev/null; }
jpyeval() { python -c "$1" 2>/dev/null; }

echo ""
echo "========================================================"
echo " TodoList API 시나리오 테스트  ($(date '+%Y-%m-%d %H:%M:%S'))"
echo "========================================================"
echo " 서버: $BASE"
echo " 사용자A: $EMAIL_A"
echo " 사용자B: $EMAIL_B"
echo " 임시파일: $TB"
echo ""

# ─────────────────────────────────────────────────────────
echo "▶ [1] 인증 시나리오"
# ─────────────────────────────────────────────────────────

STATUS=$(req POST "auth/register" "{\"email\":\"$EMAIL_A\",\"password\":\"$PW\"}")
chk "SC-A-10" "신규 회원가입 → 201" 201 "$STATUS"

STATUS=$(req POST "auth/register" "{\"email\":\"$EMAIL_A\",\"password\":\"$PW\"}")
chk "SC-E-01" "중복 이메일 → 409" 409 "$STATUS"

STATUS=$(req POST "auth/register" "{\"email\":\"short_${TS}@x.com\",\"password\":\"abc1234\"}")
chk "SC-E-02" "비밀번호 7자 → 400" 400 "$STATUS"

STATUS=$(req POST "auth/login" "{\"email\":\"$EMAIL_A\",\"password\":\"$PW\"}")
chk "SC-A-11" "로그인 성공 → 200" 200 "$STATUS"
TOKEN_A=$(jget accessToken)
REFRESH_A=$(jget refreshToken)

STATUS=$(req POST "auth/login" "{\"email\":\"$EMAIL_A\",\"password\":\"wrongpw!\"}")
chk "SC-E-03" "잘못된 비밀번호 → 401" 401 "$STATUS"

STATUS=$(req POST "auth/login" "{\"email\":\"nobody@x.com\",\"password\":\"$PW\"}")
chk "SC-E-04" "미가입 이메일 → 401" 401 "$STATUS"

STATUS=$(req GET "todos")
chk "SC-E-05" "토큰 없이 todos 접근 → 401" 401 "$STATUS"

STATUS=$(req POST "auth/logout" "" "$TOKEN_A")
chk "SC-A-12" "로그아웃 → 200" 200 "$STATUS"

STATUS=$(req POST "auth/refresh" "{\"refreshToken\":\"$REFRESH_A\"}")
chk "SC-A-13" "Refresh Token으로 갱신 → 200" 200 "$STATUS"
TOKEN_A=$(jget accessToken)

STATUS=$(req POST "auth/refresh" "{\"refreshToken\":\"invalid.token.here\"}")
chk "SC-A-13b" "만료/위조 Refresh Token → 401" 401 "$STATUS"

req POST "auth/register" "{\"email\":\"$EMAIL_B\",\"password\":\"$PW\"}" > /dev/null
STATUS=$(req POST "auth/login" "{\"email\":\"$EMAIL_B\",\"password\":\"$PW\"}")
TOKEN_B=$(jget accessToken)

# ─────────────────────────────────────────────────────────
echo ""
echo "▶ [2] 카테고리 시나리오"
# ─────────────────────────────────────────────────────────

STATUS=$(req POST "categories" '{"name":"업무"}' "$TOKEN_A")
chk "SC-B-10" "카테고리 생성 → 201" 201 "$STATUS"
CAT_ID=$(jget id)

STATUS=$(req POST "categories" '{"name":"업무"}' "$TOKEN_A")
chk "SC-E-11" "중복 카테고리명 → 409" 409 "$STATUS"

LONG_NAME=$(python -c "print('a'*51)")
STATUS=$(req POST "categories" "{\"name\":\"$LONG_NAME\"}" "$TOKEN_A")
chk "SC-E-13" "카테고리명 51자 초과 → 400" 400 "$STATUS"

STATUS=$(req POST "categories" '{"name":"개인"}' "$TOKEN_A")
chk "SC-B-10b" "두 번째 카테고리 생성 → 201" 201 "$STATUS"
CAT_ID2=$(jget id)

STATUS=$(req PATCH "categories/$CAT_ID2" '{"name":"개인생활"}' "$TOKEN_A")
chk "SC-B-11" "카테고리 이름 수정 → 200" 200 "$STATUS"

STATUS=$(req PATCH "categories/$CAT_ID2" '{"name":"업무"}' "$TOKEN_A")
chk "SC-E-12" "중복 이름으로 수정 → 409" 409 "$STATUS"

STATUS=$(req POST "categories" '{"name":"업무"}' "$TOKEN_B")
chk "SC-B-10c" "다른 사용자 동일 이름 허용 → 201" 201 "$STATUS"

# ─────────────────────────────────────────────────────────
echo ""
echo "▶ [3] 할일 시나리오"
# ─────────────────────────────────────────────────────────

FUTURE=$(python -c "from datetime import datetime,timezone,timedelta; print((datetime.now(timezone.utc)+timedelta(days=3)).strftime('%Y-%m-%dT%H:%M:%SZ'))")
PAST=$(python -c "from datetime import datetime,timezone,timedelta; print((datetime.now(timezone.utc)-timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%SZ'))")

STATUS=$(req POST "todos" '{"title":"팀 주간 보고서 작성"}' "$TOKEN_A")
chk "SC-A-20" "제목만 할일 생성 → 201" 201 "$STATUS"
TODO_NULL_DUE=$(jget id)
chk "SC-A-20b" "마감일 null → status=in_progress" "in_progress" "$(jget status)"

STATUS=$(req POST "todos" "{\"title\":\"경쟁사 광고 분석 리포트\",\"categoryId\":\"$CAT_ID\",\"dueDate\":\"$FUTURE\"}" "$TOKEN_A")
chk "SC-A-21" "카테고리+마감일 할일 생성 → 201" 201 "$STATUS"
TODO_FUTURE=$(jget id)
chk "SC-A-21b" "미래 마감일 → status=in_progress" "in_progress" "$(jget status)"

STATUS=$(req POST "todos" "{\"title\":\"어린이집 준비물 챙기기\",\"dueDate\":\"$PAST\"}" "$TOKEN_A")
chk "과거마감" "과거 마감일 할일 생성 → 201" 201 "$STATUS"
TODO_PAST=$(jget id)
chk "과거마감b" "과거 마감일 → status=overdue" "overdue" "$(jget status)"

STATUS=$(req POST "todos" '{"title":""}' "$TOKEN_A")
chk "SC-E-06" "제목 없이 생성 → 400" 400 "$STATUS"

LONG_TITLE=$(python -c "print('a'*101)")
STATUS=$(req POST "todos" "{\"title\":\"$LONG_TITLE\"}" "$TOKEN_A")
chk "SC-E-07" "제목 101자 초과 → 400" 400 "$STATUS"

STATUS=$(req GET "todos?status=overdue" "$TOKEN_A")
chk "SC-A-22" "status=overdue 필터 → 200" 200 "$STATUS"
OVERDUE_OK=$(jpyeval "import json; d=json.load(open('$TB')); print(all(x['status']=='overdue' for x in d) and len(d)>0)")
chk "SC-A-22b" "overdue 필터 결과 모두 overdue" "True" "$OVERDUE_OK"

STATUS=$(req GET "todos?status=in_progress" "$TOKEN_A")
chk "SC-E-14a" "status=in_progress 필터 → 200" 200 "$STATUS"
HAS_NULL=$(jpyeval "import json; d=json.load(open('$TB')); print(any(x['id']=='$TODO_NULL_DUE' for x in d))")
chk "SC-E-14b" "마감일 null 할일이 in_progress 포함" "True" "$HAS_NULL"

STATUS=$(req GET "todos?categoryId=$CAT_ID" "$TOKEN_A")
chk "SC-A-23" "categoryId 필터 → 200" 200 "$STATUS"
ALL_CAT=$(jpyeval "import json; d=json.load(open('$TB')); print(all(x['categoryId']=='$CAT_ID' for x in d) and len(d)>0)")
chk "SC-A-23b" "필터 결과 모두 해당 categoryId" "True" "$ALL_CAT"

STATUS=$(req PATCH "todos/$TODO_FUTURE" '{"title":"경쟁사 광고 분석 리포트 (완성본)"}' "$TOKEN_A")
chk "SC-A-24" "할일 제목 수정 → 200" 200 "$STATUS"
chk "SC-A-24b" "수정된 제목 반영" "경쟁사 광고 분석 리포트 (완성본)" "$(jget title)"

STATUS=$(req PATCH "todos/$TODO_FUTURE" '{"isCompleted":true}' "$TOKEN_A")
chk "SC-A-25" "완료 처리 → 200" 200 "$STATUS"
chk "SC-A-25b" "완료 후 status=completed" "completed" "$(jget status)"

STATUS=$(req PATCH "todos/$TODO_FUTURE" '{"isCompleted":false}' "$TOKEN_A")
chk "SC-A-26" "완료 취소 → 200" 200 "$STATUS"
chk "SC-A-26b" "미래 마감일 완료취소 → in_progress" "in_progress" "$(jget status)"

req PATCH "todos/$TODO_PAST" '{"isCompleted":true}' "$TOKEN_A" > /dev/null
STATUS=$(req PATCH "todos/$TODO_PAST" '{"isCompleted":false}' "$TOKEN_A")
chk "SC-E-10" "완료취소 + 과거마감일 → overdue" "overdue" "$(jget status)"

STATUS=$(req POST "todos" '{"title":"사용자B의 할일"}' "$TOKEN_B")
TODO_B=$(jget id)
STATUS=$(req PATCH "todos/$TODO_B" '{"title":"해킹시도"}' "$TOKEN_A")
chk "SC-E-08" "타인 할일 수정 → 403" 403 "$STATUS"

STATUS=$(req DELETE "todos/$TODO_B" "" "$TOKEN_A")
chk "SC-E-09" "타인 할일 삭제 → 403" 403 "$STATUS"

STATUS=$(req DELETE "todos/$TODO_NULL_DUE" "" "$TOKEN_A")
chk "SC-A-27" "할일 삭제 → 204" 204 "$STATUS"
STATUS=$(req GET "todos" "$TOKEN_A")
DELETED=$(jpyeval "import json; d=json.load(open('$TB')); print(not any(x['id']=='$TODO_NULL_DUE' for x in d))")
chk "SC-A-27b" "삭제 후 목록에 없음 (Hard Delete)" "True" "$DELETED"

# ─────────────────────────────────────────────────────────
echo ""
echo "▶ [4] 카테고리 삭제 + 할일 보존 (DR-06)"
# ─────────────────────────────────────────────────────────

STATUS=$(req POST "categories" '{"name":"장보기"}' "$TOKEN_A")
CART_ID=$(jget id)
req POST "todos" "{\"title\":\"우유 2L\",\"categoryId\":\"$CART_ID\"}" "$TOKEN_A" > /dev/null
req POST "todos" "{\"title\":\"계란 30구\",\"categoryId\":\"$CART_ID\"}" "$TOKEN_A" > /dev/null
req POST "todos" "{\"title\":\"세제\",\"categoryId\":\"$CART_ID\"}" "$TOKEN_A" > /dev/null

STATUS=$(req DELETE "categories/$CART_ID" "" "$TOKEN_A")
chk "SC-B-12" "카테고리 삭제 → 204" 204 "$STATUS"

STATUS=$(req GET "todos" "$TOKEN_A")
PRESERVED=$(jpyeval "
import json; d=json.load(open('$TB'))
cart=[t for t in d if t['title'] in ['우유 2L','계란 30구','세제']]
print(len(cart)==3 and all(t['categoryId'] is None for t in cart))
")
chk "SC-B-12b" "카테고리 삭제 후 할일 3건 보존 + categoryId=null" "True" "$PRESERVED"

# ─────────────────────────────────────────────────────────
echo ""
echo "========================================================"
printf " 결과: ✅ PASS=%d  ❌ FAIL=%d  TOTAL=%d\n" $PASS $FAIL $((PASS+FAIL))
echo "========================================================"
echo ""
[ $FAIL -eq 0 ] && exit 0 || exit 1
