CREATE TABLE IF NOT EXISTS learning_resources (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(200) NOT NULL DEFAULT '公开学习平台',
    category VARCHAR(100) NOT NULL DEFAULT '通用技能',
    resource_type VARCHAR(30) NOT NULL DEFAULT 'article',
    description TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER,
    difficulty_level VARCHAR(30) NOT NULL DEFAULT 'beginner',
    is_free BOOLEAN NOT NULL DEFAULT TRUE,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 4.50,
    tags TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS learning_resources_url_key ON learning_resources (url);
CREATE INDEX IF NOT EXISTS learning_resources_active_idx ON learning_resources (status, category, resource_type);

CREATE TABLE IF NOT EXISTS learning_resource_series (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    provider VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    repository_url TEXT NOT NULL,
    source_site_url TEXT,
    language VARCHAR(20) NOT NULL DEFAULT 'zh-CN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_resource_documents (
    id BIGSERIAL PRIMARY KEY,
    series_id BIGINT NOT NULL REFERENCES learning_resource_series(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    relative_path TEXT NOT NULL,
    local_path TEXT NOT NULL,
    source_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(series_id, relative_path)
);

CREATE INDEX IF NOT EXISTS learning_resource_documents_series_idx ON learning_resource_documents (series_id, sort_order);

CREATE TABLE IF NOT EXISTS chat_history (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL DEFAULT '1',
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('USER', 'ASSISTANT')),
    message_content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS chat_history_user_time_idx ON chat_history (user_id, created_at DESC);
