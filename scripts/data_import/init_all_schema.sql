-- ============================================================================
-- job_graph 数据库完整初始化 schema
-- 根据项目 Java 实体、full_app.py SQL 查询、已有 SQL 脚本逆向推导生成
-- 执行顺序：本文件(建表) → data.sql → insert_jobs.sql → add_columns.sql → import_job_data_fixed.sql
-- ============================================================================

-- 1. 角色表
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_description VARCHAR(200)
);

-- 2. 用户表（三端统一）
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(200),
    real_name VARCHAR(100),
    role_id BIGINT REFERENCES user_roles(id),
    status INTEGER DEFAULT 1,
    phone VARCHAR(50),
    avatar TEXT,
    bio TEXT,
    -- 学生扩展字段
    student_id VARCHAR(50),
    school_name VARCHAR(200),
    major VARCHAR(200),
    grade VARCHAR(50),
    graduation_year INTEGER,
    -- 学校扩展字段
    school_code VARCHAR(50),
    school_type VARCHAR(50),
    address TEXT,
    website TEXT,
    -- 企业扩展字段
    company_code VARCHAR(50),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    contact_person VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role_id);

-- 3. 岗位表（job_postings）
CREATE TABLE IF NOT EXISTS job_postings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    company_name VARCHAR(200),
    company_id BIGINT,
    department VARCHAR(200),
    location VARCHAR(200),
    job_type VARCHAR(50),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_unit VARCHAR(20),
    salary_extension VARCHAR(100),
    experience_required VARCHAR(100),
    education_required VARCHAR(100),
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    welfare_list TEXT,
    welfarelist TEXT, -- 旧字段兼容 import_job_data_fixed.sql
    skills TEXT,
    tags TEXT,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(200),
    status VARCHAR(30) DEFAULT 'active',
    priority_level INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    deadline TIMESTAMP,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_remote_work BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS job_postings_status_idx ON job_postings(status);
CREATE INDEX IF NOT EXISTS job_postings_company_idx ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS job_postings_title_idx ON job_postings(title);

-- 4. 简历申请表
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES job_postings(id) ON DELETE CASCADE,
    job_title VARCHAR(300),
    company_name VARCHAR(200),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(100),
    user_email VARCHAR(200),
    resume_content TEXT,
    cover_letter TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    status_display_name VARCHAR(50),
    notes TEXT,
    applied_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    job_location VARCHAR(200),
    job_type VARCHAR(50),
    salary_range VARCHAR(100),
    department VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS applications_job_idx ON applications(job_id);
CREATE INDEX IF NOT EXISTS applications_user_idx ON applications(user_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);

-- 5. 面试记录表
CREATE TABLE IF NOT EXISTS interview_records (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    job_id BIGINT,
    job_title VARCHAR(300),
    company_name VARCHAR(200),
    interview_type VARCHAR(30),
    status VARCHAR(30),
    score NUMERIC(5,2),
    feedback TEXT,
    scheduled_time TIMESTAMP,
    location VARCHAR(300),
    interviewers TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS interviews_user_idx ON interview_records(user_id);

-- 6. 视频面试记录表
CREATE TABLE IF NOT EXISTS video_interview_records (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300),
    mode VARCHAR(50),
    video_path TEXT,
    transcript TEXT,
    feedback TEXT,
    score NUMERIC(5,2),
    details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS video_interviews_user_idx ON video_interview_records(user_id);

-- 7. 简历分析记录表
CREATE TABLE IF NOT EXISTS resume_analysis_records (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    resume_file_name VARCHAR(300),
    resume_content TEXT,
    analysis_result JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS resume_analysis_user_idx ON resume_analysis_records(user_id);
