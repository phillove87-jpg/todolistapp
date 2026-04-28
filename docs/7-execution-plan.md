# 실행 계획서 — TodoList

**프로젝트명:** TodoList  
**버전:** 1.0  
**작성일:** 2026-04-28  
**일정:** 2026-04-28 ~ 2026-04-30 (Phase 1)  
**참조 문서:** 2-prd.md v1.0, 3-project-structure.md v1.0, 4-erd.md v1.0

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|---|---|---|---|
| 1.0 | 2026-04-28 | Chanok | 초안 작성 — DB/BE/FE 전체 Task 분해 및 의존성 정의 |

---

## 1. 전체 Task 요약

| 영역 | Task 수 | 예상 소요시간 |
|---|---|---|
| Database | 7개 (DB-01~07) | 약 2.5h |
| Backend | 13개 (BE-01~13) | 약 29h |
| Frontend | 20개 (FE-01~20) | 약 48.5h |
| **합계** | **40개** | **약 80h** |

---

## 2. 전체 의존성 흐름

```
[DB-01] PostgreSQL 설치·DB 생성
    ├─ [DB-02] schema.sql 실행
    └─ [DB-03] .env 환경변수 설정
            └─ [DB-04] dbClient.js 구현
                    └─ [DB-05] 연결 테스트
                            └─ [DB-06] Repository 구현 ──┐
                                    └─ [DB-07] 통합 검증  │
                                                          │
[BE-01] 백엔드 초기 설정 ─────────────────────────────────┤
    ├─ [BE-02] 공통 미들웨어                               │
    │       └─ [BE-03] JWT/bcrypt 유틸                    │
    │               └─ [BE-04] 인증 API ──────────────────┤
    │                       ├─ [BE-05] 할일 API           │
    │                       │       └─ [BE-06] 카테고리 API│
    │                       │               └─ [BE-07] 통합 테스트
    └─ DB-04 (dbClient)

[FE-01] 프론트엔드 초기 설정
    ├─ [FE-02] API 클라이언트 ──┐
    ├─ [FE-03] Zustand Store ───┤
    ├─ [FE-04] 공통 컴포넌트    │
    └─ [FE-09] 상태 계산 유틸   │
            └─ [FE-05] 레이아웃·라우터
                    ├─ [FE-06] useAuth ─► [FE-07] 인증 페이지
                    ├─ [FE-08] useTodos ─► [FE-10] TodoCard/Form
                    │                          └─ [FE-11] TodoList/Filter
                    │                                  └─ [FE-12] TodoListPage
                    └─ [FE-13] useCategories ─► [FE-14] CategoryForm/List
                                                      └─ [FE-15] CategoryPage
                                                              └─ [FE-17] 반응형 검증
                                                                      └─ [FE-20] 통합 테스트
```

---

## 3. 일자별 실행 계획

| 날짜 | 목표 | 핵심 Task |
|---|---|---|
| **04-28** | 인프라·인증 완료 | DB-01~05, BE-01~04, FE-01~07 |
| **04-29** | 핵심 기능 구현 | DB-06~07, BE-05~06, FE-08~15 |
| **04-30** | 통합 검증·마무리 | BE-07, FE-16~20 |

---

## 4. DATABASE Tasks

---

### DB-01 — PostgreSQL 환경 설정 및 DB/유저 생성

**의존성:** 없음 | **예상 소요시간:** 15분

**작업 목록:**
- PostgreSQL 서버 실행 상태 확인 (설치 확인)
- superuser로 접속하여 DB 및 전용 유저 생성
  ```sql
  CREATE DATABASE todolistapp ENCODING 'UTF8';
  CREATE USER todolist_user WITH PASSWORD '<비밀번호>';
  GRANT ALL PRIVILEGES ON DATABASE todolistapp TO todolist_user;
  GRANT USAGE, CREATE ON SCHEMA public TO todolist_user;
  ```

**완료 조건:**
- [ ] `psql -d todolistapp -U todolist_user` 접속 성공
- [ ] `\dt` 명령으로 테이블 목록 조회 가능 (비어 있어도 OK)

---

### DB-02 — schema.sql 실행 및 스키마 초기화

**의존성:** DB-01 | **예상 소요시간:** 10분

**작업 목록:**
- `database/schema.sql` 실행
  ```bash
  psql -d todolistapp -U todolist_user -f database/schema.sql
  ```

