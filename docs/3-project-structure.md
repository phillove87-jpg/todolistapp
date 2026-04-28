# 프로젝트 구조 설계 원칙 — TodoList

**프로젝트명:** TodoList  
**버전:** 1.0  
**참조 문서:** [2-prd.md](./2-prd.md) v1.0

---

## 변경 이력 (Changelog)

| 버전 | 날짜 | 작성자 | 변경 내용 |
|---|---|---|---|
| 1.0 | 2026-04-28 | Chanok | 초안 작성 — 구조 설계 원칙, 레이어 분리, 디렉토리 구조 정의 |

---

## 1. 최상위 공통 원칙 (All Stacks)

### 1.1 3-tier 레이어 간 역할 분리 원칙

1. **Frontend(View)는 표현과 사용자 상호작용에만 집중한다.** 비즈니스 로직을 포함하지 않으며, 서버로부터 받은 데이터를 렌더링하고 사용자 입력을 서버로 전달하는 역할만 수행한다.
2. **Backend API는 비즈니스 규칙의 단일 진실 공급원(Single Source of Truth)이다.** 데이터 검증, 권한 확인, 도메인 연산은 반드시 Backend에서 수행한다.
3. **DB(PostgreSQL)는 데이터 영속성과 정합성 보장에만 집중한다.** 애플리케이션 로직이 SQL 내부(함수, 트리거)에 삽입되는 것을 금지한다.

### 1.2 JavaScript 단일 언어 사용 원칙

1. **Frontend와 Backend 모두 JavaScript(ES2022+)만 사용한다. TypeScript는 도입하지 않는다.**  
   이유: Phase 1은 빠른 배포(2026-04-30)가 목표이며, 소규모 팀에서 TypeScript 컴파일 설정과 타입 정의 유지 비용이 개발 속도보다 크다. 코드 품질은 ESLint와 JSDoc 주석으로 보완한다.
2. **Frontend와 Backend 간 동일한 언어를 사용함으로써 컨텍스트 전환 비용을 최소화한다.**

### 1.3 단방향 의존성 원칙

1. **의존 방향은 상위 레이어 → 하위 레이어로만 허용된다.**  
   `Frontend → Backend API → Repository → DB` 방향으로만 호출이 가능하다.
2. **하위 레이어는 상위 레이어를 절대 참조하지 않는다.**  
   이유: 역방향 의존성이 생기면 순환 참조와 테스트 격리 불가 문제가 발생한다.
3. **동일 레이어 내 횡단 의존(형제 모듈 간 직접 호출)은 공통 유틸리티 레이어를 통해서만 허용한다.**

### 1.4 관심사 분리(SoC) 원칙

1. **한 파일(모듈)은 하나의 책임만 갖는다.** 라우팅 파일에 비즈니스 로직을 작성하지 않고, 컴포넌트 파일에 API 호출 로직을 직접 작성하지 않는다.
2. **스타일, 마크업, 로직을 서로 다른 관심사로 취급한다.** Tailwind CSS 클래스는 JSX 내에서 사용하되, 복잡한 조건부 클래스 조합은 별도 유틸리티 함수로 분리한다.
3. **설정값과 구현 코드를 분리한다.** 환경별 설정은 `.env` 파일에서 관리하며, 코드에 하드코딩하지 않는다.

### 1.5 단순성 우선 원칙 (YAGNI, KISS)

1. **현재 요구사항에 없는 기능을 미리 구현하지 않는다(YAGNI).** Phase 2 기능(다크 모드, 다국어)을 위한 추상화 레이어를 Phase 1에 미리 추가하지 않는다.
2. **가장 단순한 해결책을 우선 선택한다(KISS).** 추상화·패턴 적용은 반복이 3회 이상 발생할 때 도입을 검토한다.
3. **라이브러리 도입은 명확한 필요성이 확인된 경우에만 허용한다.** 직접 구현으로 충분한 기능을 위해 외부 의존성을 추가하지 않는다.

---

## 2. 의존성/레이어 원칙

### 2.1 Frontend 레이어 분리

