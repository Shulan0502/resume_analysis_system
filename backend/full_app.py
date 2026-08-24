from flask import Flask, jsonify, request, send_file
import uuid
import psycopg2
import hashlib
from pathlib import Path

app = Flask(__name__)
LEARNING_CONTENT_ROOT = Path(__file__).resolve().parent / 'learning_content'
LEARNING_SCHEMA_PATH = Path(__file__).resolve().parent / 'src' / 'main' / 'resources' / 'learning-resources-schema.sql'
LEARNING_DATA_PATH = Path(__file__).resolve().parent / 'src' / 'main' / 'resources' / 'learning-resources-data.sql'

def get_db_connection():
    conn = psycopg2.connect(
        dbname='job_graph',
        user='postgres',
        password='123456@',
        host='localhost'
    )
    return conn


def initialize_learning_resources():
    """Create and seed learning data only when a fresh database needs it."""
    if not LEARNING_SCHEMA_PATH.is_file() or not LEARNING_DATA_PATH.is_file():
        raise RuntimeError('学习资源初始化文件缺失')
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(LEARNING_SCHEMA_PATH.read_text(encoding='utf-8'))
            cur.execute('SELECT (SELECT COUNT(*) FROM learning_resources), (SELECT COUNT(*) FROM learning_resource_documents)')
            resource_count, document_count = cur.fetchone()
            if resource_count == 0 or document_count == 0:
                cur.execute(LEARNING_DATA_PATH.read_text(encoding='utf-8'))
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user_type = data.get('userType', 'student')

    # Mock 账号（无需数据库，便于先登录体验学校端/企业端）
    MOCK_USERS = {
        ('school', '123456', 'school'): {'id': 9001, 'username': 'school', 'realName': '示例学校管理员', 'email': 'school@mock.com', 'role': 'school'},
        ('company', '123456', 'company'): {'id': 9002, 'username': 'company', 'realName': '示例企业HR', 'email': 'company@mock.com', 'role': 'company'},
        ('student', '123456', 'student'): {'id': 9003, 'username': 'student', 'realName': '示例学生', 'email': 'student@mock.com', 'role': 'student'},
    }
    mock_key = (username, password, user_type)
    if mock_key in MOCK_USERS:
        info = MOCK_USERS[mock_key]
        token = 'mock_token_' + str(info['id']) + '_' + uuid.uuid4().hex
        return jsonify({'success': True, 'message': '登录成功(mock)', 'token': token, 'userInfo': info})

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


# ==================== 本地学习系列与文档 API ====================
@app.route('/api/resource-series', methods=['GET'])
def get_resource_series():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT s.id, s.slug, s.title, s.provider, s.category, s.description,
                   s.repository_url, s.source_site_url, s.language, COUNT(d.id)
            FROM learning_resource_series s
            LEFT JOIN learning_resource_documents d ON d.series_id = s.id
            GROUP BY s.id
            ORDER BY s.created_at ASC
        ''')
        series = [{
            'id': row[0], 'slug': row[1], 'title': row[2], 'provider': row[3],
            'category': row[4], 'description': row[5], 'repositoryUrl': row[6],
            'sourceSiteUrl': row[7], 'language': row[8], 'documentCount': row[9]
        } for row in cur.fetchall()]
        return jsonify({'success': True, 'data': series})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/api/resource-series/<slug>', methods=['GET'])
def get_resource_series_detail(slug):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, slug, title, provider, category, description, repository_url, source_site_url
            FROM learning_resource_series WHERE slug = %s
        ''', (slug,))
        row = cur.fetchone()
        if not row:
            return jsonify({'success': False, 'error': '学习系列不存在'}), 404
        cur.execute('''
            SELECT id, title, relative_path, sort_order
            FROM learning_resource_documents WHERE series_id = %s ORDER BY sort_order, id
        ''', (row[0],))
        documents = [{'id': doc[0], 'title': doc[1], 'path': doc[2], 'sortOrder': doc[3]} for doc in cur.fetchall()]
        return jsonify({'success': True, 'data': {
            'slug': row[1], 'title': row[2], 'provider': row[3], 'category': row[4],
            'description': row[5], 'repositoryUrl': row[6], 'sourceSiteUrl': row[7], 'documents': documents
        }})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/api/resource-series/<slug>/documents/<int:document_id>', methods=['GET'])