**완료 조건:**
- [ ] `\dt` 실행 시 `users`, `categories`, `todos` 테이블 3개 존재
- [ ] `\di` 실행 시 인덱스 4개 존재 (`uq_categories_user_name`, `idx_todos_user_id`, `idx_todos_category_id`, `idx_todos_status_filter`)
- [ ] `\df set_updated_at` 실행 시 트리거 함수 존재
- [ ] `\d todos` 실행 시 컬럼 구조 정상 확인

---

### DB-03 — backend .env 환경변수 설정

**의존성:** DB-01 | **예상 소요시간:** 10분

**작업 목록:**
- `backend/.env.example` 참조하여 `backend/.env` 생성
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=todolistapp
  DB_USER=todolist_user
  DB_PASSWORD=<DB-01에서 설정한 비밀번호>
  JWT_SECRET=<node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" 으로 생성>
  JWT_ACCESS_EXPIRES=1h
  JWT_REFRESH_EXPIRES=7d
  PORT=3000
  NODE_ENV=development
  CORS_ORIGIN=http://localhost:5173
  ```

**완료 조건:**
- [ ] `backend/.env` 파일 생성됨
- [ ] DB 접속 정보 5개 (HOST, PORT, NAME, USER, PASSWORD) 모두 입력됨
- [ ] `JWT_SECRET` 최소 64자 이상 랜덤 문자열
- [ ] `git status`에서 `.env` 파일 미추적 상태 확인 (gitignore 적용)

---

### DB-04 — pg 라이브러리 및 dbClient.js 구현

**의존성:** DB-03 | **예상 소요시간:** 20분

**작업 목록:**
- `backend/` 에서 `npm install pg` 실행
- `backend/src/db/dbClient.js` 구현 (pg.Pool 생성, 환경변수 기반 설정)
- `backend/src/config/env.js` 구현 (필수 환경변수 검증 — 누락 시 서버 시작 차단)

**완료 조건:**
- [ ] `backend/package.json`에 `pg` 의존성 포함
- [ ] `backend/src/db/dbClient.js` 파일 존재 및 Pool export
- [ ] `backend/src/config/env.js` 파일 존재 및 필수값 검증 로직 포함
- [ ] 환경변수 누락 시 `process.exit(1)` 또는 에러 throw

---

### DB-05 — 데이터베이스 연결 테스트

**의존성:** DB-04 | **예상 소요시간:** 15분

**작업 목록:**
- Backend 서버 시작 후 DB 연결 로그 확인
- `pool.query('SELECT NOW()')` 쿼리 실행 성공 확인

**완료 조건:**
- [ ] 서버 시작 시 DB 연결 성공 로그 출력
- [ ] `SELECT NOW()` 쿼리 결과 정상 반환 (응답 시간 < 100ms)
- [ ] 잘못된 환경변수로 시작 시 에러 메시지 출력 후 종료

---

### DB-06 — Repository 레이어 구현

**의존성:** DB-05 | **예상 소요시간:** 45분

**작업 목록:**
- `backend/src/repositories/userRepository.js` 구현
  - `getUserById(id)`, `getUserByEmail(email)`, `createUser(email, hashedPassword)`
- `backend/src/repositories/todoRepository.js` 구현
  - `getTodosByUserId(userId)`, `getTodoById(id)`, `createTodo(...)`, `updateTodo(...)`, `deleteTodo(id)`
- `backend/src/repositories/categoryRepository.js` 구현
  - `getCategoriesByUserId(userId)`, `getCategoryById(id)`, `createCategory(userId, name)`, `updateCategory(id, name)`, `deleteCategory(id)`
- **공통 원칙:** DB 컬럼명(snake_case) → camelCase 변환하여 반환

**완료 조건:**
- [ ] 3개 Repository 파일 모두 생성됨
- [ ] 각 함수에 JSDoc 주석 (`@param`, `@returns`) 포함
- [ ] 반환 객체 키가 camelCase 확인 (예: `created_at` → `createdAt`)
- [ ] 비즈니스 로직 없음 (SQL 실행만)

---

### DB-07 — 관계 및 제약조건 통합 검증

**의존성:** DB-02, DB-06 | **예상 소요시간:** 30분

**작업 목록:**
- FK CASCADE 동작 확인 (User 삭제 → Todo, Category 전체 삭제)
- FK SET NULL 동작 확인 (Category 삭제 → Todo.category_id = null, 행 보존)
- UNIQUE 제약 확인 (이메일 중복, 동일 사용자 카테고리명 중복)
- NOT NULL 제약 확인 (title 없이 Todo 생성 시도)
- `set_updated_at` 트리거 확인 (Todo 수정 시 `updated_at` 자동 갱신)

**완료 조건:**
- [ ] User 삭제 시 소속 Todo, Category 모두 삭제됨 (CASCADE)
- [ ] Category 삭제 후 소속 Todo 행 존재, `category_id = NULL` 확인 (SET NULL)
- [ ] 이메일 중복 INSERT 시 DB 에러 발생
- [ ] 동일 사용자 카테고리명 중복 INSERT 시 DB 에러 발생
- [ ] Todo 수정 후 `updated_at` 이 수정 시각으로 자동 갱신됨

---

## 5. BACKEND Tasks

---

### BE-01 — 백엔드 프로젝트 초기 설정

**의존성:** 없음 | **예상 소요시간:** 1h

**작업 목록:**
- `backend/` 디렉토리 생성 및 `npm init` 실행
- 필수 패키지 설치: `express`, `pg`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `pino`
- 디렉토리 구조 생성: `src/routes`, `src/controllers`, `src/services`, `src/repositories`, `src/middlewares`, `src/config`, `src/db`, `src/utils`
- `backend/.env.example` 작성
- `backend/.eslintrc.js` 작성 (프로젝트 규칙 7개 포함)
- `backend/.gitignore` 작성 (`.env`, `node_modules/` 포함)

**완료 조건:**
- [ ] `npm install` 성공
- [ ] `backend/package.json`에 모든 필수 의존성 명시됨
- [ ] 8개 디렉토리 구조 생성 완료
- [ ] `.env.example` 에 11개 환경변수 키 나열됨
- [ ] ESLint 설정 파일 존재 및 `no-unused-vars`, `eqeqeq`, `no-var` 규칙 포함

---

### BE-02 — 공통 미들웨어 및 유틸리티 구현

**의존성:** BE-01 | **예상 소요시간:** 2.5h

**작업 목록:**
- `backend/src/middlewares/authMiddleware.js` — JWT 검증, `req.user` 주입
- `backend/src/middlewares/errorHandler.js` — 통일된 에러 응답 형식 반환
- `backend/src/middlewares/validateRequest.js` — 요청 바디/파라미터 유효성 검증
- `backend/src/middlewares/requestLogger.js` — pino 기반 구조화 로깅
- `backend/src/config/corsConfig.js` — CORS 설정 (와일드카드 금지)
- `backend/src/utils/logger.js` — pino 로거 인스턴스 래퍼

**완료 조건:**
- [ ] `authMiddleware`가 `Authorization: Bearer <token>` 파싱 후 검증
- [ ] 인증 실패 시 `401 Unauthorized` + JSON 에러 응답 반환
- [ ] `errorHandler`가 모든 에러를 `{"error": {"code": "...", "message": "..."}}` 형식으로 변환
- [ ] CORS가 `CORS_ORIGIN` 환경변수 값만 허용 (와일드카드 금지)
- [ ] 로그에 개인정보(이메일, 비밀번호) 미포함

---

### BE-03 — JWT/bcrypt 유틸리티 구현

**의존성:** BE-01 | **예상 소요시간:** 1.5h

**작업 목록:**
- `backend/src/utils/jwtHelper.js` 구현
  - `signAccessToken(userId)` — HS-512, 만료 1h
  - `signRefreshToken(userId)` — HS-512, 만료 7d
  - `verifyToken(token)` — 검증 및 payload 반환
- `backend/src/utils/passwordHelper.js` 구현
  - `hashPassword(password)` — bcrypt, cost factor 12
  - `comparePassword(input, hash)` — boolean 반환

**완료 조건:**
- [ ] `signAccessToken` 이 HS-512 서명된 토큰 반환
- [ ] 토큰 페이로드에 `userId`, `iat`, `exp` 포함
- [ ] Access Token / Refresh Token 만료 시간이 다름
- [ ] `hashPassword` bcrypt cost ≥ 12 사용
- [ ] `comparePassword` boolean 반환
- [ ] `JWT_SECRET` 32바이트 미만 시 에러 throw

---

### BE-04 — 인증 API 구현 (F-01, F-02, F-03, F-04)

**의존성:** BE-02, BE-03, DB-04 | **예상 소요시간:** 4h

**작업 목록:**
- `backend/src/repositories/userRepository.js` 구현 (`getUserByEmail`, `createUser`, `getUserById`)
- `backend/src/services/authService.js` 구현 (이메일 중복 검증, 비밀번호 검증, 토큰 발급)
- `backend/src/controllers/authController.js` 구현 (`register`, `login`, `logout`, `refresh`)
- `backend/src/routes/authRoutes.js` 구현
- `backend/src/routes/index.js` 구현 (라우터 마운트)
- `backend/src/app.js` 구현 (Express 앱 초기화, 미들웨어 등록)
- `backend/src/server.js` 구현 (`app.listen`)

| 엔드포인트 | 요청 | 응답 |
|---|---|---|
| `POST /api/auth/register` | `{email, password}` | `{id, email, createdAt}` (201) |
| `POST /api/auth/login` | `{email, password}` | `{accessToken, refreshToken, user}` (200) |
| `POST /api/auth/logout` | Bearer Token | `{message}` (200) |
| `POST /api/auth/refresh` | `{refreshToken}` | `{accessToken}` (200) |

**완료 조건:**
- [ ] 중복 이메일 가입 시 `409 Conflict` 반환
- [ ] 비밀번호 7자 이하 가입 시 `400 Bad Request` 반환
- [ ] 로그인 성공 시 Access Token(1h) + Refresh Token(7d) 발급
- [ ] 잘못된 비밀번호 로그인 시 `401 Unauthorized` 반환
- [ ] 응답에 비밀번호 해시 미포함
- [ ] Refresh Token 만료 시 `401` 반환 (재로그인 필요)

---

### BE-05 — 할일 API 구현 (F-10, F-11, F-12, F-13, F-14)

**의존성:** BE-04 | **예상 소요시간:** 8h

**작업 목록:**
- `backend/src/repositories/todoRepository.js` 구현 (CRUD + 필터 쿼리)
- `backend/src/services/todoService.js` 구현 (상태 계산, 소유권 검증, 비즈니스 로직)
- `backend/src/controllers/todoController.js` 구현
- `backend/src/routes/todoRoutes.js` 구현

| 엔드포인트 | 기능 | 인증 |
|---|---|---|
| `POST /api/todos` | 할일 생성 (F-10) | 필요 |
| `GET /api/todos?status=&categoryId=` | 목록 조회·필터 (F-11) | 필요 |
| `PATCH /api/todos/:id` | 수정·완료 처리 (F-12, F-13) | 필요 |
| `DELETE /api/todos/:id` | 삭제 (F-14) | 필요 |

**할일 상태 계산 로직 (DR-03, DR-04, DR-07):**
```
is_completed = true              → "completed"
is_completed = false, due_date = null    → "in_progress"
is_completed = false, due_date > NOW()  → "in_progress"
is_completed = false, due_date ≤ NOW()  → "overdue"
```

**완료 조건:**
- [ ] 제목 없이 생성 시 `400` 반환
- [ ] 제목 101자 초과 생성 시 `400` 반환
- [ ] `?status=overdue` 필터가 기간 초과 항목만 반환
- [ ] `?status=in_progress` 필터가 null 마감일 항목 포함
- [ ] `?categoryId=<id>` 필터 정상 작동
- [ ] 완료 취소 시 마감일 기준 상태 재계산 (DR-08)
- [ ] 타인 할일 수정/삭제 시 `403 Forbidden` 반환 (DR-02)
- [ ] 타인 할일이 목록 조회 결과에 미포함 (DR-02)
- [ ] Hard Delete 적용 (복구 불가)

---

### BE-06 — 카테고리 API 구현 (F-20, F-21, F-22)

**의존성:** BE-04 | **예상 소요시간:** 5h

**작업 목록:**
- `backend/src/repositories/categoryRepository.js` 구현 (CRUD)
- `backend/src/services/categoryService.js` 구현 (중복 검증, 소유권 검증)
- `backend/src/controllers/categoryController.js` 구현
- `backend/src/routes/categoryRoutes.js` 구현

| 엔드포인트 | 기능 | 인증 |
|---|---|---|
| `GET /api/categories` | 목록 조회 | 필요 |
| `POST /api/categories` | 생성 (F-20) | 필요 |
| `PATCH /api/categories/:id` | 수정 (F-21) | 필요 |
| `DELETE /api/categories/:id` | 삭제 (F-22) | 필요 |

**완료 조건:**
- [ ] 동일 사용자 내 이름 중복 생성 시 `409 Conflict` 반환 (DR-05)
- [ ] 다른 사용자와 동일 이름은 허용
- [ ] 이름 51자 초과 시 `400 Bad Request` 반환
- [ ] 카테고리 삭제 시 소속 할일 `category_id = null` 처리, 행 보존 (DR-06)
- [ ] 타인 카테고리 수정/삭제 시 `403 Forbidden` 반환 (DR-02)

---

### BE-07 — 백엔드 통합 테스트

**의존성:** BE-04, BE-05, BE-06 | **예상 소요시간:** 4h

**작업 목록:**
- `backend/src/services/authService.test.js` — register, login, verifyToken
- `backend/src/services/todoService.test.js` — 상태 계산 4가지 케이스, 소유권 검증
- `backend/src/services/categoryService.test.js` — 중복 검증, 카테고리 삭제 후 할일 보존
- `backend/src/utils/jwtHelper.test.js` — 발급, 검증, 만료
- `backend/src/utils/passwordHelper.test.js` — 해시, 비교

**완료 조건:**
- [ ] 할일 상태 계산 4가지 케이스 모두 테스트 통과
  - `is_completed=true` → `completed`
  - `is_completed=false, due_date=null` → `in_progress`
  - `is_completed=false, due_date > now` → `in_progress`
  - `is_completed=false, due_date ≤ now` → `overdue`
- [ ] 소유권 검증 테스트 (본인 ✓, 타인 ✗)
- [ ] 유효성 검증 경계값 테스트 (0자, 1자, 100자, 101자)
- [ ] 중복 검증 테스트 (같은 사용자 ✗, 다른 사용자 ✓)
- [ ] 토큰 검증 테스트 (유효, 만료, 위조)
- [ ] 모든 테스트 통과 (`npm test`)

---

## 6. FRONTEND Tasks

---

### FE-01 — 프로젝트 초기 설정

**의존성:** 없음 | **예상 소요시간:** 2h

**작업 목록:**
- Vite + React 19 프로젝트 생성
- 의존성 설치: `react-router-dom`, `@tanstack/react-query`, `zustand`, `tailwindcss`
- `tailwind.config.js`, `vite.config.js` (절대경로 alias `@/`), `.eslintrc.js` 설정
- `frontend/.env.example` 작성 (`VITE_API_BASE_URL`)
- `frontend/.gitignore` 작성
- `src/index.css` Tailwind 지시어 추가

**완료 조건:**
- [ ] `npm install` 성공
- [ ] `npm run dev` 실행 시 `http://localhost:5173` 정상 로드
- [ ] `npm run build` 빌드 성공
- [ ] Tailwind 스타일 적용 확인
- [ ] ESLint 설정 파일 존재