| 레이어 | 기술 | 책임 | 금지 사항 |
|---|---|---|---|
| UI 컴포넌트 | React 19 | DOM 렌더링, 사용자 이벤트 처리, props/state에 따른 화면 표현 | API 직접 호출 금지, 비즈니스 로직 금지 |
| 서버 상태 | TanStack Query | 서버 데이터 캐싱·동기화·리페치, API 요청의 로딩·에러 상태 관리 | 클라이언트 전용 UI 상태 관리 금지 |
| 클라이언트 상태 | Zustand | 인증 상태(토큰·사용자 정보), UI 전역 상태(선택된 필터 등) | 서버에서 가져올 수 있는 데이터 중복 저장 금지 |
| API 클라이언트 | fetch (Wrapper) | HTTP 요청 생성, 공통 헤더 설정, 토큰 자동 첨부, 토큰 갱신 처리 | 비즈니스 로직 금지, UI 렌더링 직접 제어 금지 |

**레이어 간 호출 방향:**

```
UI 컴포넌트 → TanStack Query Hook → API 클라이언트(fetch) → Backend API
UI 컴포넌트 → Zustand Store  (클라이언트 전용 상태)
```

### 2.2 Backend 레이어 분리

| 레이어 | 책임 | 금지 사항 |
|---|---|---|
| Router | URL 매핑, HTTP 메서드 매핑, 미들웨어 체인 연결 | 비즈니스 로직 금지, DB 접근 금지 |
| Controller | 요청 파싱(req), 입력 유효성 검증, Service 호출, 응답 직렬화(res) | DB 직접 접근 금지, 복잡한 도메인 연산 금지 |
| Service | 비즈니스 규칙 구현, 도메인 연산, 권한 검증, 여러 Repository 조합 | DB 드라이버(pg) 직접 사용 금지 |
| Repository | SQL 쿼리 실행, DB 결과를 plain object로 반환 | 비즈니스 로직 금지, HTTP 개념(req/res) 참조 금지 |
| DB | 데이터 저장, 인덱스, 제약 조건 | 애플리케이션 로직(함수·트리거) 금지 |

**레이어 간 호출 방향:**

```
Router → Controller → Service → Repository → DB(pg)
```

### 2.3 레이어 간 데이터 전달 규칙

1. **레이어 간 데이터는 plain object(DTO)로 전달한다.** 클래스 인스턴스나 DB Row 객체를 그대로 상위 레이어로 올리지 않는다.
2. **Repository는 DB 컬럼명(snake_case)을 camelCase로 변환하여 반환한다.** 상위 레이어에서 DB 컬럼명을 직접 참조하지 않는다.
3. **Controller는 클라이언트에 반환할 응답 객체를 명시적으로 구성한다.** Service의 반환값을 그대로 `res.json()`에 전달하지 않는다.
4. **민감 정보(비밀번호 해시 등)는 Repository에서 SELECT하더라도 Controller 응답에 포함하지 않는다.**

---

## 3. 코드/네이밍 원칙

### 3.1 파일명 컨벤션

| 대상 | 컨벤션 | 예시 |
|---|---|---|
| React 컴포넌트 파일 | PascalCase | `TodoCard.jsx`, `LoginForm.jsx` |
| React 페이지 파일 | PascalCase + Page 접미사 | `TodoListPage.jsx`, `LoginPage.jsx` |
| Hook 파일 | camelCase + use 접두사 | `useTodos.js`, `useAuth.js` |
| Zustand store 파일 | camelCase + Store 접미사 | `authStore.js`, `filterStore.js` |
| Backend 모듈 파일 | camelCase + 레이어 접미사 | `todoRouter.js`, `todoController.js`, `todoService.js`, `todoRepository.js` |
| 설정/유틸 파일 | camelCase | `dbClient.js`, `jwtHelper.js`, `errorHandler.js` |
| 환경 설정 파일 | 소문자 + 점 구분 | `.env`, `.env.example` |

### 3.2 함수/변수/상수 네이밍

1. **함수와 변수는 camelCase를 사용한다.** 예: `getTodos`, `isLoading`, `userId`
2. **모든 상수는 UPPER_SNAKE_CASE를 사용한다.** 예: `MAX_TITLE_LENGTH = 100`, `JWT_ALGORITHM = 'HS512'`
3. **boolean 변수/함수는 `is`, `has`, `can` 접두사를 사용한다.** 예: `isAuthenticated`, `hasCategory`, `canDelete`
4. **비동기 함수는 `async` 키워드를 명시하고, 콜백 패턴 대신 `async/await`를 사용한다.**

### 3.3 React 컴포넌트 네이밍

