from flask import Flask, jsonify, request
import uuid
import psycopg2
import hashlib

app = Flask(__name__)

def get_db_connection():
    conn = psycopg2.connect(
        dbname='job_graph',
        user='postgres',
        password='123456@',
        host='localhost'
    )
    return conn

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user_type = data.get('userType', 'student')
    
    conn = None
    try:
        encrypted_password = hashlib.md5(password.encode()).hexdigest()
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT u.id, u.username, u.real_name, u.email, u.password, r.role_name FROM users u JOIN user_roles r ON u.role_id = r.id WHERE u.username = %s', (username,))
        user = cur.fetchone()
        
        if user:
            if user[4] == encrypted_password:
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
        return jsonify({'success': False, 'message': f'登录失败: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    real_name = data.get('realName', '')
    user_type = data.get('userType', 'student')
    
    conn = None
    try:
        encrypted_password = hashlib.md5(password.encode()).hexdigest()
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT id FROM users WHERE username = %s', (username,))
        if cur.fetchone():
            return jsonify({'success': False, 'message': '用户名已存在'})
        
        cur.execute('SELECT id FROM user_roles WHERE role_name = %s', (user_type,))
        role = cur.fetchone()
        role_id = role[0] if role else 1
        
        cur.execute('INSERT INTO users (username, password, email, real_name, role_id, status) VALUES (%s, %s, %s, %s, %s, %s)', 
                   (username, encrypted_password, email, real_name, role_id, 1))
        conn.commit()
        
        return jsonify({'success': True, 'message': '注册成功，请登录'})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': f'注册失败: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/jobs/active', methods=['GET'])
def get_active_jobs():
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 12))
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('SELECT COUNT(*) FROM job_postings')
        total_count = cur.fetchone()[0]
        
        offset = (page - 1) * size
        cur.execute('SELECT id, title, company_name, location, salary_extension, salary_unit, experience_required, education_required, skills, welfarelist FROM job_postings ORDER BY id LIMIT %s OFFSET %s', (size, offset))
        
        rows = cur.fetchall()
        jobs = []
        for row in rows:
            jobs.append({
                'id': row[0], 'title': row[1], 'companyName': row[2], 'location': row[3],
                'salaryExtension': row[4], 'salaryUnit': row[5], 'experienceRequired': row[6],
                'educationRequired': row[7], 'skills': row[8].split() if row[8] else [],
                'welfareList': row[9], 'salaryRange': row[4] if row[4] else '面议'
            })
        
        return jsonify({
            'success': True, 'message': '操作成功',
            'data': {'jobs': jobs, 'totalCount': total_count, 'currentPage': page, 'pageSize': size, 'totalPages': (total_count + size - 1) // size}
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取岗位列表失败: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/auth/user', methods=['GET'])
def get_current_user():
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth[7:]
        if token.startswith('token_'):
            conn = None
            try:
                user_id = token.split('_')[1]
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute('SELECT u.id, u.username, u.real_name, u.email, r.role_name FROM users u JOIN user_roles r ON u.role_id = r.id WHERE u.id = %s', (user_id,))
                user = cur.fetchone()
                if user:
                    return jsonify({'id': user[0], 'username': user[1], 'realName': user[2], 'email': user[3], 'role': user[4]})
            except Exception as e:
                print(f'Error: {e}')
            finally:
                if conn:
                    conn.close()
    return jsonify({'id': 1, 'username': 'test', 'realName': '测试用户', 'email': 'test@example.com', 'role': 'student'})

@app.route('/api/auth/profile', methods=['GET'])
def get_profile():
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth[7:]
        if token.startswith('token_'):
            conn = None
            try:
                user_id = token.split('_')[1]
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute('SELECT u.id, u.username, u.real_name, u.email, u.phone, r.role_name FROM users u JOIN user_roles r ON u.role_id = r.id WHERE u.id = %s', (user_id,))
                user = cur.fetchone()
                if user:
                    return jsonify({'id': user[0], 'username': user[1], 'realName': user[2], 'email': user[3], 'phone': user[4], 'role': user[5]})
            except:
                pass
            finally:
                if conn:
                    conn.close()
    return jsonify({'id': 1, 'username': 'test', 'realName': '测试用户', 'email': 'test@example.com', 'phone': '', 'role': 'student'})

@app.route('/api/jobs/search', methods=['POST'])
def search_jobs():
    data = request.get_json()
    keyword = data.get('keyword', '')
    page = data.get('page', 1)
    size = data.get('size', 12)
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        like_keyword = f'%{keyword}%'
        offset = (page - 1) * size
        
        cur.execute('SELECT id, title, company_name, location, salary_extension, salary_unit, experience_required, education_required, skills, welfarelist FROM job_postings WHERE title ILIKE %s OR company_name ILIKE %s OR skills ILIKE %s ORDER BY id LIMIT %s OFFSET %s', 
                   (like_keyword, like_keyword, like_keyword, size, offset))
        
        rows = cur.fetchall()
        jobs = []
        for row in rows:
            jobs.append({
                'id': row[0], 'title': row[1], 'companyName': row[2], 'location': row[3],
                'salaryExtension': row[4], 'salaryUnit': row[5], 'experienceRequired': row[6],
                'educationRequired': row[7], 'skills': row[8].split() if row[8] else [],
                'welfareList': row[9], 'salaryRange': row[4] if row[4] else '面议'
            })
        
        cur.execute('SELECT COUNT(*) FROM job_postings WHERE title ILIKE %s OR company_name ILIKE %s OR skills ILIKE %s', (like_keyword, like_keyword, like_keyword))
        total_count = cur.fetchone()[0]
        
        return jsonify({
            'success': True, 'message': '操作成功',
            'data': {'jobs': jobs, 'totalCount': total_count, 'currentPage': page, 'pageSize': size, 'totalPages': (total_count + size - 1) // size}
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'搜索岗位失败: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/jobs/<int:jobId>', methods=['GET'])
def get_job_detail(jobId):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('SELECT id, title, company_name, location, salary_extension, salary_unit, experience_required, education_required, skills, welfarelist FROM job_postings WHERE id = %s', (jobId,))
        
        row = cur.fetchone()
        
        if not row:
            return jsonify({'success': False, 'message': '岗位不存在'})
        
        job = {
            'id': row[0], 'title': row[1], 'companyName': row[2], 'location': row[3],
            'salaryExtension': row[4], 'salaryUnit': row[5], 'experienceRequired': row[6],
            'educationRequired': row[7], 'skills': row[8].split() if row[8] else [],
            'welfareList': row[9], 'salaryRange': row[4] if row[4] else '面议',
            'description': f'这是{row[1]}岗位的详细描述。',
            'requirements': '1. 具有相关工作经验\n2. 良好的沟通能力\n3. 团队合作精神',
            'benefits': row[9] if row[9] else '五险一金'
        }
        
        return jsonify({'success': True, 'message': '操作成功', 'data': job})
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取岗位详情失败: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/jobs/popular', methods=['GET'])
def get_popular_jobs():
    limit = int(request.args.get('limit', 10))
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('SELECT id, title, company_name, location, salary_extension, salary_unit, experience_required, education_required, skills, welfarelist FROM job_postings ORDER BY id LIMIT %s', (limit,))
        
        rows = cur.fetchall()
        jobs = []
        for row in rows:
            jobs.append({
                'id': row[0], 'title': row[1], 'companyName': row[2], 'location': row[3],
                'salaryExtension': row[4], 'salaryUnit': row[5], 'experienceRequired': row[6],
                'educationRequired': row[7], 'skills': row[8].split() if row[8] else [],
                'welfareList': row[9], 'salaryRange': row[4] if row[4] else '面议'
            })
        
        return jsonify({'success': True, 'message': '操作成功', 'data': jobs})
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取热门岗位失败: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/jobs/latest', methods=['GET'])
def get_latest_jobs():
    limit = int(request.args.get('limit', 10))
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('SELECT id, title, company_name, location, salary_extension, salary_unit, experience_required, education_required, skills, welfarelist FROM job_postings ORDER BY id DESC LIMIT %s', (limit,))
        
        rows = cur.fetchall()
        jobs = []
        for row in rows:
            jobs.append({
                'id': row[0], 'title': row[1], 'companyName': row[2], 'location': row[3],
                'salaryExtension': row[4], 'salaryUnit': row[5], 'experienceRequired': row[6],
                'educationRequired': row[7], 'skills': row[8].split() if row[8] else [],
                'welfareList': row[9], 'salaryRange': row[4] if row[4] else '面议'
            })
        
        return jsonify({'success': True, 'message': '操作成功', 'data': jobs})
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取最新岗位失败: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/applications/apply', methods=['POST'])
def apply_for_job():
    data = request.get_json()
    return jsonify({'success': True, 'message': '简历投递成功！'})

if __name__ == '__main__':
    app.run(port=8082, debug=False, threaded=False)