---

### FE-02 — API 클라이언트 레이어 구현

**의존성:** FE-01 | **예상 소요시간:** 3h

**작업 목록:**
- `src/utils/tokenStorage.js` — localStorage 토큰 저장/조회/삭제 캡슐화
- `src/api/client.js` — fetch 래퍼: Authorization 헤더 자동 첨부, 401 시 자동 갱신, 갱신 실패 시 `/login` 리다이렉트
- `src/constants/apiEndpoints.js` — 엔드포인트 경로 상수 정의

**완료 조건:**
- [ ] API 요청 시 `Authorization: Bearer <token>` 자동 첨부
- [ ] `401` 응답 시 Refresh Token으로 자동 재발급 후 원래 요청 재시도
- [ ] Refresh Token 만료 시 `/login` 리다이렉트
- [ ] 무한 갱신 루프 방지 로직 존재

---

### FE-03 — Zustand Store 구현

**의존성:** FE-01 | **예상 소요시간:** 2h

**작업 목록:**
- `src/store/authStore.js` — 인증 상태 (`accessToken`, `user`, `isAuthenticated`), `setTokens`, `setUser`, `clearAuth` 액션, localStorage 복원 로직
- `src/store/filterStore.js` — 필터 상태 (`selectedCategoryId`, `selectedStatus`), `setCategory`, `setStatus`, `resetFilters` 액션