1. **컴포넌트 함수명과 파일명은 PascalCase로 일치시킨다.** 예: `function TodoCard()` → `TodoCard.jsx`
2. **props는 camelCase로 정의한다.** 예: `onDelete`, `isCompleted`, `categoryId`
3. **이벤트 핸들러 함수는 `handle` 접두사를 사용한다.** 예: `handleSubmit`, `handleDelete`, `handleToggle`

### 3.4 API 엔드포인트 네이밍 (REST 규칙)

| HTTP 메서드 | 패턴 | 예시 | 동작 |
|---|---|---|---|
| GET | `/api/리소스복수형` | `GET /api/todos` | 목록 조회 |
| GET | `/api/리소스복수형/:id` | `GET /api/todos/:id` | 단건 조회 |
| POST | `/api/리소스복수형` | `POST /api/todos` | 생성 |
| PATCH | `/api/리소스복수형/:id` | `PATCH /api/todos/:id` | 부분 수정 |
| DELETE | `/api/리소스복수형/:id` | `DELETE /api/todos/:id` | 삭제 |

- **리소스명은 복수형 소문자 영어 명사를 사용한다.** 예: `todos`, `categories`, `users`
- **인증 관련 엔드포인트는 `/api/auth` 접두사를 사용한다.** 예: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`

### 3.5 DB 컬럼명

1. **모든 DB 테이블명과 컬럼명은 snake_case를 사용한다.** 예: `created_at`, `category_id`, `is_completed`
2. **기본키는 `id`로 통일하며, 외래키는 `참조테이블단수형_id` 형식을 따른다.** 예: `user_id`, `category_id`
3. **논리적 삭제(soft delete)는 사용하지 않는다. 삭제는 물리 삭제(hard delete)만 허용한다.**

### 3.6 코드 주석 원칙

1. **주석은 WHY(왜 이렇게 했는지)만 작성하고, WHAT(무엇을 하는지)은 작성하지 않는다.**  
   이유: WHAT은 코드 자체가 표현해야 하며, 주석이 코드와 불일치할 때 혼란을 야기한다.
2. **공개 API 함수에는 JSDoc 주석으로 `@param`, `@returns` 태그를 포함한다.**
3. **TODO 주석은 `// TODO: [날짜] 작업 내용` 형식으로 작성하고, 방치하지 않는다.**

### 3.7 import 순서 규칙

아래 순서를 준수하며, 각 그룹 사이에는 빈 줄 하나를 삽입한다.

```javascript
// 1. Node.js 내장 모듈
import path from 'path';

// 2. 외부 npm 패키지
import express from 'express';
import { useQuery } from '@tanstack/react-query';

// 3. 내부 절대 경로 모듈 (별칭 사용 시)
import { db } from '@/lib/dbClient.js';

// 4. 내부 상대 경로 모듈
import { TodoCard } from './TodoCard.jsx';
import { formatDate } from '../utils/formatDate.js';
```

---

## 4. 테스트/품질 원칙

### 4.1 Phase 1 테스트 전략

Phase 1의 목표는 빠른 배포이므로, 핵심 비즈니스 로직에만 집중하는 최소 테스트 전략을 채택한다. 전면적인 커버리지보다 리스크가 높은 영역을 선별하여 테스트한다.

### 4.2 Backend 단위 테스트 대상

1. **Service 레이어 함수를 단위 테스트의 핵심 대상으로 삼는다.**  
   이유: 비즈니스 규칙이 Service에 집중되므로, 이 레이어 검증이 가장 높은 리스크를 커버한다.
2. **필수 테스트 대상 함수:**
   - 할일 상태 계산 로직 (완료/진행 중/기간 초과 분류)
   - 소유권 검증 로직 (타인 데이터 접근 차단)
   - 토큰 발급 및 검증 로직
3. **Repository 레이어는 실제 DB 연결 없이 단위 테스트하지 않는다.** 통합 테스트로 검증한다.

### 4.3 Frontend 컴포넌트 테스트 대상

1. **테스트 대상을 핵심 공통 컴포넌트로 한정한다.**
   - 인증 필요 라우트 보호 로직 (`PrivateRoute`)
   - 할일 상태 표시 컴포넌트 (상태에 따른 스타일 변화)
2. **모든 UI 컴포넌트에 대한 스냅샷 테스트는 Phase 1에서 적용하지 않는다.**

### 4.4 테스트 파일 위치 규칙

