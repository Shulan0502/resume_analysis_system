from flask import Flask, jsonify, request
import psycopg2

app = Flask(__name__)

def get_db_connection():
    conn = psycopg2.connect(
        dbname='job_graph',
        user='postgres',
        password='123456@',
        host='localhost'
    )
    return conn

@app.route('/api/jobs/active', methods=['GET'])
def get_active_jobs():
    try:
        page = int(request.args.get('page', 1))
        size = int(request.args.get('size', 12))
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('SELECT COUNT(*) FROM job_postings')
        total_count = cur.fetchone()[0]
        
        if total_count == 0:
            return jsonify({
                'success': False,
                'message': '数据库中没有数据'
            })
        
        offset = (page - 1) * size
        cur.execute('''
            SELECT id, title, company_name, location, salary_extension, salary_unit,
                   experience_required, education_required, skills, welfarelist
            FROM job_postings ORDER BY id LIMIT %s OFFSET %s
        ''', (size, offset))
        
        rows = cur.fetchall()
        jobs = []
        for row in rows:
            # 解析薪资范围
            salary_extension = row[4]
            salary_range = salary_extension if salary_extension else '面议'
            
            jobs.append({
                'id': row[0],
                'title': row[1],
                'companyName': row[2],
                'department': '技术部',  # 默认值
                'location': row[3],
                'jobType': '全职',  # 默认值
                'salaryExtension': salary_extension,
                'salaryUnit': row[5],
                'salaryRange': salary_range,
                'experienceRequired': row[6],
                'educationRequired': row[7],
                'description': f'{row[1]}岗位描述',  # 默认值
                'requirements': '具有相关工作经验',  # 默认值
                'benefits': row[9] if row[9] else '五险一金',  # 使用福利列表作为福利待遇
                'welfareList': row[9],
                'skills': row[8].split() if row[8] else [],
                'tags': ['热门'],  # 默认值
                'viewCount': 0,  # 默认值
                'applicationCount': 0,  # 默认值
                'deadline': '2025-12-31',  # 默认值
                'isUrgent': False,  # 默认值
                'isRemoteWork': False,  # 默认值
                'createdAt': '2025-01-01T00:00:00',  # 默认值
                'publishedAt': '2025-01-01T00:00:00'  # 默认值
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': '操作成功',
            'data': {
                'jobs': jobs,
                'totalCount': total_count,
                'currentPage': page,
                'pageSize': size,
                'totalPages': (total_count + size - 1) // size
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取岗位列表失败: {str(e)}'
        })

@app.route('/api/jobs/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'message': '岗位服务运行正常'
    })

@app.route('/api/jobs/popular', methods=['GET'])
def get_popular_jobs():
    try:
        limit = int(request.args.get('limit', 10))
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT id, title, company_name, location, salary_extension, salary_unit,
                   experience_required, education_required, skills, welfarelist
            FROM job_postings ORDER BY id LIMIT %s
        ''', (limit,))
        
        rows = cur.fetchall()
        jobs = []
        for row in rows:
            salary_extension = row[4]
            salary_range = salary_extension if salary_extension else '面议'
            
            jobs.append({
                'id': row[0],
                'title': row[1],
                'companyName': row[2],
                'department': '技术部',
                'location': row[3],
                'jobType': '全职',
                'salaryExtension': salary_extension,
                'salaryUnit': row[5],
                'salaryRange': salary_range,
                'experienceRequired': row[6],
                'educationRequired': row[7],
                'description': f'{row[1]}岗位描述',
                'requirements': '具有相关工作经验',
                'benefits': row[9] if row[9] else '五险一金',
                'welfareList': row[9],
                'skills': row[8].split() if row[8] else [],
                'tags': ['热门'],
                'viewCount': 0,
                'applicationCount': 0,
                'deadline': '2025-12-31',
                'isUrgent': False,
                'isRemoteWork': False,
                'createdAt': '2025-01-01T00:00:00',
                'publishedAt': '2025-01-01T00:00:00'
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': '操作成功',
            'data': jobs
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取热门岗位失败: {str(e)}'
        })

@app.route('/api/jobs/latest', methods=['GET'])
def get_latest_jobs():
    try:
        limit = int(request.args.get('limit', 10))
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT id, title, company_name, location, salary_extension, salary_unit,
                   experience_required, education_required, skills, welfarelist
            FROM job_postings ORDER BY id DESC LIMIT %s
        ''', (limit,))
        
        rows = cur.fetchall()
        jobs = []
        for row in rows:
            salary_extension = row[4]
            salary_range = salary_extension if salary_extension else '面议'
            
            jobs.append({
                'id': row[0],
                'title': row[1],
                'companyName': row[2],
                'department': '技术部',
                'location': row[3],
                'jobType': '全职',
                'salaryExtension': salary_extension,
                'salaryUnit': row[5],
                'salaryRange': salary_range,
                'experienceRequired': row[6],
                'educationRequired': row[7],
                'description': f'{row[1]}岗位描述',
                'requirements': '具有相关工作经验',
                'benefits': row[9] if row[9] else '五险一金',
                'welfareList': row[9],
                'skills': row[8].split() if row[8] else [],
                'tags': ['最新'],
                'viewCount': 0,
                'applicationCount': 0,
                'deadline': '2025-12-31',
                'isUrgent': False,
                'isRemoteWork': False,
                'createdAt': '2025-01-01T00:00:00',
                'publishedAt': '2025-01-01T00:00:00'
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': '操作成功',
            'data': jobs
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取最新岗位失败: {str(e)}'
        })

