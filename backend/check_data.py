import psycopg2

conn = psycopg2.connect(dbname='job_graph', user='postgres', password='123456@', host='localhost')
cur = conn.cursor()

cur.execute("SELECT welfarelist, welfare_list FROM job_postings LIMIT 5")
rows = cur.fetchall()
print('检查福利字段数据:')
for i, row in enumerate(rows):
    print(f'记录 {i+1}:')
    print(f'  welfarelist: {repr(row[0])}')
    print(f'  welfare_list: {repr(row[1])}')

conn.close()
