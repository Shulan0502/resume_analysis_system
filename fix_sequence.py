import psycopg2

conn = psycopg2.connect(dbname='job_graph', user='postgres', password='123456@', host='localhost')
cur = conn.cursor()

# 检查当前最大ID
cur.execute('SELECT MAX(id) FROM users')
max_id = cur.fetchone()[0]
print(f'当前最大ID: {max_id}')

# 创建序列（如果不存在）
cur.execute('CREATE SEQUENCE IF NOT EXISTS users_id_seq')

# 设置序列值
cur.execute('SELECT setval(\'users_id_seq\', %s)', (max_id + 1 if max_id else 1,))

# 将序列关联到id字段
cur.execute('ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval(\'users_id_seq\')')

conn.commit()
conn.close()
print('序列配置完成')
