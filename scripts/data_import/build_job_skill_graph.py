#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
岗位能力知识图谱构建脚本
功能：从PostgreSQL提取数据，通过LLM规范化后存入Neo4j图谱
用法：python scripts/data_import/build_job_skill_graph.py
"""

import psycopg2
import json
import requests
import time
import sys
import io
from datetime import datetime
from dotenv import load_dotenv
import os

# 设置输出编码为 UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 加载环境变量
load_dotenv()

# 配置
POSTGRES_CONFIG = {
    'host': 'localhost',
    'database': 'job_graph',
    'user': 'postgres',
    'password': '123456@'
}

GRAPHITI_SERVICE_URL = "http://localhost:7576"
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "password123"


def get_job_postings():
    """从PostgreSQL获取所有岗位数据"""
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        cursor = conn.cursor()

        query = """
        SELECT id, title, company_name, skills, experience_required, education_required, description
        FROM job_postings
        WHERE skills IS NOT NULL AND skills != ''
        ORDER BY id
        """

        cursor.execute(query)

        columns = [desc[0] for desc in cursor.description]
        jobs = []

        for row in cursor.fetchall():
            jobs.append(dict(zip(columns, row)))

        conn.close()
        print(f"✅ 成功获取 {len(jobs)} 条岗位数据")
        return jobs

    except Exception as e:
        print(f"❌ 获取岗位数据失败: {e}")
        return []


def extract_and_normalize_skills(job_data):
    """调用Graphiti服务提取和规范化技能"""
    url = f"{GRAPHITI_SERVICE_URL}/api/job-skill-graph/extract-and-normalize"

    try:
        response = requests.post(url, json=job_data, timeout=30)
        response.raise_for_status()

        # API直接返回技能提取结果
        return response.json()

    except Exception as e:
        print(f"❌ 调用Graphiti服务失败: {e}")
        return None


def build_graph_data(jobs):
    """构建图谱数据"""
    graph_data = []
    processed = 0
    failed = 0

    print(f"\n🔄 开始处理 {len(jobs)} 条岗位数据...")

    for i, job in enumerate(jobs, 1):
        print(f"处理进度: {i}/{len(jobs)} - {job['title'][:30]}")

        # 准备请求数据
        job_request = {
            "title": job['title'],
            "company_name": job['company_name'],
            "raw_skills": job['skills'],
            "experience": job.get('experience_required', ''),
            "education": job.get('education_required', '')
        }

        # 调用LLM规范��
        normalized = extract_and_normalize_skills(job_request)

        if normalized:
            graph_data.append({
                'job_name': normalized['normalized_job_name'],
                'company': job['company_name'],
                'skills': normalized['core_skills'],
                'job_id': job['id'],
                'skill_categories': normalized.get('skill_categories', {}),
                'confidence': normalized.get('confidence_score', 0.0)
            })
            processed += 1
        else:
            failed += 1

        # 避免请求过快
        time.sleep(0.5)

    print(f"\n📊 处理完成:")
    print(f"  ✅ 成功: {processed} 条")
    print(f"  ❌ 失败: {failed} 条")
    if processed > 0:
        print(f"  📈 成功率: {processed/len(jobs)*100:.1f}%")

    return graph_data


def store_to_graphiti_service(graph_data):
    """将处理后的数据发送到Graphiti服务存储"""
    url = f"{GRAPHITI_SERVICE_URL}/api/job-skill-graph/build-graph"

    try:
        print(f"\n🔄 发送数据到Graphiti服务...")

        response = requests.post(url, timeout=300)  # 5分钟超时

        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                stats = result.get('stats', {})
                print(f"✅ 图谱构建完成:")
                print(f"  🏢 岗位节点: {stats.get('total_jobs', 0)}")
                print(f"  💼 技能节点: {stats.get('total_skills', 0)}")
                print(f"  🏢 公司节点: {stats.get('total_companies', 0)}")
                print(f"  🔗 关系数量: {stats.get('total_relations', 0)}")
                return True
            else:
                print(f"❌ 图谱构建失败: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP错误: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ 调用Graphiti服务失败: {e}")
        return False


def main():
    """主函数"""
    print("=" * 60)
    print("🚀 岗位能力知识图谱构建脚本")
    print("=" * 60)
    print(f"⏰ 开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 步骤1: 获取原始数据
    jobs = get_job_postings()
    if not jobs:
        print("❌ 无法获取岗位数据，脚本终止")
        return

    # 步骤2: LLM规范化处理
    graph_data = build_graph_data(jobs)
    if not graph_data:
        print("❌ 数据处理失败，脚本终止")
        return

    # 步骤3: 存储到Neo4j
    success = store_to_graphiti_service(graph_data)

    print(f"\n⏰ 结束时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    if success:
        print("🎉 图谱构建成功！现在可以通过API查询图谱数据了")
        print("📱 访问: http://localhost:5173/job-skill-graph")
    else:
        print("❌ 图谱构建失败，请检查错误信息")


if __name__ == "__main__":
    main()