def get_resource_document(slug, document_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT d.title, d.local_path, d.source_url
            FROM learning_resource_documents d
            JOIN learning_resource_series s ON s.id = d.series_id
            WHERE s.slug = %s AND d.id = %s
        ''', (slug, document_id))
        row = cur.fetchone()
        if not row:
            return jsonify({'success': False, 'error': '文档不存在'}), 404
        document_path = (LEARNING_CONTENT_ROOT / row[1]).resolve()
        if LEARNING_CONTENT_ROOT not in document_path.parents or not document_path.is_file():
            return jsonify({'success': False, 'error': '本地文档尚未同步'}), 404
        return jsonify({'success': True, 'data': {
            'title': row[0], 'content': document_path.read_text(encoding='utf-8'), 'sourceUrl': row[2]
        }})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/api/resource-series/<slug>/assets/<path:asset_path>', methods=['GET'])
def get_resource_asset(slug, asset_path):
    series_root = (LEARNING_CONTENT_ROOT / slug).resolve()
    asset = (series_root / asset_path).resolve()
    if LEARNING_CONTENT_ROOT not in series_root.parents:
        return jsonify({'success': False, 'error': '学习系列不存在'}), 404
    if series_root not in asset.parents or not asset.is_file():
        return jsonify({'success': False, 'error': '资源不存在'}), 404
    return send_file(asset, conditional=True, max_age=86400)


# ==================== 求职问答历史 API ====================
def get_chat_user_id():
    return request.args.get('userId', '1')


@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, message_type, message_content, created_at, updated_at
            FROM chat_history WHERE user_id = %s ORDER BY created_at ASC, id ASC
        ''', (get_chat_user_id(),))
        return jsonify([{
            'id': row[0], 'userId': row[1], 'messageType': row[2], 'messageContent': row[3],
            'createdAt': row[4].isoformat(), 'updatedAt': row[5].isoformat()
        } for row in cur.fetchall()])
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/api/chat/history', methods=['DELETE'])
def clear_chat_history():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM chat_history WHERE user_id = %s', (get_chat_user_id(),))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/api/chat/history/<int:record_id>', methods=['DELETE'])
def delete_chat_history(record_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM chat_history WHERE id = %s AND user_id = %s', (record_id, get_chat_user_id()))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/api/chat/text', methods=['POST'])
def chat_with_text():
    import json
    import requests

    data = request.get_json(silent=True) or {}
    prompt = (data.get('message') or '').strip()
    if not prompt:
        return jsonify({'success': False, 'message': '请输入问题'}), 400

    config = _load_coze_config()
    response_text = None
    error_detail = None

    # ============ 第1优先：调用 Coze（扣子）求职问答工作流 ============
    if config['token'] and config['workflow_id']:
        try:
            coze_url = f"{config['base_url'].rstrip('/')}/v1/workflow/run"
            headers = {
                "Authorization": f"Bearer {config['token']}",
                "Content-Type": "application/json"
            }
            payload = {
                "workflow_id": config['workflow_id'],
                "parameters": {
                    "message": prompt,
                    "user_input": prompt
                }
            }
            print(f"[QA-Coze] 调用 Coze 工作流: {coze_url} workflow_id={config['workflow_id']}")
            coze_resp = requests.post(coze_url, headers=headers, json=payload, timeout=180)
            print(f"[QA-Coze] 响应状态码: {coze_resp.status_code}")
            if coze_resp.status_code == 200:
                resp_json = coze_resp.json()
                # 尝试多种字段提取 Coze 输出
                if isinstance(resp_json, dict):
                    for field in ['output', 'data', 'result', 'response', 'content']:
                        val = resp_json.get(field)
                        if isinstance(val, dict):
                            # 再从字典里找文本字段
                            for sub in ['answer', 'content', 'text', 'output', 'response', 'message']:
                                if sub in val and isinstance(val[sub], str) and len(val[sub]) > 2:
                                    response_text = val[sub]
                                    break
                            if not response_text:
                                response_text = json.dumps(val, ensure_ascii=False)
                            break
                        elif isinstance(val, str) and len(val) > 2:
                            response_text = val
                            break
                    if not response_text and resp_json.get('messages'):
                        # Coze V2 返回 messages 数组格式
                        msgs = resp_json['messages']
                        if isinstance(msgs, list):
                            for m in msgs:
                                if m.get('role') == 'assistant':
                                    response_text = m.get('content', '')
                                    if response_text:
                                        break
                    if not response_text:
                        # 兜底：输出未识别结构，把整个 JSON 字符串化
                        response_text = json.dumps(resp_json, ensure_ascii=False)
                        print(f"[QA-Coze] 未从响应结构中找到标准文本字段，返回原始JSON")
        except Exception as coze_err:
            error_detail = f"Coze调用异常: {coze_err}"
            print(f"[WARN] Coze求职问答工作流调用失败: {coze_err}")
            import traceback
            traceback.print_exc()

    # ============ 流式 fallback（有些工作流只支持 stream_run） ============
    if not response_text and config['token'] and config['workflow_id']:
        try:
            coze_url2 = f"{config['base_url'].rstrip('/')}/v1/workflow/stream_run"
            headers = {
                "Authorization": f"Bearer {config['token']}",
                "Content-Type": "application/json"
            }
            payload2 = {
                "workflow_id": config['workflow_id'],
                "parameters": {"message": prompt, "user_input": prompt}
            }
            print(f"[QA-Coze] 尝试流式调用: {coze_url2}")
            coze_resp2 = requests.post(coze_url2, headers=headers, json=payload2, timeout=180, stream=True)
            if coze_resp2.status_code == 200:
                collected = ""
                for line in coze_resp2.iter_lines(decode_unicode=True):
                    if not line:
                        continue
                    if line.startswith("data:"):
                        line_data = line[5:].strip()
                        if not line_data or line_data == "[DONE]":
                            continue
                        try:
                            evt = json.loads(line_data)
                            for field in ['content', 'output', 'text', 'answer', 'data']:
                                v = evt.get(field)
                                if isinstance(v, str) and len(v) > 0:
                                    collected += v
                                    break
                            if evt.get('event') == 'Message' or evt.get('event') == 'message':
                                msg_content = evt.get('content', '')
                                if msg_content:
                                    collected += msg_content
                        except Exception:
                            pass
                if len(collected) > 2:
                    response_text = collected
        except Exception as coze_err2:
            print(f"[WARN] Coze流式调用也失败: {coze_err2}")

    # ============ 降级方案：使用阿里云百炼 DashScope LLM ============
    if not response_text:
        try:
            if not config['dashscope_key']:
                response_text = f"已收到你的问题：{prompt}\n\n当前系统未配置 LLM API 密钥（DASHSCOPE_API_KEY），或 Coze 工作流调用失败，暂时无法生成AI回答。\n\nCoze状态: {error_detail or '未知错误'}\n\n请补充：目标岗位、掌握的技能、项目经历等信息，我会据此帮你梳理准备重点。"
            else:
                sys_prompt = """你是一位资深的职业规划导师和招聘专家，名叫「学途智面·职业助手」，擅长解答大学生求职相关问题。

请根据用户的求职困惑，提供专业、具体、可落地的建议，回复风格要真诚、温暖、有条理。

涉及的典型场景包括（按需求自由组织，不要生搬硬套编号）：
1. 岗位分析：拆解某岗位的技能要求、发展路径、薪资水平
2. 简历优化：帮助用户发掘简历亮点、改进表达方式
3. 项目梳理：指导用户如何把课程/实习/竞赛项目讲得吸引人
4. 面试准备：拆解常见面试问题的回答思路、STAR法则运用
5. 学习规划：根据目标岗位制定技能学习计划和资源推荐
6. 行业认知：分析热门行业/岗位的现状与趋势

回答要求：
- 多用分点和小标题，结构清晰
- 建议要具体，不要空泛的套话（例如不说"多练项目"，而要说"按XX方向做3个项目，分别包含XX、XX、XX要点"）
- 适当鼓励但不夸大
- 如用户信息不完整，主动追问关键信息（目标岗位、学历、经验、技能等）
- 每轮回答控制在300-800字之间，复杂问题可以分多次对话"""

                dashscope_resp = requests.post(
                    f"{config['dashscope_base'].rstrip('/')}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {config['dashscope_key']}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "qwen-plus",
                        "messages": [
                            {"role": "system", "content": sys_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.8,
                    },
                    timeout=120
                )
                if dashscope_resp.status_code == 200:
                    data = dashscope_resp.json()
                    content = data['choices'][0]['message']['content']
                    if content and len(content) > 2:
                        response_text = content
                        print("[QA-LLM] 使用百炼DashScope LLM生成回答成功")
                else:
                    raise Exception(f"HTTP {dashscope_resp.status_code}: {dashscope_resp.text[:200]}")
        except Exception as llm_err:
            response_text = f"已收到你的问题：{prompt}\n\nAI服务暂时不可用，错误：{str(llm_err)}\n\n请稍后重试，或补充更多信息（目标岗位、掌握技能、项目经历等），我会在恢复后给你详细建议。"

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        user_id = get_chat_user_id()
        cur.execute('INSERT INTO chat_history (user_id, message_type, message_content) VALUES (%s, %s, %s)', (user_id, 'USER', prompt))
        cur.execute('INSERT INTO chat_history (user_id, message_type, message_content) VALUES (%s, %s, %s)', (user_id, 'ASSISTANT', response_text))
        conn.commit()
        return jsonify({'success': True, 'response': response_text})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()


# ============================================================================
# 企业端 Mock 数据（计算机相关岗位）
# ============================================================================
MOCK_JOBS = [
    {
        'id': 101, 'title': 'Python 后端开发工程师', 'companyName': '创新科技有限公司',
        'department': '技术部', 'location': '北京-海淀区', 'jobType': '全职',
        'salaryMin': 15000, 'salaryMax': 25000, 'salaryRange': '15k-25k',
        'experienceRequired': '3-5年', 'educationRequired': '本科',
        'description': '负责公司核心业务系统的后端开发，参与系统架构设计与优化',
        'requirements': '1. 3年以上 Python 开发经验\n2. 熟悉 Django/Flask/FastAPI 等框架\n3. 熟悉 PostgreSQL、Redis 等数据库\n4. 了解微服务架构',
        'benefits': '五险一金、13薪、弹性工作、免费三餐、年度体检',
        'skills': ['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
        'tags': ['热门', '急招'], 'contactPerson': '李经理', 'contactPhone': '13800138001',
        'contactEmail': 'hr@mock.com', 'status': 'active', 'priorityLevel': 3,
        'viewCount': 328, 'applicationCount': 45, 'deadline': '2026-12-31',
        'isUrgent': True, 'isRemoteWork': False,
        'createdAt': '2026-06-01T10:00:00', 'updatedAt': '2026-08-01T10:00:00',
        'publishedAt': '2026-06-01T10:00:00',
    },
    {
        'id': 102, 'title': 'Java 高级开发工程师', 'companyName': '创新科技有限公司',
        'department': '技术部', 'location': '北京-海淀区', 'jobType': '全职',
        'salaryMin': 20000, 'salaryMax': 35000, 'salaryRange': '20k-35k',
        'experienceRequired': '5-10年', 'educationRequired': '本科',
        'description': '负责公司大型分布式系统的设计与开发，技术团队管理',
        'requirements': '1. 5年以上 Java 开发经验\n2. 精通 Spring Boot、Spring Cloud\n3. 熟悉高并发、分布式架构\n4. 有团队管理经验优先',
        'benefits': '五险一金、14薪、股票期权、弹性工作、带薪年假',
        'skills': ['Java', 'Spring Boot', 'Spring Cloud', 'MySQL', 'Redis', 'Kafka'],
        'tags': ['热门'], 'contactPerson': '王总监', 'contactPhone': '13800138002',
        'contactEmail': 'hr@mock.com', 'status': 'active', 'priorityLevel': 3,
        'viewCount': 512, 'applicationCount': 68, 'deadline': '2026-12-31',
        'isUrgent': False, 'isRemoteWork': False,
        'createdAt': '2026-05-15T10:00:00', 'updatedAt': '2026-08-10T10:00:00',
        'publishedAt': '2026-05-15T10:00:00',
    },
    {
        'id': 103, 'title': '前端开发工程师（React）', 'companyName': '创新科技有限公司',
        'department': '技术部', 'location': '上海-浦东新区', 'jobType': '全职',
        'salaryMin': 15000, 'salaryMax': 28000, 'salaryRange': '15k-28k',
        'experienceRequired': '3-5年', 'educationRequired': '本科',
        'description': '负责公司 Web 应用前端开发，优化用户体验与页面性能',
        'requirements': '1. 3年以上前端开发经验\n2. 精通 React、TypeScript\n3. 熟悉 Vite、Webpack 等构建工具\n4. 有大型项目经验优先',
        'benefits': '五险一金、13薪、免费班车、弹性工作',
        'skills': ['React', 'TypeScript', 'Redux', 'Vite', 'Ant Design', 'TailwindCSS'],
        'tags': ['热门'], 'contactPerson': '陈经理', 'contactPhone': '13800138003',
        'contactEmail': 'hr@mock.com', 'status': 'active', 'priorityLevel': 2,
        'viewCount': 289, 'applicationCount': 37, 'deadline': '2026-12-31',
        'isUrgent': False, 'isRemoteWork': False,
        'createdAt': '2026-07-01T10:00:00', 'updatedAt': '2026-08-15T10:00:00',
        'publishedAt': '2026-07-01T10:00:00',
    },
    {
        'id': 104, 'title': '人工智能算法工程师', 'companyName': '创新科技有限公司',
        'department': 'AI实验室', 'location': '北京-海淀区', 'jobType': '全职',
        'salaryMin': 25000, 'salaryMax': 50000, 'salaryRange': '25k-50k',
        'experienceRequired': '3-5年', 'educationRequired': '硕士',
        'description': '负责公司 AI 产品的算法研发，包括自然语言处理、计算机视觉等方向',
        'requirements': '1. 硕士及以上学历，计算机/数学/统计相关专业\n2. 熟悉 PyTorch、TensorFlow\n3. 有 NLP/CV 项目经验\n4. 顶会论文发表者优先',
        'benefits': '五险一金、16薪、股票期权、学术交流、配备 GPU 服务器',
        'skills': ['Python', 'PyTorch', 'TensorFlow', 'NLP', 'CV', 'LLM'],
        'tags': ['急招', '高薪'], 'contactPerson': '刘博士', 'contactPhone': '13800138004',
        'contactEmail': 'ai@mock.com', 'status': 'active', 'priorityLevel': 3,
        'viewCount': 456, 'applicationCount': 52, 'deadline': '2026-12-31',
        'isUrgent': True, 'isRemoteWork': False,
        'createdAt': '2026-08-01T10:00:00', 'updatedAt': '2026-08-20T10:00:00',
        'publishedAt': '2026-08-01T10:00:00',
    },
    {
        'id': 105, 'title': '大数据开发工程师', 'companyName': '创新科技有限公司',
        'department': '数据平台部', 'location': '深圳-南山区', 'jobType': '全职',
        'salaryMin': 18000, 'salaryMax': 30000, 'salaryRange': '18k-30k',
        'experienceRequired': '3-5年', 'educationRequired': '本科',
        'description': '构建和维护公司大数据平台，处理海量数据，支撑业务决策',
        'requirements': '1. 3年以上大数据开发经验\n2. 熟悉 Hadoop、Spark、Flink\n3. 熟悉数据仓库建模\n4. 熟悉 Airflow 调度',
        'benefits': '五险一金、13薪、免费三餐、健身房',
        'skills': ['Java', 'Scala', 'Spark', 'Flink', 'Hadoop', 'Hive', 'Kafka'],
        'tags': ['热门'], 'contactPerson': '赵经理', 'contactPhone': '13800138005',
        'contactEmail': 'hr@mock.com', 'status': 'active', 'priorityLevel': 2,
        'viewCount': 198, 'applicationCount': 23, 'deadline': '2026-12-31',
        'isUrgent': False, 'isRemoteWork': False,
        'createdAt': '2026-07-15T10:00:00', 'updatedAt': '2026-08-18T10:00:00',
        'publishedAt': '2026-07-15T10:00:00',
    },
    {
        'id': 106, 'title': '运维工程师（DevOps）', 'companyName': '创新科技有限公司',
        'department': '基础架构部', 'location': '北京-海淀区', 'jobType': '全职',
        'salaryMin': 12000, 'salaryMax': 20000, 'salaryRange': '12k-20k',
        'experienceRequired': '1-3年', 'educationRequired': '本科',
        'description': '负责公司基础设施运维，CI/CD 流水线建设，容器化部署',
        'requirements': '1. 熟悉 Linux 系统管理\n2. 熟悉 Docker、Kubernetes\n3. 熟悉 Jenkins/GitLab CI\n4. 熟悉 Prometheus 监控',
        'benefits': '五险一金、13薪、弹性工作',
        'skills': ['Linux', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'Prometheus'],
        'tags': ['急招'], 'contactPerson': '孙经理', 'contactPhone': '13800138006',
        'contactEmail': 'hr@mock.com', 'status': 'active', 'priorityLevel': 2,
        'viewCount': 167, 'applicationCount': 19, 'deadline': '2026-12-31',
        'isUrgent': True, 'isRemoteWork': False,
        'createdAt': '2026-08-10T10:00:00', 'updatedAt': '2026-08-20T10:00:00',
        'publishedAt': '2026-08-10T10:00:00',
    },
]

MOCK_APPLICATIONS = [
    {
        'id': 501, 'jobId': 101, 'jobTitle': 'Python 后端开发工程师',
        'companyName': '创新科技有限公司', 'userId': 2001, 'userName': '张伟',
        'userEmail': 'zhangwei@student.com',
        'resumeContent': '计算机科学与技术专业，3年 Python 后端经验，熟悉 Django、PostgreSQL、Redis。曾参与多个中型 SaaS 项目开发。',
        'coverLetter': '您好，我对贵公司的 Python 后端岗位非常感兴趣，我的技能栈与岗位需求高度匹配。',
        'status': 'pending', 'statusDisplayName': '待处理',
        'appliedAt': '2026-08-15T14:30:00', 'createdAt': '2026-08-15T14:30:00',
        'updatedAt': '2026-08-15T14:30:00', 'jobLocation': '北京-海淀区',
        'jobType': '全职', 'salaryRange': '15k-25k', 'department': '技术部',
    },
    {
        'id': 502, 'jobId': 101, 'jobTitle': 'Python 后端开发工程师',
        'companyName': '创新科技有限公司', 'userId': 2002, 'userName': '李娜',
        'userEmail': 'lina@student.com',
        'resumeContent': '软件工程专业，2年 Python 开发经验，熟悉 FastAPI、MySQL、MongoDB。有数据分析项目经验。',
        'coverLetter': '希望有机会加入贵公司，参与产品研发。',
        'status': 'reviewing', 'statusDisplayName': '审核中',
        'appliedAt': '2026-08-12T09:15:00', 'reviewedAt': '2026-08-14T16:20:00',
        'notes': '技能匹配度较高，安排技术面试',
        'createdAt': '2026-08-12T09:15:00', 'updatedAt': '2026-08-14T16:20:00',
        'jobLocation': '北京-海淀区', 'jobType': '全职',
        'salaryRange': '15k-25k', 'department': '技术部',
    },
    {
        'id': 503, 'jobId': 102, 'jobTitle': 'Java 高级开发工程师',
        'companyName': '创新科技有限公司', 'userId': 2003, 'userName': '王强',
        'userEmail': 'wangqiang@student.com',
        'resumeContent': '计算机科学与技术专业，6年 Java 开发经验，精通 Spring Cloud、分布式架构。曾主导多个亿级用户系统。',
        'coverLetter': '我具备丰富的 Java 后端开发经验和团队管理能力，期待与贵公司一起打造高质量的系统。',
        'status': 'accepted', 'statusDisplayName': '已录用',
        'appliedAt': '2026-07-20T11:00:00', 'reviewedAt': '2026-07-25T10:00:00',
        'notes': '面试表现优秀，技术深度符合预期，建议录用',
        'createdAt': '2026-07-20T11:00:00', 'updatedAt': '2026-07-25T10:00:00',
        'jobLocation': '北京-海淀区', 'jobType': '全职',
        'salaryRange': '20k-35k', 'department': '技术部',
    },
    {
        'id': 504, 'jobId': 103, 'jobTitle': '前端开发工程师（React）',
        'companyName': '创新科技有限公司', 'userId': 2004, 'userName': '赵敏',
        'userEmail': 'zhaomin@student.com',
        'resumeContent': '软件工程专业，4年前端开发经验，精通 React、TypeScript，有大型 B 端产品经验。',
        'coverLetter': '希望加入贵公司，打造优质的用户体验。',
        'status': 'rejected', 'statusDisplayName': '已拒绝',
        'appliedAt': '2026-08-01T15:45:00', 'reviewedAt': '2026-08-05T09:30:00',
        'notes': '经验与岗位要求有一定差距，暂不匹配',
        'createdAt': '2026-08-01T15:45:00', 'updatedAt': '2026-08-05T09:30:00',
        'jobLocation': '上海-浦东新区', 'jobType': '全职',
        'salaryRange': '15k-28k', 'department': '技术部',
    },
    {
        'id': 505, 'jobId': 104, 'jobTitle': '人工智能算法工程师',
        'companyName': '创新科技有限公司', 'userId': 2005, 'userName': '陈思',
        'userEmail': 'chensi@student.com',
        'resumeContent': '人工智能专业硕士，熟悉 PyTorch、LLM 微调，有 NLP 方向顶会论文 2 篇。',
        'coverLetter': '希望加入贵公司 AI 团队，共同推动技术创新。',
        'status': 'pending', 'statusDisplayName': '待处理',
        'appliedAt': '2026-08-18T10:00:00',
        'createdAt': '2026-08-18T10:00:00', 'updatedAt': '2026-08-18T10:00:00',
        'jobLocation': '北京-海淀区', 'jobType': '全职',
        'salaryRange': '25k-50k', 'department': 'AI实验室',
    },
]

@app.route('/api/jobs/company/<int:companyId>', methods=['GET'])
def mock_get_company_jobs(companyId):
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 10))
    start = (page - 1) * size
    end = start + size
    jobs = MOCK_JOBS[start:end]
    return jsonify({
        'success': True, 'message': '操作成功',
        'data': {
            'jobs': jobs,
            'totalCount': len(MOCK_JOBS),
            'currentPage': page, 'pageSize': size,
            'totalPages': (len(MOCK_JOBS) + size - 1) // size,
        }
    })

