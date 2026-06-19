-- 添加新字段到 job_postings 表
ALTER TABLE job_postings
ADD COLUMN IF NOT EXISTS salary_extension VARCHAR(100);

ALTER TABLE job_postings
ADD COLUMN IF NOT EXISTS welfare_list TEXT;

-- 更新现有的数据，将薪资信息填充到 salary_extension
UPDATE job_postings
SET salary_extension = salary_extension
WHERE salary_extension IS NULL;

-- 将 benefits 的内容复制到 welfare_list（如果 welfare_list 为空）
UPDATE job_postings
SET welfare_list = benefits
WHERE welfare_list IS NULL AND benefits IS NOT NULL;

SELECT '字段添加完成' AS result;