**완료 조건:**
- [ ] 페이지 새로고침 후 `authStore` 토큰 자동 복원
- [ ] `clearAuth()` 호출 시 토큰·사용자 정보 모두 초기화
- [ ] `filterStore` 상태 변경 시 관련 컴포넌트 리렌더링

---

### FE-04 — 공통 UI 컴포넌트 구현

**의존성:** FE-01 | **예상 소요시간:** 3h

**작업 목록:**
- `src/components/common/Button.jsx` — variant (`primary`, `secondary`, `danger`), `isLoading`, `disabled`
- `src/components/common/Input.jsx` — label, placeholder, error 메시지 표시
- `src/components/common/Modal.jsx` — `isOpen`, `onClose`, 배경 클릭 닫기
- `src/components/common/LoadingSpinner.jsx` — size prop (`sm`, `md`, `lg`)
- `src/components/common/ErrorMessage.jsx` — 에러 메시지 + 자동 닫기 옵션

**완료 조건:**
- [ ] 5개 컴포넌트 렌더링 정상 확인
- [ ] Tailwind 반응형 스타일 적용 (360px ~ 1440px)
- [ ] aria 접근성 속성 포함

---

### FE-05 — 레이아웃 및 라우터 설정

**의존성:** FE-01, FE-02, FE-03 | **예상 소요시간:** 2.5h

