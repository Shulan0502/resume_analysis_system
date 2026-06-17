from DrissionPage import ChromiumOptions
from pprint import pprint
path = r'D:\Google\Chrome\Application\chrome.exe'
#ChromiumOptions().set_browser_path(path).save()
from DrissionPage import ChromiumPage
import csv

job_keywords = [
    "python开发",
    "java后端",
    "后端开发",
    "前端开发",
    "大数据开发",
    "golang游戏开发",
    "c%2Fc%2B%2B",
    "小程序开发",
    "技术运维",
    "机器人",
    "人工智能"
]
# 开启持久缓存，记住登录状态
co = ChromiumOptions()
co.set_browser_path(r'D:\Google\Chrome\Application\chrome.exe')
# 缓存文件夹，保存登录cookie
co.set_user_data_path(r'D:\boss_browser_cache')
co.save()
dp = ChromiumPage(co)


with open('data.csv',mode='a',encoding='utf-8',newline='')as f:
    csv_writer=csv.DictWriter(f,fieldnames=[
    'title',
    'company_name',
    'location',
    'salary_extension',
    'salary_unit',
    'experience_required',
    'education_required',
    'skills',
    'welfareList',
])

    for keyword in job_keywords:
        print(f"\n===== 正在爬取关键词：{keyword} =====")
        # 拼接全国搜索URL，自动替换query关键词
        url = f'https://www.zhipin.com/web/geek/jobs?query={keyword}'
        dp.listen.start('joblist')
        dp.get(url)

        # 等待接口返回岗位数据
        resp = dp.listen.wait()
        json_data = resp.response.body
        jobList = json_data['zpData']['jobList']

        # 无岗位直接跳过当前关键词
        if not jobList:
            print(f"{keyword} 未查询到岗位数据")
            continue

        for job in jobList:
        #在循环中提取具体的职位信息
            dit={
                'title':job['jobName'],
                'company_name':job['brandName'],
                'location':job['cityName'],
                'salary_extension':job['salaryDesc'],
                'salary_unit':'月薪',
                'experience_required':job['jobExperience'],
                'education_required':job['jobDegree'],
        #        'description':job['salaryDesc'],
        #        'requirements':job['salaryDesc'],
                'skills':' '.join(job['skills']),
                'welfareList':' '.join(job['welfareList']),
        #        'url':'job['salaryDesc']',
            }
            csv_writer.writerow(dit)
            print(dit)


# 阻塞防止浏览器一闪关闭
    input("按回车关闭")
    dp.quit()