1. **테스트 파일은 소스 파일과 동일한 디렉토리에 배치한다(코로케이션).**
2. **테스트 파일명은 소스 파일명에 `.test.js` 접미사를 붙인다.**  
   예: `todoService.js` → `todoService.test.js`
3. **테스트 픽스처·목(mock) 데이터는 해당 테스트 파일과 같은 디렉토리 또는 `__mocks__` 폴더에 배치한다.**

### 4.5 ESLint 코드 품질 규칙

| 규칙 | 설정 | 이유 |
|---|---|---|
| `no-unused-vars` | error | 미사용 변수는 코드 오염의 신호 |
| `no-console` | warn | 구조화 로그로 대체. 개발 중 임시 사용만 허용 |
| `no-undef` | error | 미선언 변수 참조는 런타임 오류의 원인 |
| `eqeqeq` | error | `==` 대신 `===` 강제 |
| `no-var` | error | `var` 금지, `const`/`let`만 허용 |
| `prefer-const` | error | 재할당 없는 변수는 `const` 강제 |
| `no-return-await` | error | 불필요한 `async/await` 중복 금지 |

### 4.6 커밋 전 필수 통과 조건

1. ESLint 검사 통과 (에러 0개)
2. 해당 변경과 관련된 기존 테스트 전체 통과
3. 신규 비즈니스 로직에 대한 테스트 코드 포함
4. `console.log` 디버그 코드 제거 확인

---

## 5. 설정/보안/운영 원칙

### 5.1 환경변수 관리

**파일 구조:**

```
backend/
  .env              # 실제 환경변수 (git 제외)
  .env.example      # 환경변수 키 목록 — 값 없음 (git 포함)
frontend/
  .env              # 실제 환경변수 (git 제외)
  .env.example      # 환경변수 키 목록 — 값 없음 (git 포함)
```

**Backend 필수 환경변수 (`backend/.env.example`):**

```
# 데이터베이스
DB_HOST=
DB_PORT=5432
DB_NAME=todolistapp
DB_USER=
DB_PASSWORD=

# JWT
JWT_SECRET=          # 최소 32바이트 랜덤 문자열
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d

# 서버
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Frontend 필수 환경변수 (`frontend/.env.example`):**

```
# API 서버
VITE_API_BASE_URL=http://localhost:3000
```

### 5.2 .gitignore 원칙

1. **`.env` 파일은 반드시 `.gitignore`에 포함한다.**  
   이유: JWT Secret·DB 비밀번호가 버전 관리 시스템에 노출되면 복구 불가능한 보안 사고가 발생한다.
2. **`.env.example` 파일은 반드시 git에 포함한다.** 신규 개발자가 필요한 환경변수 목록을 파악할 수 있어야 한다.
3. **`node_modules/`, 빌드 결과물(`dist/`, `build/`)도 git에서 제외한다.**

### 5.3 JWT Secret 관리 원칙

1. **JWT_SECRET을 코드에 하드코딩하는 것을 엄격히 금지한다.**
2. **JWT_SECRET은 최소 32바이트(256비트) 랜덤 값으로 생성한다.**  
   생성 예: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
3. **HS-512 알고리즘을 사용한다.** HS-256보다 강력한 서명 강도를 제공한다.
4. **Access Token 유효 기간은 1시간, Refresh Token 유효 기간은 7일로 설정한다.**

### 5.4 비밀번호 저장 원칙

1. **비밀번호는 반드시 bcrypt로 해시하여 저장한다. 평문 저장을 엄격히 금지한다.**
2. **bcrypt cost factor는 최소 12를 사용한다.**  
   이유: 10 미만은 현대 하드웨어에서 브루트포스에 취약하다.
3. **비밀번호 해시값은 API 응답이나 로그에 절대 포함하지 않는다.**

### 5.5 API 에러 응답 형식 통일

모든 API 오류 응답은 아래 형식을 따른다.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "제목은 100자 이내로 입력해 주세요."
  }
}
```

| HTTP 상태코드 | 사용 상황 |
|---|---|
| 400 | 입력 유효성 검증 실패 |
| 401 | 인증 실패 (토큰 없음·만료·유효하지 않음) |
| 403 | 권한 없음 (타인 리소스 접근 시도) |
| 404 | 리소스를 찾을 수 없음 |
| 409 | 중복 데이터 충돌 (이메일 중복, 카테고리명 중복) |
| 500 | 서버 내부 오류 |

### 5.6 CORS 설정 원칙

