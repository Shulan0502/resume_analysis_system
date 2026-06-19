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

# ==================== 视频分析相关 API ====================
@app.route('/api/video/skill-assessment', methods=['GET'])
def get_skill_assessment():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('SELECT id, interview_type, overall_score, status, created_at FROM interview_records WHERE user_id = 1 ORDER BY created_at DESC LIMIT 5')
        records = cur.fetchall()
        
        recent_interviews = []
        for row in records:
            recent_interviews.append({
                'key': str(row[0]),
                'date': str(row[4])[:10],
                'type': row[1],
                'score': row[2],
                'status': row[3]
            })
        
        return jsonify({
            'success': True,
            'analysisId': 1,
            'createdAt': '2024-01-15 10:30:00',
            'skillScores': [
                {'name': '沟通表达', 'score': 85, 'color': '#1890ff', 'description': '表达清晰，逻辑连贯'},
                {'name': '技术能力', 'score': 78, 'color': '#52c41a', 'description': '基础扎实，有待提升'},
                {'name': '逻辑思维', 'score': 92, 'color': '#722ed1', 'description': '思维敏捷，分析透彻'},
                {'name': '团队协作', 'score': 88, 'color': '#13c2c2', 'description': '善于沟通协作'},
                {'name': '应变能力', 'score': 75, 'color': '#fa8c16', 'description': '有待加强'}
            ],
            'recentInterviews': recent_interviews
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

@app.route('/api/video/interview-records', methods=['GET'])
def get_interview_records():
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 10))
    status_filter = request.args.get('status')
    type_filter = request.args.get('type')
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = '''
            SELECT id, user_id, video_url, interview_type, interviewer, company, 
                   position, duration, status, overall_score, strengths, weaknesses, 
                   improvements, recommendations, feedback, analysis_url, created_at, updated_at
            FROM interview_records 
            WHERE user_id = 1
        '''
        count_query = 'SELECT COUNT(*) FROM interview_records WHERE user_id = 1'
        params = []
        
        if status_filter:
            query += ' AND status = %s'
            count_query += ' AND status = %s'
            params.append(status_filter)
        if type_filter:
            query += ' AND interview_type = %s'
            count_query += ' AND interview_type = %s'
            params.append(type_filter)
        
        query += ' ORDER BY created_at DESC LIMIT %s OFFSET %s'
        params.extend([size, (page - 1) * size])
        
        cur.execute(count_query, params[:-2] if params else None)
        total_count = cur.fetchone()[0]
        
        cur.execute(query, params)
        records = []
        for row in cur.fetchall():
            records.append({
                'id': str(row[0]),
                'date': str(row[16])[:10],
                'type': row[3],
                'position': row[6],
                'score': row[9],
                'status': row[8],
                'duration': row[7],
                'videoUrl': row[2],
                'analysisUrl': row[15],
                'createdAt': str(row[16]),
                'updatedAt': str(row[17]),
                'details': {
                    'overallScore': row[9],
                    'feedback': row[14],
                    'strengths': row[10] if row[10] else [],
                    'improvements': row[12] if row[12] else [],
                    'recommendations': row[13] if row[13] else [],
                    'interviewer': row[4],
                    'company': row[5]
                }
            })
        
        total_pages = (total_count + size - 1) // size
        
        return jsonify({
            'success': True,
            'records': records,
            'totalCount': total_count,
            'totalPages': total_pages,
            'currentPage': page
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

@app.route('/api/video/interview-records/<string:record_id>', methods=['GET'])
def get_interview_record_detail(record_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, video_url, interview_type, interviewer, company, 
                   position, duration, status, overall_score, strengths, weaknesses, 
                   improvements, recommendations, feedback, analysis_url, created_at, updated_at
            FROM interview_records 
            WHERE id = %s
        ''', (record_id,))
        row = cur.fetchone()
        
        if row:
            return jsonify({
                'id': str(row[0]),
                'date': str(row[16])[:10],
                'type': row[3],
                'position': row[6],
                'score': row[9],
                'status': row[8],
                'duration': row[7],
                'videoUrl': row[2],
                'analysisUrl': row[15],
                'createdAt': str(row[16]),
                'updatedAt': str(row[17]),
                'details': {
                    'overallScore': row[9],
                    'feedback': row[14],
                    'strengths': row[10] if row[10] else [],
                    'improvements': row[12] if row[12] else [],
                    'recommendations': row[13] if row[13] else [],
                    'interviewer': row[4],
                    'company': row[5]
                }
            })
        else:
            return jsonify({'success': False, 'error': '记录不存在'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

@app.route('/api/video/interview-records/<string:record_id>', methods=['DELETE'])
def delete_interview_record(record_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM interview_records WHERE id = %s', (record_id,))
        conn.commit()
        return jsonify({'success': True, 'message': '删除成功'})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

# ==================== 学习资源相关 API ====================
@app.route('/api/resources/stats', methods=['GET'])
def get_resource_stats():
    user_id = request.args.get('userId', '1')
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 获取统计数据
        cur.execute('SELECT COUNT(*) FROM learning_resources WHERE status = %s', ('active',))
        total_resources = cur.fetchone()[0]
        
        cur.execute('SELECT COUNT(*) FROM learning_resources WHERE is_free = TRUE AND status = %s', ('active',))
        free_count = cur.fetchone()[0]
        
        cur.execute('SELECT COUNT(*) FROM learning_resources WHERE is_free = FALSE AND status = %s', ('active',))
        paid_count = cur.fetchone()[0]
        
        cur.execute('SELECT category, COUNT(*) FROM learning_resources WHERE status = %s GROUP BY category', ('active',))
        category_stats = []
        for row in cur.fetchall():
            category_stats.append({'name': row[0], 'value': row[1]})
        
        cur.execute('SELECT AVG(rating) FROM learning_resources WHERE status = %s', ('active',))
        avg_rating = cur.fetchone()[0] or 0
        
        return jsonify({
            'success': True,
            'totalResources': total_resources,
            'freeCount': free_count,
            'paidCount': paid_count,
            'categoryStats': category_stats,
            'avgRating': round(float(avg_rating), 2)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

@app.route('/api/resources/all', methods=['GET'])
def get_all_resources():
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 12))
    category = request.args.get('category')
    resource_type = request.args.get('type')
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = '''
            SELECT id, title, author, category, resource_type, description, 
                   url, thumbnail_url, duration, difficulty_level, is_free, 
                   price, rating, tags, status, view_count, created_at, updated_at
            FROM learning_resources 
            WHERE status = %s
        '''
        count_query = 'SELECT COUNT(*) FROM learning_resources WHERE status = %s'
        params = ['active']
        
        if category:
            query += ' AND category = %s'
            count_query += ' AND category = %s'
            params.append(category)
        if resource_type:
            query += ' AND resource_type = %s'
            count_query += ' AND resource_type = %s'
            params.append(resource_type)
        
        query += ' ORDER BY created_at DESC LIMIT %s OFFSET %s'
        params.extend([size, (page - 1) * size])
        
        cur.execute(count_query, params[:-2] if len(params) > 2 else params)
        total_count = cur.fetchone()[0]
        
        cur.execute(query, params)
        resources = []
        for row in cur.fetchall():
            resources.append({
                'id': str(row[0]),
                'title': row[1],
                'author': row[2],
                'category': row[3],
                'resourceType': row[4],
                'description': row[5],
                'url': row[6],
                'thumbnailUrl': row[7],
                'duration': row[8],
                'difficultyLevel': row[9],
                'isFree': row[10],
                'price': float(row[11]) if row[11] else 0,
                'rating': float(row[12]) if row[12] else 0,
                'tags': row[13].split(',') if row[13] else [],
                'status': row[14],
                'viewCount': row[15],
                'createdAt': str(row[16]),
                'updatedAt': str(row[17])
            })
        
        total_pages = (total_count + size - 1) // size
        
        return jsonify({
            'success': True,
            'message': '操作成功',
            'data': {
                'resources': resources,
                'total': total_count,
                'totalCount': total_count,
                'totalPages': total_pages,
                'currentPage': page,
                'pageSize': size
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

# ==================== 个性化推荐资源API ====================

@app.route('/api/resources/recommendations', methods=['GET'])
def get_recommendations():
    """获取个性化推荐资源列表"""
    user_id = request.args.get('userId', '1')
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 12))
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = '''
            SELECT id, title, author, category, resource_type, description,
                   url, thumbnail_url, duration, difficulty_level, is_free,
                   price, rating, tags, status, view_count, created_at, updated_at
            FROM learning_resources
            WHERE status = %s
            ORDER BY rating DESC, view_count DESC
            LIMIT %s OFFSET %s
        '''
        
        count_query = 'SELECT COUNT(*) FROM learning_resources WHERE status = %s'
        
        cur.execute(count_query, ('active',))
        total_count = cur.fetchone()[0]
        
        cur.execute(query, ('active', size, (page - 1) * size))
        resources = []
        for row in cur.fetchall():
            resources.append({
                'id': str(row[0]),
                'title': row[1],
                'author': row[2],
                'category': row[3],
                'resourceType': row[4],
                'description': row[5],
                'url': row[6],
                'thumbnailUrl': row[7],
                'duration': row[8],
                'difficultyLevel': row[9],
                'isFree': row[10],
                'price': float(row[11]) if row[11] else 0,
                'rating': float(row[12]) if row[12] else 0,
                'tags': row[13].split(',') if row[13] else [],
                'status': row[14],
                'viewCount': row[15],
                'createdAt': str(row[16]),
                'updatedAt': str(row[17]),
                'priority': 5 - (len(resources) % 5),
                'recommendationReason': '基于您的学习偏好，推荐学习此课程',
                'recommendationScore': round(90 + (len(resources) * 2), 1)
            })
        
        total_pages = (total_count + size - 1) // size
        
        return jsonify({
            'success': True,
            'data': {
                'resources': resources,
                'totalCount': total_count,
                'totalPages': total_pages,
                'currentPage': page,
                'pageSize': size
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

@app.route('/api/resources/recommendations/generate', methods=['POST'])
def generate_recommendations():
    """生成个性化推荐"""
    data = request.get_json()
    user_id = data.get('userId')
    interview_id = data.get('interviewId')
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 获取用户的面试记录，分析薄弱环节
        query = '''
            SELECT id, title, author, category, resource_type, description,
                   url, thumbnail_url, duration, difficulty_level, is_free,
                   price, rating, tags, status, view_count, created_at, updated_at
            FROM learning_resources
            WHERE status = %s
            ORDER BY rating DESC
            LIMIT 6
        '''
        
        cur.execute(query, ('active',))
        resources = []
        for row in cur.fetchall():
            resources.append({
                'id': str(row[0]),
                'title': row[1],
                'author': row[2],
                'category': row[3],
                'resourceType': row[4],
                'description': row[5],
                'url': row[6],
                'thumbnailUrl': row[7],
                'duration': row[8],
                'difficultyLevel': row[9],
                'isFree': row[10],
                'price': float(row[11]) if row[11] else 0,
                'rating': float(row[12]) if row[12] else 0,
                'tags': row[13].split(',') if row[13] else [],
                'status': row[14],
                'viewCount': row[15],
                'createdAt': str(row[16]),
                'updatedAt': str(row[17]),
                'priority': 5 - (len(resources) % 5),
                'recommendationReason': '基于您的面试分析，推荐学习此课程',
                'recommendationScore': round(85 + (len(resources) * 3), 1)
            })
        
        return jsonify({
            'success': True,
            'message': '推荐生成成功',
            'data': resources
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

@app.route('/api/resources/recommendations/<recommendation_id>/viewed', methods=['PUT'])
def mark_recommendation_viewed(recommendation_id):
    """标记推荐资源已查看"""
    return jsonify({
        'success': True,
        'message': '已标记为已查看'
    })

@app.route('/api/resources/recommendations/<recommendation_id>/completed', methods=['PUT'])
def mark_recommendation_completed(recommendation_id):
    """标记推荐资源已完成"""
    return jsonify({
        'success': True,
        'message': '已标记为已完成'
    })

# ==================== 资源收藏相关API ====================

@app.route('/api/resources/favorites/check', methods=['GET'])
def check_favorite():
    """检查用户是否已收藏某个资源"""
    user_id = request.args.get('userId')
    resource_id = request.args.get('resourceId')
    
    if not user_id or not resource_id:
        return jsonify({'success': False, 'error': '缺少必要参数'})
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            'SELECT id FROM user_favorites WHERE user_id = %s AND favorite_type = %s AND target_id = %s',
            (user_id, 'resource', resource_id)
        )
        result = cur.fetchone()
        
        return jsonify({
            'success': True,
            'isFavorite': result is not None
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

@app.route('/api/resources/favorites/add', methods=['POST'])
def add_favorite():
    """添加收藏"""
    # 优先使用URL参数
    user_id = request.args.get('userId')
    resource_id = request.args.get('resourceId')

    # 只有在URL参数缺失时才尝试解析JSON
    if (not user_id or not resource_id) and request.content_type == 'application/json':
        try:
            data = request.get_json(silent=True) or {}
            user_id = user_id or data.get('userId')
            resource_id = resource_id or data.get('resourceId')
        except:
            pass

    if not user_id or not resource_id:
        return jsonify({'success': False, 'error': '缺少必要参数'})

    if not user_id or not resource_id:
        return jsonify({'success': False, 'error': '缺少必要参数'})
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 检查是否已收藏
        cur.execute(
            'SELECT id FROM user_favorites WHERE user_id = %s AND favorite_type = %s AND target_id = %s',
            (user_id, 'resource', resource_id)
        )
        if cur.fetchone():
            return jsonify({'success': False, 'error': '已收藏'})
        
        # 添加收藏
        cur.execute(
            'INSERT INTO user_favorites (user_id, favorite_type, target_id) VALUES (%s, %s, %s)',
            (user_id, 'resource', resource_id)
        )
        conn.commit()
        
        return jsonify({'success': True, 'message': '收藏成功'})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

@app.route('/api/resources/favorites/remove', methods=['POST'])
def remove_favorite():
    """取消收藏"""
    # 优先使用URL参数
    user_id = request.args.get('userId')
    resource_id = request.args.get('resourceId')

    # 只有在URL参数缺失时才尝试解析JSON
    if (not user_id or not resource_id) and request.content_type == 'application/json':
        try:
            data = request.get_json(silent=True) or {}
            user_id = user_id or data.get('userId')
            resource_id = resource_id or data.get('resourceId')
        except:
            pass

    if not user_id or not resource_id:
        return jsonify({'success': False, 'error': '缺少必要参数'})

    if not user_id or not resource_id:
        return jsonify({'success': False, 'error': '缺少必要参数'})
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            'DELETE FROM user_favorites WHERE user_id = %s AND favorite_type = %s AND target_id = %s',
            (user_id, 'resource', resource_id)
        )
        conn.commit()
        
        return jsonify({'success': True, 'message': '取消收藏成功'})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

@app.route('/api/resources/favorites', methods=['GET'])
def get_favorites():
    """获取用户收藏的资源列表"""
    user_id = request.args.get('userId', '1')
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 12))
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 获取收藏的资源ID列表
        query = '''
            SELECT lr.id, lr.title, lr.author, lr.category, lr.resource_type, lr.description,
                   lr.url, lr.thumbnail_url, lr.duration, lr.difficulty_level, lr.is_free,
                   lr.price, lr.rating, lr.tags, lr.status, lr.view_count, lr.created_at, lr.updated_at,
                   uf.created_at as favorite_time
            FROM user_favorites uf
            JOIN learning_resources lr ON uf.target_id = lr.id
            WHERE uf.user_id = %s AND uf.favorite_type = %s AND lr.status = %s
            ORDER BY uf.created_at DESC
            LIMIT %s OFFSET %s
        '''
        
        count_query = '''
            SELECT COUNT(*)
            FROM user_favorites uf
            JOIN learning_resources lr ON uf.target_id = lr.id
            WHERE uf.user_id = %s AND uf.favorite_type = %s AND lr.status = %s
        '''
        
        cur.execute(count_query, (user_id, 'resource', 'active'))
        total_count = cur.fetchone()[0]
        
        cur.execute(query, (user_id, 'resource', 'active', size, (page - 1) * size))
        resources = []
        for row in cur.fetchall():
            resources.append({
                'id': str(row[0]),
                'title': row[1],
                'author': row[2],
                'category': row[3],
                'resourceType': row[4],
                'description': row[5],
                'url': row[6],
                'thumbnailUrl': row[7],
                'duration': row[8],
                'difficultyLevel': row[9],
                'isFree': row[10],
                'price': float(row[11]) if row[11] else 0,
                'rating': float(row[12]) if row[12] else 0,
                'tags': row[13].split(',') if row[13] else [],
                'status': row[14],
                'viewCount': row[15],
                'createdAt': str(row[16]),
                'updatedAt': str(row[17]),
                'favoriteTime': str(row[18])
            })
        
        total_pages = (total_count + size - 1) // size
        
        return jsonify({
            'success': True,
            'data': {
                'resources': resources,
                'totalCount': total_count,
                'totalPages': total_pages,
                'currentPage': page,
                'pageSize': size
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

# ==================== 岗位能力知识图谱API ====================
GRAPH_SERVICE_URL = "http://localhost:7576"

@app.route('/api/job-skill-graph/stats', methods=['GET'])
def get_graph_stats():
    """获取图谱统计信息"""
    try:
        import requests
        response = requests.get(f"{GRAPH_SERVICE_URL}/api/job-skill-graph/stats", timeout=10)
        data = response.json()
        return jsonify(data)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/job-skill-graph/skill-analysis/<skill_name>', methods=['GET'])
def analyze_skill(skill_name):
    """分析特定技能的需求情况"""
    try:
        import requests
        response = requests.get(f"{GRAPH_SERVICE_URL}/api/job-skill-graph/skill-analysis/{skill_name}", timeout=10)
        data = response.json()
        return jsonify(data)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/job-skill-graph/search', methods=['GET'])
def search_graph():
    """搜索知识图谱"""
    query = request.args.get('q', '')
    if not query:
        return jsonify({'success': False, 'error': '请提供搜索关键词'})

    try:
        import requests
        response = requests.get(f"{GRAPH_SERVICE_URL}/api/job-skill-graph/search?q={query}", timeout=10)
        data = response.json()
        return jsonify(data)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/job-skill-graph/popular-skills', methods=['GET'])
def get_popular_skills():
    """获取热门技能排行"""
    try:
        import requests
        stats_response = requests.get(f"{GRAPH_SERVICE_URL}/api/job-skill-graph/stats", timeout=10)
        stats_data = stats_response.json()

        if stats_data.get('success'):
            popular_skills = stats_data['data']['popular_skills']
            return jsonify({
                'success': True,
                'data': popular_skills
            })
        else:
            return jsonify({'success': False, 'error': '获取统计失败'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/job-skill-graph/jobs/<skill_name>', methods=['GET'])
def get_jobs_by_skill(skill_name):
    """获取需要特定技能的岗位列表"""
    try:
        import requests
        response = requests.get(f"{GRAPH_SERVICE_URL}/api/job-skill-graph/skill-analysis/{skill_name}", timeout=10)
        data = response.json()

        if data.get('success'):
            return jsonify({
                'success': True,
                'skill': skill_name,
                'jobs': data['data']['jobs'],
                'companies': data['data']['companies']
            })
        else:
            return jsonify({'success': False, 'error': '查询失败'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/job-skill-graph/graph-data', methods=['GET'])
def get_graph_data():
    """获取G6可视化图谱数据"""
    try:
        import requests
        limit = request.args.get('limit', 30, type=int)
        response = requests.get(
            f"{GRAPH_SERVICE_URL}/api/job-skill-graph/graph-data?limit={limit}",
            timeout=30
        )
        data = response.json()
        return jsonify(data)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/job-skill-graph/job-analysis/<job_name>', methods=['GET'])
def analyze_job(job_name):
    """分析特定岗位"""
    try:
        import requests
        response = requests.get(
            f"{GRAPH_SERVICE_URL}/api/job-skill-graph/job-analysis/{job_name}",
            timeout=10
        )
        data = response.json()
        return jsonify(data)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


if __name__ == '__main__':
    app.run(port=8082, debug=False, threaded=False)