@app.route('/api/jobs/company/<int:companyId>/stats', methods=['GET'])
def mock_get_company_job_stats(companyId):
    total = len(MOCK_JOBS)
    active = sum(1 for j in MOCK_JOBS if j['status'] == 'active')
    paused = 1
    closed = 0
    views = sum(j['viewCount'] for j in MOCK_JOBS)
    apps = sum(j['applicationCount'] for j in MOCK_JOBS)
    return jsonify({
        'success': True, 'message': '操作成功',
        'data': {
            'totalJobs': total, 'activeJobs': active,
            'pausedJobs': paused, 'closedJobs': closed,
            'totalViews': views, 'totalApplications': apps,
        }
    })

@app.route('/api/jobs/create', methods=['POST'])
def mock_create_job():
    data = request.get_json() or {}
    new_id = max(j['id'] for j in MOCK_JOBS) + 1 if MOCK_JOBS else 200
    job = {
        'id': new_id, 'title': data.get('title', '新岗位'),
        'companyName': '创新科技有限公司',
        'department': data.get('department', '技术部'),
        'location': data.get('location', '北京'),
        'jobType': data.get('jobType', '全职'),
        'salaryMin': data.get('salaryMin', 10000),
        'salaryMax': data.get('salaryMax', 20000),
        'salaryRange': f"{data.get('salaryMin', 10)}k-{data.get('salaryMax', 20)}k",
        'experienceRequired': data.get('experienceRequired', '不限'),
        'educationRequired': data.get('educationRequired', '本科'),
        'description': data.get('description', ''),
        'requirements': data.get('requirements', ''),
        'benefits': data.get('benefits', '五险一金'),
        'skills': data.get('skills', []),
        'tags': data.get('tags', []),
        'contactPerson': data.get('contactPerson', 'HR'),
        'contactPhone': data.get('contactPhone', ''),
        'contactEmail': data.get('contactEmail', 'hr@mock.com'),
        'status': 'active', 'priorityLevel': 1,
        'viewCount': 0, 'applicationCount': 0,
        'deadline': data.get('deadline', '2026-12-31'),
        'isUrgent': False, 'isRemoteWork': False,
        'createdAt': __import__('datetime').datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
        'updatedAt': __import__('datetime').datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
        'publishedAt': __import__('datetime').datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
    }
    MOCK_JOBS.append(job)
    return jsonify({'success': True, 'message': '发布岗位成功', 'data': job})

