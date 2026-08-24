#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
interview_records 表补丁：
  - 补全 full_app.py 面试报告接口需要的缺失字段
  - 把现有旧列数据同步到新列名（例如 score -> overall_score, company_name -> company）
"""
import psycopg2

ALTER_SQL = """
-- 1. 补缺失字段（ALTER TABLE ... ADD COLUMN IF NOT EXISTS，可重复执行安全）
ALTER TABLE interview_records ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE interview_records ADD COLUMN IF NOT EXISTS interviewer VARCHAR(200);
ALTER TABLE interview_records ADD COLUMN IF NOT EXISTS company VARCHAR(200);
ALTER TABLE interview_records ADD COLUMN IF NOT EXISTS position VARCHAR(300);
ALTER TABLE interview_records ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE interview_records ADD COLUMN IF NOT EXISTS overall_score NUMERIC(5,2);
ALTER TABLE interview_records ADD COLUMN IF NOT EXISTS strengths TEXT;
ALTER TABLE interview_records ADD COLUMN IF NOT EXISTS weaknesses TEXT;
ALTER TABLE interview_records ADD COLUMN IF NOT EXISTS improvements TEXT;
ALTER TABLE interview_records ADD COLUMN IF NOT EXISTS recommendations TEXT;
ALTER TABLE interview_records ADD COLUMN IF NOT EXISTS analysis_url TEXT;
"""

SYNC_SQL = """
-- 2. 把旧列已有数据同步到新列（NULL 值覆盖安全）
UPDATE interview_records
SET
    overall_score = COALESCE(overall_score, score),
    company       = COALESCE(company, company_name),
    position      = COALESCE(position, job_title),
    interviewer   = COALESCE(interviewer, interviewers);
"""

CHECK_SQL = """
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'interview_records'
ORDER BY ordinal_position;
"""

conn = psycopg2.connect(dbname='job_graph', user='postgres', password='123456@', host='127.0.0.1')
conn.autocommit = False
try:
    cur = conn.cursor()
    print('> Adding missing columns...')
    cur.execute(ALTER_SQL)
    print('> Syncing old-column data to new column names...')
    cur.execute(SYNC_SQL)
    rowcount = cur.rowcount
    print(f'  Rows affected (synced): {rowcount}')
    conn.commit()
    print('\\n> Final interview_records schema:')
    cur.execute(CHECK_SQL)
    for col, dtype in cur.fetchall():
        mark = ' [NEW]' if col in ('video_url','interviewer','company','position','duration','overall_score','strengths','weaknesses','improvements','recommendations','analysis_url') else ''
        print(f'  {col:<22} {dtype}{mark}')
    cur.close()
    print('\n✅ Patch applied successfully!')
except Exception as e:
    conn.rollback()
    print(f'❌ Patch FAILED (rolled back): {e}')
    raise
finally:
    conn.close()