**작업 목록:**
- `src/components/layout/Header.jsx` — 네비게이션, 로그아웃 버튼, 모바일 햄버거 메뉴
- `src/components/layout/PrivateRoute.jsx` — 미인증 시 `/login` 리다이렉트
- `src/App.jsx` — BrowserRouter, QueryClientProvider, 라우트 정의 4개 (`/login`, `/register`, `/`, `/categories`)

**완료 조건:**
- [ ] 미인증 상태에서 `/` 접근 시 `/login` 리다이렉트
- [ ] 로그아웃 후 보호 페이지 접근 시 `/login` 리다이렉트
- [ ] TanStack Query QueryClientProvider 정상 초기화
- [ ] 라우트 전환 시 화면 정상 표시

---

### FE-06 — useAuth 훅 구현

**의존성:** FE-02, FE-03 | **예상 소요시간:** 2.5h

**작업 목록:**
- `src/api/authApi.js` — `register`, `login`, `logout`, `refreshToken` 함수
- `src/hooks/useAuth.js` — `useRegisterMutation`, `useLoginMutation`, `useLogoutMutation`

**완료 조건:**
- [ ] 로그인 성공 시 토큰 `authStore` 저장 + `/` 리다이렉트
- [ ] 회원 가입 성공 시 `/login` 리다이렉트
- [ ] 로그아웃 성공 시 토큰 제거 + `/login` 리다이렉트
- [ ] 각 뮤테이션의 `isLoading`, `error` 상태 제공

