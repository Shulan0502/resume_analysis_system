import psycopg2

conn = psycopg2.connect(dbname="job_graph", user="postgres", password="123456@", host="localhost")
cur = conn.cursor()

try:
    print("=== 修复 users 表的 status 字段 ===")
    
    # 创建临时列存储整数值
    print("创建临时列...")
    cur.execute("ALTER TABLE users ADD COLUMN status_temp INTEGER")
    
    # 将 'active' 转换为 1，其他值转换为 0
    print("转换状态值...")
    cur.execute("UPDATE users SET status_temp = CASE WHEN status = 'active' THEN 1 ELSE 0 END")
    
    # 删除旧列并重命名新列
    print("替换列...")
    cur.execute("ALTER TABLE users DROP COLUMN status")
    cur.execute("ALTER TABLE users RENAME COLUMN status_temp TO status")
    
    conn.commit()
    print("status 字段修复完成！")
    
except Exception as e:
    print(f"错误: {e}")
    conn.rollback()

conn.close()