@app.route('/api/jobs/<int:jobId>', methods=['PUT'])
def mock_update_job(jobId):
    data = request.get_json() or {}
    for job in MOCK_JOBS:
        if job['id'] == jobId:
            job.update({k: v for k, v in data.items() if v is not None})
            job['updatedAt'] = __import__('datetime').datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
            return jsonify({'success': True, 'message': '更新成功', 'data': job})
    return jsonify({'success': False, 'message': '岗位不存在'})

@app.route('/api/jobs/<int:jobId>', methods=['DELETE'])
def mock_delete_job(jobId):
    global MOCK_JOBS
    MOCK_JOBS = [j for j in MOCK_JOBS if j['id'] != jobId]
    return jsonify({'success': True, 'message': '删除成功'})

@app.route('/api/applications/received', methods=['GET'])
def mock_get_received_applications():
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 10))
    status = request.args.get('status', '')
    start = (page - 1) * size
    end = start + size
    filtered = MOCK_APPLICATIONS
    if status:
        filtered = [a for a in filtered if a['status'] == status]
    total = len(filtered)
    return jsonify({
        'success': True, 'message': '操作成功',
        'data': {
            'applications': filtered[start:end],
            'totalCount': total,
            'currentPage': page, 'pageSize': size,
            'totalPages': (total + size - 1) // size,
        }
    })