---

### FE-07 — 인증 페이지 구현 (LoginPage, RegisterPage)

**의존성:** FE-04, FE-05, FE-06 | **예상 소요시간:** 3h

**작업 목록:**
- `src/pages/LoginPage.jsx` — 이메일/비밀번호 폼, 로그인 버튼, 오류 메시지, 회원 가입 링크
- `src/pages/RegisterPage.jsx` — 이메일/비밀번호/비밀번호 확인 폼, 회원 가입 버튼, 오류 메시지

**완료 조건:**
- [ ] 로그인 성공 시 `/` 이동
- [ ] `401` 시 "이메일 또는 비밀번호가 올바르지 않습니다" 메시지 표시
- [ ] 회원 가입 성공 시 `/login` 이동
- [ ] `409` 시 "이미 사용 중인 이메일입니다" 메시지 표시
- [ ] 비밀번호 불일치 시 클라이언트 검증 오류 표시
- [ ] 반응형 디자인 (360px ~ 1440px)

---

### FE-08 — useTodos 훅 구현

**의존성:** FE-02, FE-03 | **예상 소요시간:** 3h

**작업 목록:**
- `src/api/todoApi.js` — `getTodos`, `createTodo`, `updateTodo`, `deleteTodo` 함수
- `src/hooks/useTodos.js` — `useTodosQuery`, `useCreateTodoMutation`, `useUpdateTodoMutation`, `useDeleteTodoMutation`

**완료 조건:**
- [ ] `useTodosQuery`가 필터 파라미터 변경 시 자동 리페치
- [ ] 생성/수정/삭제 후 캐시 자동 갱신
- [ ] `isLoading`, `error` 상태 제공

---

### FE-09 — 할일 상태 계산 유틸리티

**의존성:** FE-01 | **예상 소요시간:** 1h