@app.route('/api/jobs/<int:jobId>', methods=['GET'])
def get_job_detail(jobId):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT id, title, company_name, location, salary_extension, salary_unit,
                   experience_required, education_required, skills, welfarelist
            FROM job_postings WHERE id = %s
        ''', (jobId,))
        
        row = cur.fetchone()
        
        if not row:
            return jsonify({
                'success': False,
                'message': '岗位不存在'
            })
        
        salary_extension = row[4]
        salary_range = salary_extension if salary_extension else '面议'
        
        job = {
            'id': row[0],
            'title': row[1],
            'companyName': row[2],
            'department': '技术部',
            'location': row[3],
            'jobType': '全职',
            'salaryExtension': salary_extension,
            'salaryUnit': row[5],
            'salaryRange': salary_range,
            'experienceRequired': row[6],
            'educationRequired': row[7],
            'description': f'这是{row[1]}岗位的详细描述。我们正在寻找一位有才华的专业人士加入我们的团队。',
            'requirements': '1. 具有相关工作经验\n2. 良好的沟通能力\n3. 团队合作精神',
            'benefits': row[9] if row[9] else '五险一金',
            'welfareList': row[9],
            'skills': row[8].split() if row[8] else [],
            'tags': ['推荐'],
            'viewCount': 0,
            'applicationCount': 0,
            'deadline': '2025-12-31',
            'isUrgent': False,
            'isRemoteWork': False,
            'createdAt': '2025-01-01T00:00:00',
            'publishedAt': '2025-01-01T00:00:00'
        }
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': '操作成功',
            'data': job
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取岗位详情失败: {str(e)}'
        })

@app.route('/api/jobs/search', methods=['POST'])
def search_jobs():
    try:
        data = request.get_json()
        keyword = data.get('keyword', '')
        page = data.get('page', 1)
        size = data.get('size', 12)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = '''
            SELECT id, title, company_name, location, salary_extension, salary_unit,
                   experience_required, education_required, skills, welfarelist
            FROM job_postings
            WHERE title ILIKE %s OR company_name ILIKE %s OR skills ILIKE %s
            ORDER BY id
            LIMIT %s OFFSET %s
        '''
        like_keyword = f'%{keyword}%'
        offset = (page - 1) * size
        
        cur.execute(query, (like_keyword, like_keyword, like_keyword, size, offset))
        
        rows = cur.fetchall()
        jobs = []
        for row in rows:
            salary_extension = row[4]
            salary_range = salary_extension if salary_extension else '面议'
            
            jobs.append({
                'id': row[0],
                'title': row[1],
                'companyName': row[2],
                'department': '技术部',
                'location': row[3],
                'jobType': '全职',
                'salaryExtension': salary_extension,
                'salaryUnit': row[5],
                'salaryRange': salary_range,
                'experienceRequired': row[6],
                'educationRequired': row[7],
                'description': f'{row[1]}岗位描述',
                'requirements': '具有相关工作经验',
                'benefits': row[9] if row[9] else '五险一金',
                'welfareList': row[9],
                'skills': row[8].split() if row[8] else [],
                'tags': ['搜索结果'],
                'viewCount': 0,
                'applicationCount': 0,
                'deadline': '2025-12-31',
                'isUrgent': False,
                'isRemoteWork': False,
                'createdAt': '2025-01-01T00:00:00',
                'publishedAt': '2025-01-01T00:00:00'
            })
        
        # 获取总数
        cur.execute('''
            SELECT COUNT(*) FROM job_postings
            WHERE title ILIKE %s OR company_name ILIKE %s OR skills ILIKE %s
        ''', (like_keyword, like_keyword, like_keyword))
        total_count = cur.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': '操作成功',
            'data': {
                'jobs': jobs,
                'totalCount': total_count,
                'currentPage': page,
                'pageSize': size,
                'totalPages': (total_count + size - 1) // size
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'搜索岗位失败: {str(e)}'
        })

@app.route('/api/jobs/apply', methods=['POST'])
def apply_for_job():
    try:
        data = request.get_json()
        job_id = data.get('jobId')
        
        return jsonify({
            'success': True,
            'message': '简历投递成功！'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'简历投递失败: {str(e)}'
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081, debug=True)
