import psycopg2
import csv
import os

# 设置环境变量避免编码问题
os.environ['PGPASSWORD'] = '123456@'

conn = None
cur = None

try:
    # 使用DSN连接数据库
    conn = psycopg2.connect("host=localhost dbname=job_graph user=postgres")
    cur = conn.cursor()
    print("成功连接到数据库")

    # 设置客户端编码
    cur.execute("SET client_encoding = 'UTF8';")
    conn.commit()
    print("已设置编码为 UTF-8")

    # 清空表数据
    cur.execute("DELETE FROM job_postings;")
    conn.commit()
    print("已清空表数据")

    # CSV 文件路径
    csv_file = r'E:\BaiduNetdiskDownload\英语四级听力\源代码\mockInterview-main\backend\data.csv'

    # 读取 CSV 并导入
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        row_count = 0
        for row in reader:
            while len(row) < 9:
                row.append('')
            
            title = row[0] if row[0] else ''
            company_name = row[1] if row[1] else ''
            location = row[2] if row[2] else ''
            salary_extension = row[3] if row[3] else ''
            salary_unit = row[4] if row[4] else ''
            experience_required = row[5] if row[5] else ''
            education_required = row[6] if row[6] else ''
            skills = row[7] if row[7] else ''
            welfare_list = row[8] if row[8] else ''
            
            cur.execute("""
                INSERT INTO job_postings 
                (title, company_name, location, salary_extension, salary_unit, experience_required, education_required, skills, welfare_list, status, view_count, application_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', 0, 0)
            """, (title, company_name, location, salary_extension, salary_unit, experience_required, education_required, skills, welfare_list))
            row_count += 1
        
        conn.commit()
        print(f"成功导入 {row_count} 条数据")

except Exception as e:
    print(f"导入失败: {e}")
    import traceback
    traceback.print_exc()
    if conn:
        conn.rollback()
finally:
    if cur:
        cur.close()
    if conn:
        conn.close()
        print("数据库连接已关闭")
