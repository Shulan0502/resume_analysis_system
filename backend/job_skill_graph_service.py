"""
岗位能力知识图谱服务
功能：
1. 使用LLM规范化岗位和技能
2. 直接用Cypher写入Neo4j（绕开Graphiti的向量函数依赖）
3. 提供统计、搜索、技能分析等API

启动：uvicorn job_skill_graph_service:app --port 7576 --reload
"""

import asyncio
import logging
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from neo4j import GraphDatabase

# 加载环境变量
load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ============================================================================
# 配置
# ============================================================================

POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'job_graph')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '123456@')

NEO4J_URI = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
NEO4J_USER = os.getenv('NEO4J_USER', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'password123')

DASHSCOPE_API_KEY = os.getenv('DASHSCOPE_API_KEY', '')
DASHSCOPE_BASE_URL = os.getenv('DASHSCOPE_BASE_URL', '[image_uploaded]')
LLM_MODEL = os.getenv('LLM_MODEL', '')

# ============================================================================
# FastAPI
# ============================================================================

app = FastAPI(title="岗位能力知识图谱服务")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# 数据模型
# ============================================================================

class JobSkillRequest(BaseModel):
    title: str
    company_name: str
    raw_skills: str
    experience: str = ""
    education: str = ""

class SkillExtractionResult(BaseModel):
    normalized_job_name: str
    core_skills: list[str]
    optional_skills: list[str]
    skill_categories: dict[str, list[str]]
    confidence_score: float

# ============================================================================
# LLM 客户端
# ============================================================================

class LLMClient:
    def __init__(self):
        self.api_key = DASHSCOPE_API_KEY
        self.base_url = DASHSCOPE_BASE_URL

    async def achat_complete(self, messages: list, temperature: float = 0.1) -> str:
        import httpx
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                json={"model": LLM_MODEL, "messages": messages, "temperature": temperature},
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            if "choices" in result:
                return result["choices"][0]["message"]["content"]
            raise ValueError("LLM返回格式错误")

# ============================================================================
# PostgreSQL
# ============================================================================

def get_job_postings_sync():
    import psycopg2
    conn = psycopg2.connect(
        host=POSTGRES_HOST, database=POSTGRES_DB,
        user=POSTGRES_USER, password=POSTGRES_PASSWORD
    )
    query = """
    SELECT id, title, company_name, skills, experience_required, education_required
    FROM job_postings
    WHERE skills IS NOT NULL AND skills != ''
    ORDER BY id
    """
    cur = conn.cursor()
    cur.execute(query)
    columns = [desc[0] for desc in cur.description]
    jobs = [dict(zip(columns, row)) for row in cur.fetchall()]
    conn.close()
    return jobs

def get_companies_for_job(normalized_job_name: str) -> list[str]:
    """从PostgreSQL查询提供该岗位的公司（直接通过数据库查）"""
    import psycopg2
    conn = psycopg2.connect(
        host=POSTGRES_HOST, database=POSTGRES_DB,
        user=POSTGRES_USER, password=POSTGRES_PASSWORD
    )
    cur = conn.cursor()
    # 模糊匹配岗位名称
    cur.execute("""
        SELECT DISTINCT company_name FROM job_postings
        WHERE title LIKE %s OR title LIKE %s
        LIMIT 50
    """, (f"%{normalized_job_name}%", f"%{normalized_job_name[:5]}%"))
    companies = [row[0] for row in cur.fetchall()]
    conn.close()
    return companies

# ============================================================================
# API 端点
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "job_skill_graph_service",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/api/job-skill-graph/extract-and-normalize", response_model=SkillExtractionResult)
async def extract_and_normalize_job_skills(request: JobSkillRequest):
    """使用LLM提取和规范化岗位技能要求"""
    try:
        llm_client = LLMClient()
        prompt = f"""
你是一个专业的岗位技能分析专家。请分析以下岗位信息，提取和规范化技能要求：

岗位名称：{request.title}
公司名称：{request.company_name}
原始技能描述：{request.raw_skills}
经验要求：{request.experience}
学历要求：{request.education}

请严格按照以下JSON格式返回，不要添加任何其他文字说明：

{{
    "normalized_job_name": "标准化的岗位名称（去掉括号内容，统一首字母大写）",
    "core_skills": ["核心技能列表（标准化后的技能名称）"],
    "optional_skills": ["可选技能列表"],
    "skill_categories": {{
        "programming_languages": ["编程语言类，如Python、Java"],
        "frameworks": ["框架类，如Django、Spring"],
        "tools": ["工具类，如Docker、Git"],
        "databases": ["数据库类，如MySQL、PostgreSQL"],
        "soft_skills": ["软技能类，如团队协作、沟通能力"]
    }},
    "confidence_score": 0.95
}}

规范化规则示例：
1. 岗位名称：
   - "Python开发 爬虫/数据采集/服务端开发" → "Python开发"
   - "Python开发（14薪-16薪）" → "Python开发"
   - "大数据开发工程师" → "大数据开发"
   - "数据开发【线上面试】8:30-5:30，午休3小时" → "大数据开发"
   - "java后端" → "Java后端"
   - "前端开发实习生" → "前端开发"

2. 技能名称：
   - "爬虫" = "爬虫经验" → 统一为"爬虫"
   - "python" = "Python" → 统一为"Python"
   - "Docker" + "Kubernetes" → 分别保留，归类为容器工具
   - "MySQL" + "PostgreSQL" → 分别保留，归类为数据库
   - "接受无前端经验" → 这是一个要求，不是技能，应该忽略

请只返回JSON，不要其他解释文字。
"""
        messages = [{"role": "user", "content": prompt}]
        response = await llm_client.achat_complete(messages, temperature=0.1)
        import json
        result_data = json.loads(response)
        return SkillExtractionResult(**result_data)
    except Exception as e:
        logger.error(f"技能提取失败: {e}")
        raise HTTPException(status_code=500, detail=f"技能提取失败: {str(e)}")


