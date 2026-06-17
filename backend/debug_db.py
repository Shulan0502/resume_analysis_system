import psycopg2
import os

# 测试不同的连接参数
connection_params = [
    {'dbname': 'job_graph', 'user': 'postgres', 'password': '123456@', 'host': 'localhost'},
    {'dbname': 'job', 'user': 'postgres', 'password': '123456@', 'host': 'localhost'},
]

for params in connection_params:
    try:
        conn = psycopg2.connect(**params)
        cur = conn.cursor()
        
        cur.execute('SELECT current_database()')
        db_name = cur.fetchone()[0]
        
        cur.execute('SELECT COUNT(*) FROM job_postings')
        count = cur.fetchone()[0]
        
        print(f"数据库 {db_name}: {count} 条记录")
        
        conn.close()
    except Exception as e:
        print(f"连接 {params['dbname']} 失败: {e}")