@app.route('/api/applications/stats', methods=['GET'])
def mock_get_application_stats():
    total = len(MOCK_APPLICATIONS)
    pending = sum(1 for a in MOCK_APPLICATIONS if a['status'] == 'pending')
    reviewing = sum(1 for a in MOCK_APPLICATIONS if a['status'] == 'reviewing')
    accepted = sum(1 for a in MOCK_APPLICATIONS if a['status'] == 'accepted')
    rejected = sum(1 for a in MOCK_APPLICATIONS if a['status'] == 'rejected')
    return jsonify({
        'success': True, 'message': '操作成功',
        'data': {
            'totalApplications': total,
            'pendingApplications': pending,
            'reviewingApplications': reviewing,
            'acceptedApplications': accepted,
            'rejectedApplications': rejected,
            'todayApplications': 1,
            'thisWeekApplications': 3,
            'thisMonthApplications': total,
        }
    })

@app.route('/api/applications/<int:applicationId>/process', methods=['PUT'])
def mock_process_application(applicationId):
    data = request.get_json() or {}
    for app in MOCK_APPLICATIONS:
        if app['id'] == applicationId:
            if 'status' in data:
                app['status'] = data['status']
                status_map = {'pending': '待处理', 'reviewing': '审核中', 'accepted': '已录用', 'rejected': '已拒绝'}
                app['statusDisplayName'] = status_map.get(data['status'], data['status'])
            if 'notes' in data:
                app['notes'] = data['notes']
            app['updatedAt'] = __import__('datetime').datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
            return jsonify({'success': True, 'message': '处理成功', 'data': app})
    return jsonify({'success': False, 'message': '申请不存在'})


