# 기술 아키텍처 다이어그램 — TodoList

**버전:** 1.0  
**작성일:** 2026-04-28  
**참조 문서:** 2-prd.md v1.0, 3-project-structure.md v1.0

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|---|---|---|---|
| 1.0 | 2026-04-28 | Chanok | 초안 작성 |

---

## 1. 시스템 전체 구조

```mermaid
graph TD
    Browser["Browser\n(사용자)"]
    Frontend["Frontend\nReact 19 / Vite"]
    Backend["Backend API\nExpress 5 / Node 24"]
    DB["PostgreSQL"]

    Browser -->|"HTTP/REST"| Frontend
    Frontend -->|"HTTP/REST"| Backend
    Backend -->|"SQL"| DB
```

---

## 2. Frontend 레이어 구조

```mermaid
graph LR
    Store["Zustand Store\n(인증·필터 상태)"]
    Page["Page\n(TodoListPage 등)"]
    Component["Component\n(TodoCard 등)"]
    Hook["Hook\nTanStack Query"]
    API["API Client\nfetch Wrapper"]
    Backend["Backend API"]

    Store -->|"읽기/쓰기"| Page
    Store -->|"읽기/쓰기"| Component
    Page --> Component
    Component --> Hook
    Hook --> API
    API -->|"HTTP/REST"| Backend
```

---

## 3. Backend 레이어 구조

```mermaid
graph LR
    Middleware["Middleware\n(Auth / ErrorHandler)"]
    Router["Router\n(Express Router)"]
    Controller["Controller"]
    Service["Service\n(비즈니스 로직)"]
    Repository["Repository\n(Raw SQL / pg)"]
    DB["PostgreSQL"]

    Middleware -->|"적용"| Router
    Router --> Controller
    Controller --> Service
    Service --> Repository
    Repository -->|"SQL"| DB
```

---

## 4. 인증 흐름

```mermaid
sequenceDiagram
    participant Browser
    participant Frontend
    participant Backend
    participant DB

    Browser->>Frontend: 이메일·비밀번호 입력 후 로그인
    Frontend->>Backend: POST /api/auth/login
    Backend->>DB: 사용자 조회 및 비밀번호 검증
    DB-->>Backend: 사용자 정보 반환
    Backend-->>Frontend: Access Token(1h) + Refresh Token(7d) 발급
    Frontend->>Frontend: 토큰 저장 (Zustand / localStorage)

    Note over Browser,Backend: 이후 일반 API 요청

    Frontend->>Backend: API 요청 + Authorization: Bearer <accessToken>
    Backend-->>Frontend: 정상 응답

    Note over Browser,Backend: Access Token 만료 시 자동 갱신

    Frontend->>Backend: API 요청 → 401 응답 수신
    Frontend->>Backend: POST /api/auth/refresh (Refresh Token 전송)
    Backend-->>Frontend: 새 Access Token 발급
    Frontend->>Backend: 원래 요청 재시도 → 정상 응답
```

---

## 5. 핵심 도메인 엔티티 관계

```mermaid
erDiagram
    User {
        UUID id PK
        string email
        string password
        datetime created_at
    }

    Category {
        UUID id PK
        string name
        UUID user_id FK
    }

    Todo {
        UUID id PK
        string title
        boolean is_completed
        datetime due_date
        UUID user_id FK
        UUID category_id FK
    }

    User ||--o{ Todo : "소유"
    User ||--o{ Category : "소유"
    Category ||--o{ Todo : "분류(nullable)"
```
