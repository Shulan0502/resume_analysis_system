import psycopg2
import json

try:
    conn = psycopg2.connect(dbname='job_graph', user='postgres', password='123456@', host='localhost')
    cur = conn.cursor()
    
    # 测试连接
    cur.execute('SELECT 1')
    result = cur.fetchone()
    print(f'连接测试: {result}')
    
    # 查询记录数
    cur.execute('SELECT COUNT(*) FROM job_postings')
    count = cur.fetchone()[0]
    print(f'job_postings表记录数: {count}')
    
    # 查询数据
    cur.execute('SELECT id, title, company_name, location FROM job_postings LIMIT 3')
    rows = cur.fetchall()
    print('查询结果:')
    for row in rows:
        print(f'  {row}')
    
    conn.close()
    print('测试成功！')
    
except Exception as e:
    print(f'错误: {e}')