**작업 목록:**
- `src/utils/todoStatusCalculator.js` — `calculateStatus(isCompleted, dueDate)`, `getStatusColor(status)`, `getStatusLabel(status)`
- `src/constants/todoStatus.js` — `COMPLETED`, `IN_PROGRESS`, `OVERDUE`, `STATUS_ALL` 상수

**완료 조건:**
- [ ] `calculateStatus(false, null)` → `"in_progress"` 반환 (DR-07)
- [ ] `calculateStatus(false, 과거날짜)` → `"overdue"` 반환
- [ ] `calculateStatus(true, 과거날짜)` → `"completed"` 반환

---

### FE-10 — TodoCard, TodoForm 컴포넌트 구현

**의존성:** FE-04, FE-08, FE-09 | **예상 소요시간:** 3h

**작업 목록:**
- `src/components/todo/TodoCard.jsx` — 제목, 상태 배지, 마감일, 카테고리, 완료 토글, 수정/삭제 버튼
- `src/components/todo/TodoForm.jsx` — 제목(필수), 설명, 카테고리, 마감일 입력, 클라이언트 검증

**완료 조건:**
- [ ] 완료 상태 시 제목에 취소선 표시
- [ ] 상태별 배지 색상 구분 (완료: 초록, 진행 중: 파랑, 기간 초과: 빨강)
- [ ] TodoForm 제목 없이 저장 시 클라이언트 오류 표시
- [ ] 카테고리 없는 할일 "미지정"으로 표시

---

### FE-11 — TodoList, TodoFilter 컴포넌트 구현

**의존성:** FE-03, FE-08, FE-10 | **예상 소요시간:** 3h

**작업 목록:**
- `src/components/todo/TodoFilter.jsx` — 상태 필터, 카테고리 필터, 초기화 버튼
- `src/components/todo/TodoList.jsx` — 할일 카드 목록, 로딩/오류/빈 상태, 할일 추가 버튼

**완료 조건:**
- [ ] 상태 필터 변경 시 목록 자동 갱신
- [ ] 카테고리 필터 드롭다운에 실제 카테고리 목록 표시
- [ ] 빈 목록 시 안내 메시지 표시
- [ ] 로딩 중 `LoadingSpinner` 표시

---

### FE-12 — TodoListPage 통합 구현

**의존성:** FE-05, FE-10, FE-11 | **예상 소요시간:** 2h

**작업 목록:**
- `src/pages/TodoListPage.jsx` — Header + 필터 바 + 할일 목록 + 추가/수정 모달

**완료 조건:**
- [ ] 할일 추가 → 저장 → 목록 업데이트
- [ ] 할일 수정 → 폼에 기존 데이터 미리 채우기 → 저장 → 목록 업데이트
- [ ] 필터 변경 시 목록 자동 갱신
- [ ] 반응형 레이아웃

---

### FE-13 — useCategories 훅 구현

**의존성:** FE-02, FE-03 | **예상 소요시간:** 2h

**작업 목록:**
- `src/api/categoryApi.js` — `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` 함수
- `src/hooks/useCategories.js` — `useCategoriesQuery`, `useCreateCategoryMutation`, `useUpdateCategoryMutation`, `useDeleteCategoryMutation`

**완료 조건:**
- [ ] 카테고리 생성/수정/삭제 후 캐시 자동 갱신
- [ ] `409` 응답 시 오류 메시지 제공

---

### FE-14 — CategoryForm, CategoryList 컴포넌트 구현

**의존성:** FE-04, FE-13 | **예상 소요시간:** 2.5h

**작업 목록:**
- `src/components/category/CategoryForm.jsx` — 이름 입력, 클라이언트 검증 (50자 이내)
- `src/components/category/CategoryList.jsx` — 카테고리 목록, 수정/삭제 버튼, 삭제 확인 모달

**완료 조건:**
- [ ] 삭제 확인 모달에 "소속 할일의 카테고리 분류가 해제됩니다" 안내 문구 표시
- [ ] 이름 51자 입력 시 클라이언트 오류 표시

---

### FE-15 — CategoryPage 통합 구현

**의존성:** FE-05, FE-13, FE-14 | **예상 소요시간:** 2h

**작업 목록:**
- `src/pages/CategoryPage.jsx` — Header + 카테고리 목록 + 추가/수정 모달

**완료 조건:**
- [ ] 카테고리 추가 → 저장 → 목록 업데이트
- [ ] 카테고리 수정 → 폼에 기존 이름 미리 채우기 → 저장 → 목록 업데이트
- [ ] 카테고리 삭제 후 TodoListPage에서 해당 카테고리 필터 항목 제거 확인

