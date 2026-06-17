import psycopg2
import sys

try:
    # 连接到数据库
    conn = psycopg2.connect(
        dbname="job_graph",
        user="postgres",
        password="123456@",
        host="localhost",
        port="5432"
    )
    
    cursor = conn.cursor()
    
    # 设置客户端编码为UTF-8
    cursor.execute("SET client_encoding = 'UTF8';")
    
    # 查询表结构
    print("=== 表结构信息 ===")
    cursor.execute("""
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'job_postings'
        ORDER BY ordinal_position;
    """)
    columns = cursor.fetchall()
    for col in columns:
        print(f"字段: {col[0]:<25} 类型: {col[1]:<20} 可空: {col[2]}")
    
    # 查询数据数量
    print("\n=== 数据统计 ===")
    cursor.execute("SELECT COUNT(*) FROM job_postings;")
    count = cursor.fetchone()[0]
    print(f"job_postings表共有 {count} 条数据")
    
    # 查询前3条数据
    if count > 0:
        print("\n=== 前3条数据示例 ===")
        cursor.execute("SELECT id, title, company_name, location, salary_extension, experience_required, education_required FROM job_postings LIMIT 3;")
        rows = cursor.fetchall()
        for row in rows:
            print(f"ID: {row[0]}")
            print(f"  标题: {row[1]}")
            print(f"  公司: {row[2]}")
            print(f"  地点: {row[3]}")
            print(f"  薪资: {row[4]}")
            print(f"  经验: {row[5]}")
            print(f"  学历: {row[6]}")
            print()
    
    conn.close()
    print("数据库连接测试成功！")
    
except Exception as e:
    print(f"数据库连接失败: {e}")
    sys.exit(1)