@app.post("/api/job-skill-graph/build-graph")
async def build_job_skill_graph():
    """
    批量构建岗位技能知识图谱
    1. LLM 规范化岗位和技能
    2. 直接用 Cypher 写 Neo4j（Job-Skill REQUIRES 关系）
    3. 公司-岗位关系不入图谱（直接查数据库）
    """
    try:
        # 1. 清空图谱
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
        driver.close()
        logger.info("已清空 Neo4j")

        # 2. 获取岗位数据
        jobs = get_job_postings_sync()
        if not jobs:
            return {"success": False, "message": "没有找到岗位数据"}

        # 3. 逐条处理：LLM规范化 + 直接Cypher写入
        llm_client = LLMClient()
        processed = 0
        failed = 0
        skill_set = set()
        job_set = set()

        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

        for i, job in enumerate(jobs, 1):
            try:
                if i % 10 == 1:
                    logger.info(f"处理进度: {i}/{len(jobs)}")

                # LLM规范化
                request_data = JobSkillRequest(
                    title=job['title'],
                    company_name=job['company_name'],
                    raw_skills=job['skills'] or '',
                    experience=job.get('experience_required', '') or '',
                    education=job.get('education_required', '') or ''
                )
                result = await extract_and_normalize_job_skills(request_data)

                # 直接用 Cypher 写节点和关系
                with driver.session() as session:
                    # 写岗位节点
                    session.run(
                        "MERGE (j:Job {name: $name}) SET j.original_id = $id",
                        {"name": result.normalized_job_name, "id": str(job['id'])}
                    )
                    job_set.add(result.normalized_job_name)

                    # 写技能节点和关系
                    all_skills = result.core_skills + result.optional_skills
                    for skill in all_skills:
                        # 写技能节点（带分类）
                        category = "技术"
                        for cat, skills_list in result.skill_categories.items():
                            if skill in skills_list:
                                category = cat
                                break
                        session.run(
                            "MERGE (s:Skill {name: $name}) SET s.category = $category",
                            {"name": skill, "category": category}
                        )
                        skill_set.add(skill)

                        # 写关系
                        is_required = skill in result.core_skills
                        importance = "required" if is_required else "preferred"
                        session.run("""
                            MATCH (j:Job {name: $job_name}), (s:Skill {name: $skill_name})
                            MERGE (j)-[r:REQUIRES]->(s)
                            SET r.importance = $importance
                        """, {
                            "job_name": result.normalized_job_name,
                            "skill_name": skill,
                            "importance": importance
                        })

                processed += 1
                await asyncio.sleep(0.1)
            except Exception as e:
                logger.warning(f"处理失败: {job['title']} - {e}")
                failed += 1

        driver.close()

        logger.info(f"处理完成: 成功 {processed} 条, 失败 {failed} 条")
        return {
            "success": True,
            "message": f"成功处理 {processed} 个岗位",
            "stats": {
                "total_jobs": len(job_set),
                "total_skills": len(skill_set),
                "processed": processed,
                "failed": failed
            }
        }
    except Exception as e:
        logger.error(f"图谱构建失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/job-skill-graph/stats")
async def get_graph_stats():
    """图谱统计信息"""
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            job_count = session.run("MATCH (j:Job) RETURN count(j) as c").single()["c"]
            skill_count = session.run("MATCH (s:Skill) RETURN count(s) as c").single()["c"]
            rel_count = session.run("MATCH ()-[r:REQUIRES]->() RETURN count(r) as c").single()["c"]

            popular_skills = session.run("""
                MATCH (j:Job)-[:REQUIRES]->(s:Skill)
                RETURN s.name as skill, count(j) as job_count
                ORDER BY job_count DESC
                LIMIT 10
            """).data()

            # 技能分类统计
            categories = session.run("""
                MATCH (s:Skill)
                WHERE s.category IS NOT NULL
                RETURN s.category as category, count(s) as count
                ORDER BY count DESC
            """).data()
        driver.close()

        return {
            "success": True,
            "data": {
                "nodes": {"jobs": job_count, "skills": skill_count},
                "relationships": {"requires": rel_count},
                "popular_skills": popular_skills,
                "skill_categories": categories
            }
        }
    except Exception as e:
        logger.error(f"统计查询失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/job-skill-graph/skill-analysis/{skill_name}")
