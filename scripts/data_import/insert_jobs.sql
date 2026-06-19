-- ============================================
-- 插入岗位数据
-- 在 pgAdmin 的 Query Tool 中执行此脚本
-- ============================================

-- 先确保有 company 用户（如果 data.sql 已执行则已存在）
-- 获取 company 用户的 role_id
DO $$
DECLARE
    v_company_role_id BIGINT;
    v_company_user_id BIGINT;
BEGIN
    -- 获取 company 角色 ID
    SELECT id INTO v_company_role_id FROM user_roles WHERE role_name = 'company';
    
    IF v_company_role_id IS NULL THEN
        INSERT INTO user_roles (role_name, role_description) VALUES ('company', '企业用户') RETURNING id INTO v_company_role_id;
    END IF;

    -- 获取或创建 company1 用户
    SELECT id INTO v_company_user_id FROM users WHERE username = 'company1';
    
    IF v_company_user_id IS NULL THEN
        INSERT INTO users (username, password, email, real_name, role_id, status) 
        VALUES ('company1', 'e10adc3949ba59abbe56e057f20f883e', 'company@test.com', '测试企业', v_company_role_id, 1)
        RETURNING id INTO v_company_user_id;
    END IF;

    -- 插入岗位数据
    INSERT INTO job_postings (title, company_name, company_id, department, location, job_type, salary_min, salary_max, salary_unit, experience_required, education_required, description, requirements, status, priority_level, view_count, application_count, is_urgent, is_remote_work, created_at, updated_at, published_at)
    VALUES 
    ('产品经理', '美团', v_company_user_id, '产品部', '北京', '全职', 10, 25, '月薪', '1-3年', '本科', '负责产品规划和设计，协调各部门推进产品开发', '产品设计经验,用户体验设计,数据分析能力', 'active', 4, 1, 1, FALSE, FALSE, NOW(), NOW(), NOW()),
    ('前端工程师', '商汤科技', v_company_user_id, '技术部', '广州', '全职', 6, 16, '月薪', '应届生', '本科及以上', '写前端', '会写前端', 'active', 3, 0, 1, FALSE, FALSE, NOW(), NOW(), NOW()),
    ('全栈工程师', '科大讯飞', v_company_user_id, '技术部', '广州', '全职', 8, 24, '月薪', '应届生', '本科及以上', '全栈', '全栈', 'active', 3, 0, 1, FALSE, FALSE, NOW(), NOW(), NOW()),
    ('算法工程师', '京东', v_company_user_id, '技术部', '广州', '全职', 10, 20, '月薪', '应届生', '本科及以上', '算法工程师', '算法工程师', 'active', 3, 0, 0, FALSE, FALSE, NOW(), NOW(), NOW()),
    ('云计算工程师', '百度', v_company_user_id, '技术部', '广州', '全职', 15, 25, '月薪', '应届生', '本科及以上', '云计算工程师', '云计算工程师', 'active', 3, 1, 1, FALSE, FALSE, NOW(), NOW(), NOW()),
    ('后端开发工程师', '腾讯科技', v_company_user_id, '技术部', '深圳', '全职', 8, 20, '月薪', '应届生', '本科及以上', '写后端代码', '会写后端代码', 'active', 3, 0, 1, FALSE, FALSE, NOW(), NOW(), NOW()),
    ('网络安全工程师', '测试公司', v_company_user_id, '技术部', '东莞', '全职', 10, 20, '月薪', '应届生', '硕士及以上', '写代码', '写代码', 'active', 3, 0, 1, FALSE, FALSE, NOW(), NOW(), NOW());

    RAISE NOTICE '岗位数据插入完成！共插入 7 条岗位记录';
END $$;