1. **와일드카드(`*`) CORS 허용을 금지한다.** 허용된 출처(`CORS_ORIGIN`)만 명시적으로 설정한다.
2. **인증 헤더 포함 요청을 위해 `credentials: true`를 설정한다.**
3. **허용 HTTP 메서드는 실제 사용하는 메서드만 명시한다.** `GET, POST, PATCH, DELETE, OPTIONS`

### 5.7 로그 원칙

1. **`console.log`를 운영 코드에 사용하는 것을 금지한다.**  
   이유: 구조화되지 않은 로그는 운영 환경에서 분석이 불가능하고 성능 저하를 유발한다.
2. **구조화 로그 라이브러리(예: `pino`)를 사용한다.** 로그 레벨, 타임스탬프, 요청 ID를 포함한 JSON 형식으로 출력한다.
3. **로그 레벨 기준:**
   - `info`: 정상적인 주요 이벤트 (로그인 성공, CRUD 완료)
   - `warn`: 예상 가능한 오류 (유효성 검증 실패, 401/403)
   - `error`: 예상치 못한 서버 오류 (DB 연결 실패, 500)
4. **개인정보(이메일, 비밀번호)를 로그에 포함하지 않는다.**

---

## 6. 디렉토리 구조

### 6.1 루트 레벨 구조 (모노레포)

```
todolistapp/                    # 프로젝트 루트
  frontend/                     # React 19 프론트엔드 앱
  backend/                      # Express 5 백엔드 API 서버
  docs/                         # 프로젝트 문서 (PRD, 설계 원칙 등)
  .gitignore                    # 전역 git 제외 파일 목록
  README.md                     # 프로젝트 개요 및 실행 방법
```

---

### 6.2 Frontend 디렉토리 구조 (`frontend/`)

```
frontend/
  public/                           # 정적 파일 (favicon, robots.txt 등)
  src/
    api/                            # API 클라이언트 레이어
      client.js                     # fetch 래퍼 — 공통 헤더, 토큰 첨부, 토큰 자동 갱신, 에러 처리
      authApi.js                    # 인증 API 호출 함수 (login, register, logout, refresh)
      todoApi.js                    # 할일 API 호출 함수 (getTodos, createTodo, updateTodo, deleteTodo)
      categoryApi.js                # 카테고리 API 호출 함수 (getCategories, createCategory 등)
    hooks/                          # TanStack Query 커스텀 훅 (서버 상태 관리)
      useTodos.js                   # 할일 목록 조회·뮤테이션 훅 (useQuery, useMutation)
      useCategories.js              # 카테고리 조회·뮤테이션 훅
      useAuth.js                    # 인증 뮤테이션 훅 (로그인, 로그아웃)
    store/                          # Zustand 클라이언트 상태 저장소
      authStore.js                  # 인증 상태 (accessToken, user 정보, isAuthenticated)
      filterStore.js                # UI 필터 상태 (선택된 카테고리, 선택된 상태 필터)
    components/                     # 재사용 가능한 공통 UI 컴포넌트
      common/                       # 범용 공통 컴포넌트
        Button.jsx                  # 공통 버튼 (variant: primary / secondary / danger)
        Input.jsx                   # 공통 입력 필드
        Modal.jsx                   # 공통 모달
        LoadingSpinner.jsx          # 로딩 인디케이터
        ErrorMessage.jsx            # 에러 메시지 표시
      layout/                       # 레이아웃 컴포넌트
        Header.jsx                  # 상단 네비게이션 바 (로그아웃 버튼 포함)
        PrivateRoute.jsx            # 인증 필요 라우트 보호 (미인증 시 /login 리다이렉트)
      todo/                         # 할일 관련 컴포넌트
        TodoList.jsx                # 할일 목록 컨테이너
        TodoCard.jsx                # 할일 카드 단일 아이템 (상태 배지, 완료 토글)
        TodoForm.jsx                # 할일 생성/수정 폼
        TodoFilter.jsx              # 상태·카테고리 필터
      category/                     # 카테고리 관련 컴포넌트
        CategoryList.jsx            # 카테고리 목록
        CategoryForm.jsx            # 카테고리 생성/수정 폼
    pages/                          # 페이지 컴포넌트 (라우트와 1:1 매핑)
      LoginPage.jsx                 # 로그인 화면 (/login)
      RegisterPage.jsx              # 회원 가입 화면 (/register)
      TodoListPage.jsx              # 할일 목록 메인 화면 (/)
      CategoryPage.jsx              # 카테고리 관리 화면 (/categories)
    utils/                          # 순수 유틸리티 함수 (외부 의존성 없음)
      tokenStorage.js               # 토큰 저장·조회·삭제 (localStorage 캡슐화)
      dateFormatter.js              # 날짜 포맷팅
      todoStatusCalculator.js       # 할일 상태 계산 (완료/진행 중/기간 초과)
    constants/                      # 상수 정의
      apiEndpoints.js               # API 엔드포인트 경로 상수
      todoStatus.js                 # 할일 상태 코드 상수 (COMPLETED, IN_PROGRESS, OVERDUE)
    App.jsx                         # 루트 컴포넌트 — 라우터 설정, QueryClient Provider
    main.jsx                        # React 앱 진입점 (ReactDOM.createRoot)
    index.css                       # Tailwind CSS 기본 지시어 (@tailwind base/components/utilities)
  .env                              # 환경변수 (git 제외)
  .env.example                      # 환경변수 키 목록 (git 포함)
  .eslintrc.js                      # ESLint 설정
  vite.config.js                    # Vite 빌드 설정
  package.json                      # 의존성 및 스크립트
```

