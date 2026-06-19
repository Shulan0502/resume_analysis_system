import psycopg2

conn = psycopg2.connect(dbname='job_graph', user='postgres', password='123456@', host='localhost')
cur = conn.cursor()

# 检查表是否存在
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_name = 'job_postings'")
table_exists = cur.fetchone()
print(f'job_postings 表是否存在: {table_exists}')

# 检查数据
if table_exists:
    cur.execute('SELECT COUNT(*) FROM job_postings')
    count = cur.fetchone()[0]
    print(f'job_postings 表数据量: {count}')
    
    # 查看前3条数据
    cur.execute('SELECT * FROM job_postings LIMIT 3')
    rows = cur.fetchall()
    print('前3条数据:')
    for row in rows:
        print(row)

conn.close()
