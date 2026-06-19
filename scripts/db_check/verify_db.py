import psycopg2

conn = psycopg2.connect(dbname="job_graph", user="postgres", password="123456@", host="localhost")
cur = conn.cursor()

print("=== 用户表结构 ===")
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = %s", ("users",))
columns = cur.fetchall()
print("users 表字段:", [col[0] for col in columns])

print("")
print("=== 用户表数据 ===")
cur.execute("SELECT id, username, password, email, real_name, status, role_id FROM users")
users = cur.fetchall()
for user in users:
    print(f"ID: {user[0]}, 用户名: {user[1]}, 密码(MD5): {user[2][:8]}..., 邮箱: {user[3]}, 真实姓名: {user[4]}, 状态: {user[5]}, 角色ID: {user[6]}")

print("")
print("=== 角色表结构 ===")
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = %s", ("user_roles",))
columns = cur.fetchall()
print("user_roles 表字段:", [col[0] for col in columns])

print("")
print("=== 角色表数据 ===")
cur.execute("SELECT id, role_name FROM user_roles")
roles = cur.fetchall()
for role in roles:
    print(f"角色ID: {role[0]}, 角色名称: {role[1]}")

conn.close()
