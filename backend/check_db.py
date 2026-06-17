import psycopg2

conn = psycopg2.connect(dbname='job_graph', user='postgres', password='123456@', host='localhost')
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'job_postings' ORDER BY ordinal_position")
rows = cur.fetchall()
print('数据库表结构:')
for row in rows:
    print(f'  {row[0]}: {row[1]}')

cur.execute("SELECT COUNT(*) FROM job_postings")
count = cur.fetchone()[0]
print(f'总记录数: {count}')

conn.close()