---

### 6.3 Backend 디렉토리 구조 (`backend/`)

```
backend/
  src/
    routes/                         # Express Router — URL 매핑 및 미들웨어 체인 정의
      index.js                      # 루트 라우터 — 모든 하위 라우터 마운트 (/api)
      authRoutes.js                 # 인증 라우트 (/api/auth/login, /register, /logout, /refresh)
      todoRoutes.js                 # 할일 라우트 (/api/todos, /api/todos/:id)
      categoryRoutes.js             # 카테고리 라우트 (/api/categories, /api/categories/:id)
    controllers/                    # 요청 파싱, 입력 검증, 응답 직렬화
      authController.js             # 인증 요청 처리 (register, login, logout, refresh)
      todoController.js             # 할일 CRUD 요청 처리
      categoryController.js         # 카테고리 CRUD 요청 처리
    services/                       # 비즈니스 로직 및 도메인 규칙 구현
      authService.js                # 인증 비즈니스 로직 (비밀번호 검증, 토큰 발급)
      todoService.js                # 할일 비즈니스 로직 (상태 계산, 소유권 검증)
      categoryService.js            # 카테고리 비즈니스 로직 (중복 검증, 연관 할일 처리)
    repositories/                   # SQL 쿼리 실행 및 DB 결과 반환 (pg Raw SQL)
      userRepository.js             # 사용자 데이터 CRUD
      todoRepository.js             # 할일 데이터 CRUD
      categoryRepository.js         # 카테고리 데이터 CRUD
    middlewares/                    # Express 미들웨어
      authMiddleware.js             # JWT Access Token 검증, req.user 주입
      errorHandler.js               # 전역 에러 핸들러 — 통일된 에러 응답 형식 반환
      validateRequest.js            # 요청 바디·파라미터 유효성 검증
      requestLogger.js              # 요청 로깅 (구조화 로그)
    config/                         # 설정 모듈
      env.js                        # 환경변수 로드·검증 (필수값 누락 시 서버 시작 차단)
      corsConfig.js                 # CORS 옵션 설정
    db/                             # 데이터베이스 연결
      dbClient.js                   # pg Pool 인스턴스 생성 및 내보내기
      schema.sql                    # DB 테이블 생성 DDL (개발 참조용)
    utils/                          # 순수 유틸리티 함수
      jwtHelper.js                  # JWT 발급(sign)·검증(verify)
      passwordHelper.js             # bcrypt 해시·비교
      logger.js                     # 구조화 로거 인스턴스 (pino 래퍼)
    app.js                          # Express 앱 설정 — 미들웨어 등록, 라우터 마운트
    server.js                       # HTTP 서버 시작 진입점 (app.listen)
  .env                              # 환경변수 (git 제외)
  .env.example                      # 환경변수 키 목록 (git 포함)
  .eslintrc.js                      # ESLint 설정
  package.json                      # 의존성 및 스크립트

```

---

## 참조 문서

- [2-prd.md](./2-prd.md) v1.0 — 제품 요구사항 정의서
- [1-domain-definition.md](./1-domain-definition.md) v0.3 — 도메인 정의서