async def analyze_skill(skill_name: str):
    """分析特定技能的需求情况"""
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            # 需要该技能的岗位
            jobs = session.run("""
                MATCH (j:Job)-[:REQUIRES]->(s:Skill {name: $skill_name})
                RETURN DISTINCT j.name as job
                ORDER BY job
            """, {"skill_name": skill_name}).data()

            # 共现技能
            related = session.run("""
                MATCH (j:Job)-[:REQUIRES]->(s:Skill {name: $skill_name})
                MATCH (j)-[:REQUIRES]->(other:Skill)
                WHERE other.name <> $skill_name
                RETURN other.name as skill, count(j) as co_occurrence
                ORDER BY co_occurrence DESC
                LIMIT 10
            """, {"skill_name": skill_name}).data()
        driver.close()

        # 公司信息直接查数据库
        companies = set()
        for job in jobs:
            for c in get_companies_for_job(job["job"]):
                companies.add(c)

        return {
            "success": True,
            "data": {
                "skill": skill_name,
                "job_count": len(jobs),
                "jobs": [r["job"] for r in jobs],
                "company_count": len(companies),
                "companies": sorted(list(companies))[:50],
                "related_skills": related
            }
        }
    except Exception as e:
        logger.error(f"技能分析失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/job-skill-graph/job-analysis/{job_name}")
async def analyze_job(job_name: str):
    """分析特定岗位"""
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            skills = session.run("""
                MATCH (j:Job {name: $job_name})-[r:REQUIRES]->(s:Skill)
                RETURN s.name as skill, s.category as category, r.importance as importance
            """, {"job_name": job_name}).data()
        driver.close()

        # 公司信息查数据库
        companies = get_companies_for_job(job_name)

        return {
            "success": True,
            "data": {
                "job": job_name,
                "skill_count": len(skills),
                "skills": skills,
                "companies": companies
            }
        }
    except Exception as e:
        logger.error(f"岗位分析失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/job-skill-graph/search")
async def search_graph(query: str = ""):
    """搜索节点"""
    if not query:
        return {"success": False, "error": "请提供搜索关键词"}
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            results = session.run("""
                MATCH (n)
                WHERE n.name CONTAINS $query
                RETURN n.name as name, labels(n)[0] as type
                LIMIT 20
            """, {"query": query}).data()
        driver.close()
        return {"success": True, "query": query, "results": results}
    except Exception as e:
        logger.error(f"搜索失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/job-skill-graph/graph-data")
async def get_graph_data(limit: int = 100, min_skill_count: int = 1):
    """
    返回前端 G6 需要的图谱数据（节点和边）
    - limit: 最多返回多少个技能节点（按热度排序）
    - min_skill_count: 技能至少被多少个岗位需要才显示
    """
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            # 节点：所有 Job + Top N 技能
            jobs = session.run("""
                MATCH (j:Job)
                RETURN j.name as id, j.name as name, 'Job' as type
            """).data()

            skills = session.run("""
                MATCH (j:Job)-[:REQUIRES]->(s:Skill)
                WITH s, count(j) as cnt
                WHERE cnt >= $min_count
                RETURN s.name as id, s.name as name, 'Skill' as type,
                       s.category as category, cnt as job_count
                ORDER BY cnt DESC
                LIMIT $limit
            """, {"limit": limit, "min_count": min_skill_count}).data()

            nodes = jobs + skills

            # 边：Job -[:REQUIRES]-> Skill
            edges = session.run("""
                MATCH (j:Job)-[r:REQUIRES]->(s:Skill)
                WHERE s.name IN $skill_names
                RETURN j.name as source, s.name as target,
                       r.importance as importance
            """, {"skill_names": [s["id"] for s in skills]}).data()

        driver.close()

        # 转 G6 格式
        g6_nodes = [
            {
                "id": n["id"],
                "label": n["name"],
                "type": n["type"],
                "category": n.get("category"),
                "job_count": n.get("job_count", 0) if n["type"] == "Skill" else None
            }
            for n in nodes
        ]
        g6_edges = [
            {"source": e["source"], "target": e["target"], "importance": e.get("importance", "required")}
            for e in edges
        ]

        return {
            "success": True,
            "data": {
                "nodes": g6_nodes,
                "edges": g6_edges,
                "stats": {
                    "total_nodes": len(g6_nodes),
                    "total_edges": len(g6_edges),
                    "job_nodes": len(jobs),
                    "skill_nodes": len(skills)
                }
            }
        }
    except Exception as e:
        logger.error(f"获取图谱数据失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 启动
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    if not DASHSCOPE_API_KEY:
        logger.warning("⚠️  DASHSCOPE_API_KEY 未设置")
    logger.info("🚀 启动岗位能力知识图谱服务...")
    uvicorn.run("job_skill_graph_service:app", host="0.0.0.0", port=7576, reload=True)
