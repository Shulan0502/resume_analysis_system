from flask import Flask, jsonify, request
import uuid
import psycopg2
import hashlib

app = Flask(__name__)

# 创建全局数据库连接
conn = None

def init_db():
    global conn
    if conn is None or conn.closed:
        conn = psycopg2.connect(dbname='job_graph', user='postgres', password='123456@', host='localhost')
    return conn

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user_type = data.get('userType', 'student')
    
    try:
        encrypted_password = hashlib.md5(password.encode()).hexdigest()
        
        db_conn = init_db()
        cur = db_conn.cursor()
        cur.execute('SELECT u.id, u.username, u.real_name, u.email, u.password, r.role_name FROM users u JOIN user_roles r ON u.role_id = r.id WHERE u.username = %s', (username,))
        user = cur.fetchone()
        
        if user:
            stored_password = user[4]
            if stored_password == encrypted_password:
                token = 'token_' + str(user[0]) + '_' + str(uuid.uuid4()).replace('-', '')
                result = {
                    'success': True,
                    'message': '登录成功',
                    'token': token,
                    'userInfo': {'id': user[0], 'username': user[1], 'realName': user[2], 'email': user[3], 'role': user[5]}
                }
                return jsonify(result)
            else:
                return jsonify({'success': False, 'message': '用户名或密码错误'})
        else:
            return jsonify({'success': False, 'message': '用户名或密码错误'})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': f'登录失败: {str(e)}'})

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    real_name = data.get('realName', '')
    user_type = data.get('userType', 'student')
    
    try:
        encrypted_password = hashlib.md5(password.encode()).hexdigest()
        
        db_conn = init_db()
        cur = db_conn.cursor()
        cur.execute('SELECT id FROM users WHERE username = %s', (username,))
        if cur.fetchone():
            return jsonify({'success': False, 'message': '用户名已存在'})
        
        cur.execute('SELECT id FROM user_roles WHERE role_name = %s', (user_type,))
        role = cur.fetchone()
        role_id = role[0] if role else 1
        
        cur.execute('INSERT INTO users (username, password, email, real_name, role_id, status) VALUES (%s, %s, %s, %s, %s, %s)', 
                   (username, encrypted_password, email, real_name, role_id, 1))
        db_conn.commit()
        
        return jsonify({'success': True, 'message': '注册成功，请登录'})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': f'注册失败: {str(e)}'})

if __name__ == '__main__':
    app.run(port=8081, debug=True, threaded=False)
