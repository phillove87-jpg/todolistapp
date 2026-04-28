-- =============================================================
-- TodoList — Database Schema
-- 참조: docs/4-erd.md v1.0
-- 작성일: 2026-04-28
-- DB: PostgreSQL (최신 LTS)
-- =============================================================

-- -------------------------------------------------------------
-- 0. 확장 모듈
-- -------------------------------------------------------------

-- UUID 생성 함수 (gen_random_uuid) 활성화
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- -------------------------------------------------------------
-- 1. 테이블 생성
--    생성 순서: users → categories → todos (FK 참조 순서)
-- -------------------------------------------------------------

-- 1-1. users
CREATE TABLE IF NOT EXISTS users (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,           -- bcrypt 해시 저장 (평문 금지)
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- 1-2. categories
CREATE TABLE IF NOT EXISTS categories (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(50)  NOT NULL,
    user_id     UUID        NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE                        -- 사용자 삭제 시 카테고리 전체 삭제
);

-- 1-3. todos
CREATE TABLE IF NOT EXISTS todos (
    id           UUID        NOT NULL DEFAULT gen_random_uuid(),
    title        VARCHAR(100) NOT NULL,
    description  TEXT,                           -- Nullable: 선택 입력
    user_id      UUID        NOT NULL,
    category_id  UUID,                           -- Nullable: 카테고리 미지정 허용
    due_date     TIMESTAMPTZ,                    -- Nullable: 마감일 미입력 허용 (DR-07)
    is_completed BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_todos PRIMARY KEY (id),
    CONSTRAINT fk_todos_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,                       -- 사용자 삭제 시 할일 전체 삭제
    CONSTRAINT fk_todos_category
        FOREIGN KEY (category_id)
        REFERENCES categories (id)
        ON DELETE SET NULL                       -- 카테고리 삭제 시 category_id = NULL (ADR-01)
);


-- -------------------------------------------------------------
-- 2. 인덱스
-- -------------------------------------------------------------

-- 카테고리: 동일 사용자 내 이름 중복 방지 (DR-05)
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_user_name
    ON categories (user_id, name);

-- 할일: 사용자별 목록 조회 성능
CREATE INDEX IF NOT EXISTS idx_todos_user_id
    ON todos (user_id);

-- 할일: 카테고리별 필터링 성능
CREATE INDEX IF NOT EXISTS idx_todos_category_id
    ON todos (category_id);

-- 할일: 상태 필터링 성능 (is_completed + due_date 복합, DR-03/04)
CREATE INDEX IF NOT EXISTS idx_todos_status_filter
    ON todos (user_id, is_completed, due_date);


-- -------------------------------------------------------------
-- 3. updated_at 자동 갱신 트리거
--    todos 행 수정 시 updated_at 을 현재 시각으로 자동 업데이트
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
