import psycopg2

def get_db_connection():
    conn = psycopg2.connect(
        dbname='job_graph',
        user='postgres',
        password='123456@',
        host='localhost'
    )
    return conn

def get_active_jobs(page=1, size=12):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute('SELECT COUNT(*) FROM job_postings')
        total_count = cur.fetchone()[0]
        print(f'总岗位数: {total_count}')
        
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
        
        print(f'查询到 {len(jobs)} 条岗位数据')
        for job in jobs[:3]:
            print(f"岗位: {job['title']}, 公司: {job['companyName']}, 薪资: {job['salaryRange']}")
        
        return {'success': True, 'message': '操作成功', 
                'data': {'jobs': jobs, 'totalCount': total_count, 'currentPage': page, 'pageSize': size, 'totalPages': (total_count + size - 1) // size}}
    except Exception as e:
        print(f'错误: {e}')
        return {'success': False, 'message': f'获取岗位列表失败: {str(e)}'}
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    result = get_active_jobs()
    print('查询结果:', result['success'])