---

### FE-16 — 날짜 포맷팅 유틸리티

**의존성:** FE-01 | **예상 소요시간:** 1.5h

**작업 목록:**
- `src/utils/dateFormatter.js` — `formatDate(dateString)`, `formatDueDate(dateString)`, `getDaysUntilDue(dateString)`

**완료 조건:**
- [ ] `formatDate` 다양한 날짜 형식 변환 정상 작동
- [ ] `getDaysUntilDue` 음수/0/양수 반환 정상

---

### FE-17 — 반응형 디자인 검증

**의존성:** FE-12, FE-15 | **예상 소요시간:** 2h

**작업 목록:**
- 모바일(360px, 375px, 414px), 태블릿(768px), 데스크탑(1024px, 1280px, 1440px) 테스트
- 터치 요소 최소 크기 확인 (버튼/링크 48×48px 이상)
- 모바일 햄버거 메뉴 작동 확인

**완료 조건:**
- [ ] 360px에서 가로 스크롤 없이 모든 콘텐츠 표시
- [ ] 1440px에서 데스크탑 레이아웃 정상
- [ ] Chrome, Edge, Safari, Firefox 최신 버전에서 정상 작동

---

### FE-18 — 에러 처리 통합

**의존성:** FE-02, FE-06 | **예상 소요시간:** 2h

**작업 목록:**
- HTTP 상태코드 → 한국어 메시지 매핑 (`400`, `401`, `403`, `404`, `409`, `500`)
- 뮤테이션 에러 핸들링 공통화
- 토스트/스낵바 에러 알림 (커스텀 또는 라이브러리)

**완료 조건:**
- [ ] `409` 시 "이미 사용 중인 항목입니다" 메시지 표시
- [ ] `403` 시 "이 작업을 수행할 권한이 없습니다" 메시지 표시
- [ ] 토큰 만료 시 `/login` 자동 리다이렉트

---

### FE-19 — ESLint 코드 품질 검증

**의존성:** FE-01 ~ FE-18 | **예상 소요시간:** 2h

**작업 목록:**
- 전체 파일 `npm run lint` 실행 및 에러 수정
- `console.log` 디버그 코드 제거
- import 순서 정리

**완료 조건:**
- [ ] `npm run lint` 에러 0개
- [ ] 모든 파일에서 `console.log` 제거됨
- [ ] import 순서 규칙 준수 (외부 → 내부)

---

### FE-20 — 통합 테스트 및 전체 검증

**의존성:** FE-01 ~ FE-19, BE-04 ~ BE-07 | **예상 소요시간:** 3h

**작업 목록:**
- 사용자 시나리오 검증 (docs/1-user-scenario.md 기준)
  - SC-A-01, SC-A-02, SC-B-01, SC-B-02 (정상 흐름)
  - SC-E-01 ~ SC-E-14 (예외 시나리오)
- 토큰 자동 갱신 흐름 검증
- 카테고리 삭제 후 할일 보존 확인 (DR-06)

**완료 조건:**
- [ ] 정상 흐름 시나리오 4개 (SC-A-01, SC-A-02, SC-B-01, SC-B-02) 모두 통과
- [ ] 예외 시나리오 14개 (SC-E-01 ~ SC-E-14) 모두 정상 처리
- [ ] Access Token 만료 → 자동 갱신 → 원래 요청 성공 확인
- [ ] 카테고리 삭제 후 소속 할일 `category_id = null` + 행 보존 확인
- [ ] 반응형 디자인 360px ~ 1440px 최종 확인

---

## 7. 병렬 실행 가능 Task 그룹

초기 설정 완료 후 아래 그룹은 병렬로 진행 가능합니다.

| 단계 | 병렬 실행 가능 Task |
|---|---|
| 1단계 (기초) | `DB-01`, `BE-01`, `FE-01` |
| 2단계 (설정) | `DB-02`, `DB-03`, `BE-02`, `BE-03`, `FE-02`, `FE-03`, `FE-04`, `FE-09`, `FE-16` |
| 3단계 (핵심) | `BE-05`, `BE-06` 병렬 / `FE-08`, `FE-13` 병렬 |
| 4단계 (검증) | `BE-07`, `FE-17`, `FE-18`, `FE-19` 병렬 |
| 5단계 (완료) | `FE-20` (모든 Task 완료 후) |
