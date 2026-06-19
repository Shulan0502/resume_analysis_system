import psycopg2
from psycopg2 import extras

conn = psycopg2.connect(dbname="job_graph", user="postgres", password="123456@", host="localhost")
cur = conn.cursor()

try:
    print("=== 修复用户表结构 ===")
    
    # 检查 users 表是否有 role_id 字段
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = %s AND column_name = %s", ("users", "role_id"))
    if not cur.fetchone():
        print("添加 role_id 字段到 users 表...")
        cur.execute("ALTER TABLE users ADD COLUMN role_id INTEGER")
        conn.commit()
        print("role_id 字段添加成功")
    else:
        print("role_id 字段已存在")
    
    print("")
    print("=== 修复角色表结构 ===")
    
    # 删除旧的 user_roles 表并重新创建
    print("删除旧的 user_roles 表...")
    cur.execute("DROP TABLE IF EXISTS user_roles_new")
    cur.execute("CREATE TABLE user_roles_new (id SERIAL PRIMARY KEY, role_name VARCHAR(50) UNIQUE NOT NULL)")
    
    # 插入标准角色
    print("插入角色数据...")
    cur.execute("INSERT INTO user_roles_new (role_name) VALUES (%s)", ("student",))
    cur.execute("INSERT INTO user_roles_new (role_name) VALUES (%s)", ("school",))
    cur.execute("INSERT INTO user_roles_new (role_name) VALUES (%s)", ("company",))
    
    conn.commit()
    print("新的 user_roles 表创建成功")
    
    # 更新用户表的 role_id
    print("")
    print("=== 更新用户角色关联 ===")
    cur.execute("SELECT id FROM user_roles_new WHERE role_name = %s", ("student",))
    student_role_id = cur.fetchone()[0]
    
    cur.execute("UPDATE users SET role_id = %s WHERE id = 1", (student_role_id,))
    cur.execute("UPDATE users SET role_id = %s WHERE id = 3", (student_role_id,))
    
    cur.execute("SELECT id FROM user_roles_new WHERE role_name = %s", ("company",))
    company_role_id = cur.fetchone()[0]
    cur.execute("UPDATE users SET role_id = %s WHERE id = 2", (company_role_id,))
    
    conn.commit()
    print("用户角色关联更新成功")
    
    # 删除旧表并重命名新表
    print("")
    print("=== 替换角色表 ===")
    cur.execute("DROP TABLE IF EXISTS user_roles_old")
    cur.execute("ALTER TABLE user_roles RENAME TO user_roles_old")
    cur.execute("ALTER TABLE user_roles_new RENAME TO user_roles")
    conn.commit()
    print("角色表替换完成")
    
    # 更新密码为MD5加密格式（因为Java代码使用MD5验证）
    print("")
    print("=== 更新密码为MD5格式 ===")
    import hashlib
    users = [("test", "123456"), ("admin", "123456"), ("company_user", "123456")]
    for username, password in users:
        md5_password = hashlib.md5(password.encode()).hexdigest()
        cur.execute("UPDATE users SET password = %s WHERE username = %s", (md5_password, username))
    conn.commit()
    print("密码更新为MD5格式完成")
    
except Exception as e:
    print(f"错误: {e}")
    conn.rollback()

conn.close()
print("")
print("数据库修复完成！")