# ==================== 简历智能分析API（调用Coze工作流） ====================
import os

def _load_coze_config():
    """从 .env 文件加载 Coze 配置"""
    env_path = Path(__file__).resolve().parent / '.env'
    if env_path.is_file():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
        except ImportError:
            # 手动解析 .env
            for line in env_path.read_text(encoding='utf-8').splitlines():
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    return {
        'token': os.environ.get('COZE_API_TOKEN', ''),
        'workflow_id': os.environ.get('COZE_WORKFLOW_ID', ''),
        'base_url': os.environ.get('COZE_BASE_URL', 'https://api.coze.cn'),
        'dashscope_key': os.environ.get('DASHSCOPE_API_KEY', ''),
        'dashscope_base': os.environ.get('DASHSCOPE_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
    }


def _fallback_llm_analysis(job_requirements: str, resume_content: str) -> str:
    """当 Coze 不可用时，使用本地 DashScope LLM 生成分析结果（降级方案）"""
    import json
    import requests

    config = _load_coze_config()
    if not config['dashscope_key']:
        return json.dumps({
            "岗位匹配度": {
                "核心技能": {"整体评估": "暂无数据 - API密钥未配置"},
                "经验背景": {"整体评估": "暂无数据 - API密钥未配置"},
            },
            "综合评估": "系统未配置 LLM API 密钥，请联系管理员检查后端 .env 配置文件中的 DASHSCOPE_API_KEY。",
            "亮点": ["请先完成后端配置"],
            "待改进": ["请先完成后端配置"],
            "面试建议": ["请先完成后端配置"]
        }, ensure_ascii=False)

    prompt = f"""你是资深的招聘专家和AI简历分析师。请根据以下【岗位要求】和【候选人简历】，生成一份详细的简历分析报告。

要求：严格按 JSON 格式返回，不要任何其他文字，格式如下：
```json
{{
  "岗位匹配度": {{
    "核心技能": {{"前端技术": "90% - 具体点评", "后端开发": "85% - 具体点评", "工程化能力": "88% - 具体点评"}},
    "经验背景": {{"行业经验": "80% - 具体点评", "项目深度": "85% - 具体点评"}}
  }},
  "综合评估": "300字左右的总体评价，说明候选人是否适合该岗位、核心优势和整体定位",
  "亮点": ["优势点1（具体）", "优势点2（具体）", "优势点3（具体）", "优势点4（具体）"],
  "待改进": ["待提升点1（具体建议）", "待提升点2（具体建议）"],
  "面试建议": ["面试考察点1（具体）", "面试考察点2（具体）", "面试考察点3（具体）"]
}}
```

注意：
- 匹配度评分要客观，基于简历内容和岗位要求的实际契合度
- 亮点和待改进项要具体、有针对性，不要空泛
- 所有评分带百分号并附带一句简要点评
- 语言要专业、中肯

------
【岗位要求】：
{job_requirements}

【候选人简历】：
{resume_content}
"""

    try:
        resp = requests.post(
            f"{config['dashscope_base']}/chat/completions",
            headers={
                "Authorization": f"Bearer {config['dashscope_key']}",
                "Content-Type": "application/json"
            },
            json={
                "model": "qwen-plus",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "response_format": {"type": "json_object"}
            },
            timeout=120
        )
        resp.raise_for_status()
        data = resp.json()
        content = data['choices'][0]['message']['content']
        # 清理 markdown 代码块标记
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```", 2)[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip().rstrip("`").strip()
        # 验证 JSON
        json.loads(cleaned)
        return cleaned
    except Exception as e:
        return json.dumps({
            "岗位匹配度": {
                "核心技能": {"分析失败": "0% - LLM调用失败"},
                "经验背景": {"分析失败": "0% - LLM调用失败"},
            },
            "综合评估": f"分析过程中出现错误：{str(e)}。请稍后重试或联系管理员。",
            "亮点": ["系统暂时无法生成分析"],
            "待改进": ["请检查后端日志或网络连接"],
            "面试建议": ["请稍后重试"]
        }, ensure_ascii=False)


@app.route('/api/jianli/analyze', methods=['POST'])
def jianli_analyze():
    """
    智能简历分析接口：
    - 使用阿里云百炼 qwen-plus 大模型直接生成结构化分析报告
    - 注：Coze 工作流（ID 7587056284591980595）是求职问答智能体专用，不用于简历分析
    入参（multipart/form-data）：
      - jobRequirements: 岗位要求文本
      - resumeContent: 简历文本内容
      - file: 简历文件（可选，暂未解析内容）
    返回：{ success, data: "<JSON字符串>" }  兼容前端解析格式
    """
    import json

    try:
        job_requirements = request.form.get('jobRequirements', '').strip()
        resume_content = request.form.get('resumeContent', '').strip()
        uploaded_file = request.files.get('file')

        if not resume_content and not uploaded_file:
            return jsonify({
                'success': False,
                'error': '请提供简历文本或上传简历文件'
            }), 400

        if not job_requirements:
            return jsonify({
                'success': False,
                'error': '请填写岗位要求信息'
            }), 400

        if not resume_content and uploaded_file:
            resume_content = f"[用户上传了文件: {uploaded_file.filename}，请在版本升级后支持文件解析]"

        print(f"[Resume-LLM] 开始简历分析: 岗位要求长度={len(job_requirements)}, 简历长度={len(resume_content)}")
        analysis_output = _fallback_llm_analysis(job_requirements, resume_content)
        print(f"[Resume-LLM] 分析完成, 输出长度={len(analysis_output)}")

        # 兼容前端的嵌套包装格式：前端会先 JSON.parse(resultData.data) 得到 { output: ... }
        wrapped = json.dumps({"output": analysis_output}, ensure_ascii=False)
        return jsonify({
            "success": True,
            "data": wrapped
        })

    except Exception as e:
        print(f"[ERROR] 简历分析接口异常: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"服务器内部错误: {str(e)}"
        }), 500


if __name__ == '__main__':
    try:
        initialize_learning_resources()
    except Exception as e:
        print(f'[WARN] 跳过学习资源初始化(DB不可用): {e}')
    app.run(port=8082, debug=False, threaded=False)
