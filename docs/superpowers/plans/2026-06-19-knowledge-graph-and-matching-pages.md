# 能力图谱页 + 人岗匹配页 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 LearnSphere 学生端新增"能力图谱"和"人岗匹配"两个页面，前端用 AntV G6 渲染 Job-Skill 知识图谱，后端补全人岗匹配和岗位推荐接口，用户通过粘贴简历文本获得匹配分数、缺失技能和推荐岗位。

**Architecture:** 复用现有 FastAPI 服务 `job_skill_graph_service.py`（端口 7576），新增 2 个接口；前端通过新增 Vite proxy 规则让 `/api/job-skill-graph/*` 转发到 7576，避免改 baseURL。前端两个新页面共用一个 `services/graph_api.ts` 封装层，状态管理沿用 `useState + useEffect` 与项目其它页面保持一致。

**Tech Stack:** React 18 + Vite 5 + TypeScript 5 + Ant Design 5 + AntV G6 v5 + Tailwind 3.4 + zustand 4.5 + FastAPI + Neo4j 5 + -plus LLM

**Spec:** `docs/superpowers/specs/2026-06-19-knowledge-graph-and-matching-pages-design.md`

---

## Global Constraints

- 后端服务端口固定 7576，Neo4j 端口 7687，PostgreSQL 数据库 `job_graph`
- 前端 Vite dev server 端口 5173，主后端 8082
- 所有前端 API 调用走 `/api/job-skill-graph/*` 路径（新 proxy 规则转发到 7576）
- 用户必须登录（`ProtectedRoute userType="student"`）
- 简历输入仅支持文本（MVP 不做 PDF/Word）
- 评分权重固定：技能 50%（required 40% + preferred 10%）、经验 25%、学历 25%
- Neo4j 节点标签固定：`Job`、`Skill`；关系类型固定：`REQUIRES`（属性 `importance` ∈ {required, preferred}）
- 学历映射固定：`{高中:1, 大专:2, 本科:3, 硕士:4, 博士:5}`，缺失值视为 1
- 经验匹配公式：`min(resume_exp / required_exp, 1)`，required 缺失视为 1 年
- 图谱页默认 `min_skill_count=5`、`limit=50`，避免大图卡顿
- 不做 TDD（项目无测试基础设施，前端用浏览器手动验证，后端用 curl 冒烟）

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `frontend/package.json` | 修改 | 加 `@antv/g6@^5` 依赖 |
| `frontend/vite.config.ts` | 修改 | 加 `/api/job-skill-graph` proxy |
| `frontend/src/App.tsx` | 修改 | 加 2 个 Route |
| `frontend/src/layouts/MainLayout.tsx` | 修改 | 加 2 个 menuItem，导入 2 个 icon |
| `frontend/src/services/graph_api.ts` | 新建 | 封装 5 个查询接口 + 2 个匹配接口 |
| `frontend/src/pages/student/KnowledgeGraphPage.tsx` | 新建 | G6 全景图 + 节点点击抽屉 |
| `frontend/src/pages/student/JobMatchingPage.tsx` | 新建 | 选岗位 + 粘贴简历 + 结果展示 |
| `backend/job_skill_graph_service.py` | 修改 | 加 `match-resume`、`recommend-jobs` 接口 |

---

## Task 1: 安装 AntV G6 + 配置 Vite Proxy

**Files:**
- Modify: `frontend/package.json` (dependencies 段)
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: 安装 @antv/g6**

```bash
cd "E:\pro\Smart_Employment_Big_Data_Platform\frontend" && npm install @antv/g6@^5.0.0 --save
```

预期：`package.json` 的 dependencies 出现 `"@antv/g6": "^5.x.x"`，`node_modules/@antv/g6` 存在。

- [ ] **Step 2: 修改 vite.config.ts 增加 proxy**

文件 `frontend/vite.config.ts`，完整替换内容为：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // 图谱服务（端口 7576）必须放在 /api 之前��更具体的路径优先匹配
      '/api/job-skill-graph': {
        target: 'http://localhost:7576',
        changeOrigin: true,
      },
      // 主后端（端口 8082）保留为 fallback
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: 验证 vite 配置无语法错误**

```bash
cd "E:\pro\Smart_Employment_Big_Data_Platform\frontend" && npx vite --version
```

预期：打印 vite 版本号（无错误）。

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts
git commit -m "feat(frontend): 安装 @antv/g6 并添加 7576 端口 proxy"
```

---

## Task 2: 后端 recommend-jobs 接口

**Files:**
- Modify: `backend/job_skill_graph_service.py`（在文件末尾追加，不要修改已有代码）

**Interfaces:**
- Consumes: `neo4j` Python driver（已在文件顶部导入）、`NEO4J_URI`、`NEO4J_USER`、`NEO4J_PASSWORD`（已在文件中定义）
- Produces: HTTP `GET /api/job-skill-graph/recommend-jobs?skills=Python,Django&limit=10`

- [ ] **Step 1: 在文件末尾追加新接口**

打开 `backend/job_skill_graph_service.py`，在最后一个 `@app.get(...)` 之后、`if __name__ == "__main__":` 之前，插入以下代码：

```python
# ============================================================================
# 人岗匹配 - 推荐岗位（Jaccard 相似度）
# ============================================================================

@app.get("/api/job-skill-graph/recommend-jobs")
async def recommend_jobs(skills: str, limit: int = 10):
    """
    根据候选技能列表，从 Neo4j 找出最相似的岗位
    算法：Jaccard 相似度 = |A ∩ B| / |A ∪ B|
    """
    try:
        if not skills:
            raise HTTPException(status_code=400, detail="skills 参数不能为空")

        candidate_skills = [s.strip() for s in skills.split(",") if s.strip()]
        if not candidate_skills:
            raise HTTPException(status_code=400, detail="skills 参数解析后为空")

        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            results = session.run("""
                MATCH (j:Job)-[r:REQUIRES]->(s:Skill)
                WHERE s.name IN $candidate_skills
                WITH j, collect(DISTINCT s.name) AS job_skills
                WITH j, job_skills,
                     [x IN job_skills WHERE x IN $candidate_skills] AS overlap_list
                WITH j, job_skills, overlap_list,
                     size(overlap_list) AS overlap,
                     size(job_skills) + size($candidate_skills) - size(overlap_list) AS union_size
                WHERE overlap > 0 AND union_size > 0
                RETURN j.name AS job,
                       toFloat(overlap) / union_size AS jaccard,
                       overlap_list AS shared_skills,
                       size(job_skills) AS total_skills
                ORDER BY jaccard DESC, overlap DESC
                LIMIT $limit
            """, {"candidate_skills": candidate_skills, "limit": limit}).data()
        driver.close()

        return {
            "success": True,
            "data": [
                {
                    "job": r["job"],
                    "match_ratio": round(r["jaccard"], 4),
                    "matched_skill_count": len(r["shared_skills"]),
                    "total_skill_count": r["total_skills"],
                    "shared_skills": r["shared_skills"],
                }
                for r in results
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"推荐岗位失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

- [ ] **Step 2: 启动服务并冒烟测试**

启动服务（新终端）：
```bash
cd "E:\pro\Smart_Employment_Big_Data_Platform\backend" && uvicorn job_skill_graph_service:app --port 7576 --reload
```

另开终端执行：
```bash
curl "http://localhost:7576/api/job-skill-graph/recommend-jobs?skills=Python,Django,MySQL&limit=5"
```

预期：返回 `{"success":true,"data":[...]}`，data 中每项含 `job`、`match_ratio`、`matched_skill_count`、`total_skill_count`、`shared_skills` 字段。若 Neo4j 未启动或图谱为空，返回 `data: []` 也算通过。

- [ ] **Step 3: 边界场景测试**

```bash
# 空 skills
curl "http://localhost:7576/api/job-skill-graph/recommend-jobs?skills="

# 不存在的技能
curl "http://localhost:7576/api/job-skill-graph/recommend-jobs?skills=NonExistentSkill&limit=3"
```

预期：第一个返回 HTTP 400，detail 含 "skills 参数"；第二个返回 `{"success":true,"data":[]}`。

- [ ] **Step 4: Commit**

```bash
git add backend/job_skill_graph_service.py
git commit -m "feat(backend): 新增 recommend-jobs 接口（Jaccard 相似度推荐岗位）"
```

---

## Task 3: 后端 match-resume 接口

**Files:**
- Modify: `backend/job_skill_graph_service.py`（在 Task 2 新增代码之后继续追加）

**Interfaces:**
- Consumes: `LLMClient`（文件内已定义）、`GraphDatabase` driver
- Produces: HTTP `POST /api/job-skill-graph/match-resume`，请求体 `{target_job, resume_text}`，返回匹配分 + 缺口

- [ ] **Step 1: 追加 match-resume 接口和数据模型**

在 Task 2 新增的代码之后插入：

```python
# ============================================================================
# 人岗匹配 - 简历分析
# ============================================================================

class ResumeMatchRequest(BaseModel):
    target_job: str
    resume_text: str


def _calculate_skill_score(
    resume_skills: list[str],
    required_skills: list[str],
    preferred_skills: list[str],
) -> tuple[float, list[dict], list[dict]]:
    """
    计算技能匹配分（required 40% + preferred 10%）
    返回: (技能分, 已匹配技能列表, 缺失技能列表)
    """
    resume_set = set(resume_skills)

    matched_required = [s for s in required_skills if s in resume_set]
    matched_preferred = [s for s in preferred_skills if s in resume_set]
    missing_required = [s for s in required_skills if s not in resume_set]

    req_score = (
        len(matched_required) / len(required_skills) * 0.4
        if required_skills
        else 0.4
    )
    pref_score = (
        len(matched_preferred) / len(preferred_skills) * 0.1
        if preferred_skills
        else 0.1
    )

    matched = (
        [{"name": s, "importance": "required"} for s in matched_required]
        + [{"name": s, "importance": "preferred"} for s in matched_preferred]
    )
    missing = [{"name": s, "importance": "required"} for s in missing_required]

    return round((req_score + pref_score) * 100, 2), matched, missing


EDU_MAP = {"高中": 1, "大专": 2, "本科": 3, "硕士": 4, "博士": 5}


def _calculate_experience_score(
    resume_years: float, required_years: float
) -> float:
    """经验匹配分（25%）"""
    if required_years <= 0:
        return 25.0
    return round(min(resume_years / required_years, 1) * 25, 2)


def _calculate_education_score(
    resume_edu: str, required_edu: str
) -> float:
    """学历匹配分（25%）"""
    r = EDU_MAP.get(resume_edu, 1)
    q = EDU_MAP.get(required_edu, 1)
    return round(min(r / q, 1) * 25, 2)


@app.post("/api/job-skill-graph/match-resume")
async def match_resume(request: ResumeMatchRequest):
    """
    人岗匹配：给定目标岗位 + 简历文本，输出匹配分和缺口
    流程：
      1. LLM 从简历抽技能/经验/学历
      2. Neo4j 查目标岗位的 required/preferred 技能
      3. 计算总分 = 技能 50% + 经验 25% + 学历 25%
    """
    try:
        # 1. LLM 解析简历
        llm_client = LLMClient()
        prompt = f"""你是简历解析专家。请从以下简历中提取结构化信息，严格按 JSON 格式返回，不要任何其他文字：

```json
{{
  "skills": ["技能1", "技能2", ...],
  "experience_years": 3,
  "education_level": "本科"
}}
```

要求：
- skills: 列出简历中提到的所有技术技能（如 Python、Java、Docker、MySQL 等），使用标准名称
- experience_years: 工作年限（数字，实习算 0.5，不足 1 年按 1 算）
- education_level: 最高学历，从 ["高中", "大专", "本科", "硕士", "博士"] 中选一个

简历内容：
{request.resume_text}
"""
        messages = [{"role": "user", "content": prompt}]
        response_text = await llm_client.achat_complete(messages, temperature=0.1)

        import json
        # 兼容 LLM 把 JSON 包在 ```json ... ``` 里的情况
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```", 2)[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip().rstrip("`").strip()

        parsed = json.loads(cleaned)
        resume_skills = parsed.get("skills", [])
        resume_exp = float(parsed.get("experience_years", 1))
        resume_edu = parsed.get("education_level", "本科")

        # 2. Neo4j 查目标岗位
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            # 模糊匹配岗位名，取最像的一个
            job_node = session.run("""
                MATCH (j:Job)
                WHERE j.name CONTAINS $name OR $name CONTAINS j.name
                RETURN j.name AS name
                ORDER BY size(j.name) DESC
                LIMIT 1
            """, {"name": request.target_job}).single()

            if not job_node:
                driver.close()
                return {
                    "success": False,
                    "message": f"图谱中未找到岗位: {request.target_job}",
                }

            matched_job = job_node["name"]

            # 查 required 和 preferred 技能
            skill_rows = session.run("""
                MATCH (j:Job {name: $job_name})-[r:REQUIRES]->(s:Skill)
                RETURN s.name AS name, r.importance AS importance
            """, {"job_name": matched_job}).data()

            required_skills = [r["name"] for r in skill_rows if r["importance"] == "required"]
            preferred_skills = [r["name"] for r in skill_rows if r["importance"] == "preferred"]

        driver.close()

        # 2.5 从 PostgreSQL 聚合该岗位的典型经验/学历要求
        import psycopg2
        import re as _re

        avg_exp = 1.0
        edu_level = "本科"
        try:
            conn = psycopg2.connect(
                host=POSTGRES_HOST, database=POSTGRES_DB,
                user=POSTGRES_USER, password=POSTGRES_PASSWORD
            )
            cur = conn.cursor()
            cur.execute("""
                SELECT experience_required, education_required
                FROM job_postings
                WHERE title LIKE %s OR title LIKE %s
            """, (f"%{matched_job}%", f"%{matched_job[:5]}%"))
            rows = cur.fetchall()
            conn.close()

            if rows:
                # 经验：从字符串中提取数字，例如 "3-5年" → 3
                exp_values = []
                for exp_str, _ in rows:
                    if exp_str:
                        m = _re.search(r"(\d+)", str(exp_str))
                        if m:
                            exp_values.append(float(m.group(1)))
                if exp_values:
                    avg_exp = sum(exp_values) / len(exp_values)

                # 学历：取出现次数最多的非空值
                edu_counter: dict[str, int] = {}
                for _, edu_str in rows:
                    if edu_str and str(edu_str) in EDU_MAP:
                        edu_counter[str(edu_str)] = edu_counter.get(str(edu_str), 0) + 1
                if edu_counter:
                    edu_level = max(edu_counter, key=edu_counter.get)  # type: ignore[arg-type]
        except Exception as e:
            logger.warning(f"读取 job_postings 经验/学历失败，使用默认值: {e}")

        # 3. 算分
        skill_score, matched, missing = _calculate_skill_score(
            resume_skills, required_skills, preferred_skills
        )
        exp_score = _calculate_experience_score(resume_exp, avg_exp)
        edu_score = _calculate_education_score(resume_edu, edu_level)
        )

        total = round(skill_score + exp_score + edu_score, 2)

        return {
            "success": True,
            "data": {
                "matched_job": matched_job,
                "total_score": total,
                "skill_score": skill_score,
                "experience_score": exp_score,
                "education_score": edu_score,
                "resume_skills": resume_skills,
                "matched_skills": matched,
                "missing_skills": missing,
                "required_skill_count": len(required_skills),
                "matched_required_count": len([m for m in matched if m["importance"] == "required"]),
            },
        }
    except Exception as e:
        logger.error(f"简历匹配失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

- [ ] **Step 2: 等待服务 reload 并冒烟测试**

`uvicorn --reload` 应该自动检测到代码变化。等 2-3 秒后执行：

```bash
curl -X POST "http://localhost:7576/api/job-skill-graph/match-resume" \
  -H "Content-Type: application/json" \
  -d "{\"target_job\":\"Python\",\"resume_text\":\"张三，本科，3 年 Python 开发经验，熟练使用 Django、Flask、MySQL、Redis、Docker，有 Kubernetes 经验\"}"
```

预期：返回 `{"success":true,"data":{"matched_job":"...", "total_score": xx.x, ...}}`。若图谱中"Python"岗位不存在，`matched_job` 会是模糊匹配最接近的，返回 success:false 也是合理结果。

- [ ] **Step 3: 错误处理测试**

```bash
# 空简历
curl -X POST "http://localhost:7576/api/job-skill-graph/match-resume" \
  -H "Content-Type: application/json" \
  -d "{\"target_job\":\"Python\",\"resume_text\":\"\"}"
```

预期：HTTP 500，detail 描述 LLM 解析失败原因（LLM 处理空字符串可能返回空 JSON → json.loads 抛错）。

- [ ] **Step 4: Commit**

```bash
git add backend/job_skill_graph_service.py
git commit -m "feat(backend): 新增 match-resume 接口（技能+经验+学历三维度评分）"
```

---

## Task 4: 前端 graph_api.ts 服务封装

**Files:**
- Create: `frontend/src/services/graph_api.ts`

**Interfaces:**
- Consumes: 全局 axios 实例（无显式 import，依赖 `api` 实例从父模块复用——为了一致性，这里新建一个用 `/api/job-skill-graph` 前缀的 axios 实例）
- Produces: 7 个导出函数

- [ ] **Step 1: 创建 graph_api.ts**

文件 `frontend/src/services/graph_api.ts`，完整内容：

```typescript
import axios from 'axios';

// 图谱服务专用 axios 实例，baseURL 走 Vite proxy 转发的路径
const graphApi = axios.create({
  baseURL: '/api/job-skill-graph',
  timeout: 60000, // LLM 简历解析可能需要更长时间
  headers: { 'Content-Type': 'application/json' },
});

// 复用全局 token 拦截器
graphApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== 类型定义 ====================

export interface GraphNode {
  id: string;
  label: string;
  type: 'Job' | 'Skill';
  category?: string | null;
  job_count?: number | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  importance: 'required' | 'preferred';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    job_nodes: number;
    skill_nodes: number;
  };
}

export interface GraphStats {
  nodes: { jobs: number; skills: number };
  relationships: { requires: number };
  popular_skills: Array<{ skill: string; job_count: number }>;
  skill_categories: Array<{ category: string; count: number }>;
}

export interface SearchResult {
  name: string;
  type: 'Job' | 'Skill';
}

export interface SkillAnalysis {
  skill: string;
  job_count: number;
  jobs: string[];
  company_count: number;
  companies: string[];
  related_skills: Array<{ skill: string; co_occurrence: number }>;
}

export interface JobAnalysis {
  job: string;
  skill_count: number;
  skills: Array<{ skill: string; category: string | null; importance: string }>;
  companies: string[];
}

export interface ResumeMatchData {
  matched_job: string;
  total_score: number;
  skill_score: number;
  experience_score: number;
  education_score: number;
  resume_skills: string[];
  matched_skills: Array<{ name: string; importance: string }>;
  missing_skills: Array<{ name: string; importance: string }>;
  required_skill_count: number;
  matched_required_count: number;
}

export interface RecommendJob {
  job: string;
  match_ratio: number;
  matched_skill_count: number;
  total_skill_count: number;
  shared_skills: string[];
}

// ==================== 查询接口（后端已有） ====================

export async function getGraphData(params?: {
  limit?: number;
  min_skill_count?: number;
}): Promise<GraphData> {
  const response = await graphApi.get('/graph-data', { params });
  return response.data.data;
}

export async function getGraphStats(): Promise<GraphStats> {
  const response = await graphApi.get('/stats');
  return response.data.data;
}

export async function searchGraph(query: string): Promise<SearchResult[]> {
  const response = await graphApi.get('/search', { params: { query } });
  return response.data.results || [];
}

export async function getSkillAnalysis(skillName: string): Promise<SkillAnalysis> {
  const response = await graphApi.get(`/skill-analysis/${encodeURIComponent(skillName)}`);
  return response.data.data;
}

export async function getJobAnalysis(jobName: string): Promise<JobAnalysis> {
  const response = await graphApi.get(`/job-analysis/${encodeURIComponent(jobName)}`);
  return response.data.data;
}

// ==================== 匹配接口（本次新增） ====================

export async function matchResume(payload: {
  target_job: string;
  resume_text: string;
}): Promise<ResumeMatchData> {
  const response = await graphApi.post('/match-resume', payload);
  if (!response.data.success) {
    throw new Error(response.data.message || '匹配失败');
  }
  return response.data.data;
}

export async function recommendJobs(
  skills: string[],
  limit = 10
): Promise<RecommendJob[]> {
  const response = await graphApi.get('/recommend-jobs', {
    params: { skills: skills.join(','), limit },
  });
  return response.data.data || [];
}
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
cd "E:\pro\Smart_Employment_Big_Data_Platform\frontend" && npx tsc --noEmit
```

预期：无错误（其它文件若有旧错误可忽略，只看 graph_api.ts 本身）。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/graph_api.ts
git commit -m "feat(frontend): 新增 graph_api.ts 封装图谱和匹配 API"
```

---

## Task 5: KnowledgeGraphPage 全景图页面

**Files:**
- Create: `frontend/src/pages/student/KnowledgeGraphPage.tsx`

**Interfaces:**
- Consumes: `getGraphData`、`getSkillAnalysis`、`getJobAnalysis`、`getGraphStats`（来自 `services/graph_api.ts`）
- Produces: 默认导出 React 组件，无 props

- [ ] **Step 1: 创建 KnowledgeGraphPage.tsx**

文件 `frontend/src/pages/student/KnowledgeGraphPage.tsx`，完整内容：

```tsx
import { useEffect, useRef, useState } from 'react';
import {
  Card,
  Input,
  Slider,
  Button,
  Drawer,
  Descriptions,
  Tag,
  Spin,
  Empty,
  Space,
  Statistic,
  Row,
  Col,
  App as AntdApp,
} from 'antd';
import { SearchOutlined, ReloadOutlined, ApartmentOutlined } from '@ant-design/icons';
import G6 from '@antv/g6';
import {
  getGraphData,
  getSkillAnalysis,
  getJobAnalysis,
  getGraphStats,
  type GraphNode,
  type SkillAnalysis,
  type JobAnalysis,
  type GraphStats,
} from '../../services/graph_api';

const { Search } = Input;

export default function KnowledgeGraphPage() {
  const { message } = AntdApp.useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [minSkillCount, setMinSkillCount] = useState(5);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [skillDetail, setSkillDetail] = useState<SkillAnalysis | null>(null);
  const [jobDetail, setJobDetail] = useState<JobAnalysis | null>(null);

  // 加载图谱数据
  const loadGraph = async () => {
    if (!containerRef.current) return;
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        getGraphData({ limit: 50, min_skill_count: minSkillCount }),
        getGraphStats(),
      ]);
      setStats(statsData);
      renderGraph(data.nodes, data.edges);
    } catch (e: any) {
      message.error('图谱加载失败：' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 渲染 G6 图
  const renderGraph = (nodes: GraphNode[], edges: any[]) => {
    if (graphRef.current) {
      graphRef.current.destroy();
      graphRef.current = null;
    }
    if (!nodes.length) return;

    const g6Nodes = nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type === 'Job' ? 'circle' : 'rect',
      style: {
        fill: n.type === 'Job' ? '#5B8FF9' : '#F6BD16',
        size: n.type === 'Skill' ? Math.min(20 + (n.job_count || 1) * 2, 60) : 40,
        labelText: n.label,
        labelBackground: '#fff',
      },
    }));

    const g6Edges = edges.map((e) => ({
      source: e.source,
      target: e.target,
      style: {
        stroke: e.importance === 'required' ? '#F5222D' : '#FAAD14',
        lineWidth: e.importance === 'required' ? 2 : 1,
        opacity: 0.6,
      },
    }));

    const graph = new G6.Graph({
      container: containerRef.current!,
      width: containerRef.current!.clientWidth,
      height: containerRef.current!.clientHeight || 600,
      fitView: true,
      defaultNode: { type: 'circle', size: 40 },
      modes: { default: ['drag-canvas', 'zoom-canvas', 'drag-node'] },
    });

    graph.data({ nodes: g6Nodes, edges: g6Edges });
    graph.render();

    graph.on('node:click', (evt: any) => {
      const id = evt.target?.id;
      const node = nodes.find((n) => n.id === id);
      if (node) {
        setSelectedNode(node);
        setDrawerOpen(true);
      }
    });

    graphRef.current = graph;
  };

  // 抽屉打开时加载详情
  useEffect(() => {
    if (!drawerOpen || !selectedNode) return;
    setDrawerLoading(true);
    setSkillDetail(null);
    setJobDetail(null);

    const fetcher =
      selectedNode.type === 'Skill'
        ? getSkillAnalysis(selectedNode.label)
        : getJobAnalysis(selectedNode.label);

    fetcher
      .then((data) => {
        if (selectedNode.type === 'Skill') setSkillDetail(data as SkillAnalysis);
        else setJobDetail(data as JobAnalysis);
      })
      .catch((e) => message.error('详情加载失败：' + e.message))
      .finally(() => setDrawerLoading(false));
  }, [drawerOpen, selectedNode]);

  // 组件挂载/参数变化时加载
  useEffect(() => {
    loadGraph();
    return () => {
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minSkillCount]);

  // 搜索高亮（缩放到节点）
  const handleSearch = (keyword: string) => {
    if (!keyword || !graphRef.current) return;
    const node = graphRef.current.getNodes().find((n: any) => n.getID() === keyword);
    if (node) {
      graphRef.current.focusElement(node, true);
      message.success(`已定位到：${keyword}`);
    } else {
      message.warning(`未找到节点：${keyword}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="large">
              <Statistic
                title="岗位节点"
                value={stats?.nodes.jobs ?? '-'}
                prefix={<ApartmentOutlined />}
              />
              <Statistic title="技能节点" value={stats?.nodes.skills ?? '-'} />
              <Statistic title="需求关系" value={stats?.relationships.requires ?? '-'} />
            </Space>
          </Col>
          <Col>
            <Space>
              <span>最低需求度：{minSkillCount}</span>
              <Slider
                min={1}
                max={20}
                value={minSkillCount}
                onChange={setMinSkillCount}
                style={{ width: 160 }}
              />
              <Search
                placeholder="搜索节点"
                allowClear
                enterButton={<SearchOutlined />}
                style={{ width: 220 }}
                onSearch={handleSearch}
              />
              <Button icon={<ReloadOutlined />} onClick={loadGraph} loading={loading}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card className="flex-1" bodyStyle={{ padding: 0, height: 'calc(100vh - 280px)' }}>
        <Spin spinning={loading} wrapperClassName="h-full">
          <div ref={containerRef} className="w-full h-full" />
          {!loading && !stats?.nodes.jobs && (
            <Empty description="图谱为空，请先在后端运行 build-graph" className="mt-20" />
          )}
        </Spin>
      </Card>

      <Drawer
        title={selectedNode?.label}
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        <Spin spinning={drawerLoading}>
          {selectedNode?.type === 'Skill' && skillDetail && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="技能名称">{skillDetail.skill}</Descriptions.Item>
              <Descriptions.Item label="被 {skillDetail.job_count} 个岗位需要">
                <Tag color="blue">{skillDetail.job_count}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="相关公司">
                {skillDetail.companies.slice(0, 10).map((c) => (
                  <Tag key={c}>{c}</Tag>
                ))}
                {skillDetail.companies.length > 10 && (
                  <Tag color="default">+{skillDetail.companies.length - 10}</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="共现技能 Top 10">
                {skillDetail.related_skills.map((r) => (
                  <Tag color="purple" key={r.skill}>
                    {r.skill} ×{r.co_occurrence}
                  </Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
          )}
          {selectedNode?.type === 'Job' && jobDetail && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="岗位名称">{jobDetail.job}</Descriptions.Item>
              <Descriptions.Item label="需要技能数">
                <Tag color="blue">{jobDetail.skill_count}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="核心技能 (required)">
                {jobDetail.skills
                  .filter((s) => s.importance === 'required')
                  .map((s) => (
                    <Tag color="red" key={s.skill}>{s.skill}</Tag>
                  ))}
              </Descriptions.Item>
              <Descriptions.Item label="加分技能 (preferred)">
                {jobDetail.skills
                  .filter((s) => s.importance === 'preferred')
                  .map((s) => (
                    <Tag color="orange" key={s.skill}>{s.skill}</Tag>
                  ))}
              </Descriptions.Item>
              <Descriptions.Item label="招聘公司 Top 20">
                {jobDetail.companies.slice(0, 20).map((c) => (
                  <Tag key={c}>{c}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Spin>
      </Drawer>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 检查**

```bash
cd "E:\pro\Smart_Employment_Big_Data_Platform\frontend" && npx tsc --noEmit
```

预期：无 graph_api.ts / KnowledgeGraphPage.tsx 相关错误。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/student/KnowledgeGraphPage.tsx
git commit -m "feat(frontend): 新增 KnowledgeGraphPage 能力图谱页（G6 全景图 + 节点详情抽屉）"
```

---

## Task 6: JobMatchingPage 人岗匹配页面

**Files:**
- Create: `frontend/src/pages/student/JobMatchingPage.tsx`

**Interfaces:**
- Consumes: `searchGraph`、`matchResume`、`recommendJobs`（来自 `services/graph_api.ts`）
- Produces: 默认导出 React 组件，无 props

- [ ] **Step 1: 创建 JobMatchingPage.tsx**

文件 `frontend/src/pages/student/JobMatchingPage.tsx`，完整内容：

```tsx
import { useEffect, useState } from 'react';
import {
  Card,
  Select,
  Input,
  Button,
  Row,
  Col,
  Progress,
  Tag,
  Table,
  Spin,
  Empty,
  Alert,
  Space,
  Divider,
  App as AntdApp,
} from 'antd';
import { ThunderboltOutlined, AimOutlined } from '@ant-design/icons';
import {
  searchGraph,
  matchResume,
  recommendJobs,
  type ResumeMatchData,
  type RecommendJob,
  type SearchResult,
} from '../../services/graph_api';

const { TextArea } = Input;

const RESUME_PLACEHOLDER = `请粘贴简历内容，例如：
张三，本科，3 年 Python 后端开发经验。
熟悉 Python、Django、Flask、MySQL、Redis、Docker。
了解微服务架构，有高并发项目经验。
有良好的团队协作和沟通能力。`;

export default function JobMatchingPage() {
  const { message } = AntdApp.useApp();

  const [jobOptions, setJobOptions] = useState<{ value: string; label: string }[]>([]);
  const [targetJob, setTargetJob] = useState<string | undefined>();
  const [resumeText, setResumeText] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeMatchData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendJob[]>([]);

  // 加载岗位选项
  useEffect(() => {
    searchGraph('')
      .then((results: SearchResult[]) => {
        const jobs = results.filter((r) => r.type === 'Job');
        setJobOptions(jobs.map((j) => ({ value: j.name, label: j.name })));
      })
      .catch((e) => message.error('岗位列表加载失败：' + e.message));
  }, []);

  const handleAnalyze = async () => {
    if (!targetJob) {
      message.warning('请选择目标岗位');
      return;
    }
    if (!resumeText.trim()) {
      message.warning('请粘贴简历内容');
      return;
    }

    setLoading(true);
    setResult(null);
    setRecommendations([]);
    try {
      const matchData = await matchResume({ target_job: targetJob, resume_text: resumeText });
      setResult(matchData);
      // 并发请求推荐岗位
      if (matchData.resume_skills.length > 0) {
        const recs = await recommendJobs(matchData.resume_skills, 10);
        setRecommendations(recs);
      }
    } catch (e: any) {
      message.error('分析失败：' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card title={<><AimOutlined /> 人岗匹配分析</>}>
        <Row gutter={16}>
          <Col span={8}>
            <div className="mb-2 font-medium">目标岗位</div>
            <Select
              showSearch
              placeholder="选择或搜索目标岗位"
              optionFilterProp="label"
              value={targetJob}
              onChange={setTargetJob}
              options={jobOptions}
              style={{ width: '100%' }}
              size="large"
            />
          </Col>
          <Col span={16}>
            <div className="mb-2 font-medium">简历内容</div>
            <TextArea
              rows={8}
              placeholder={RESUME_PLACEHOLDER}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </Col>
        </Row>
        <Divider />
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          loading={loading}
          onClick={handleAnalyze}
          block
        >
          开始分析
        </Button>
      </Card>

      <Spin spinning={loading}>
        {!result && !loading && (
          <Empty description="请填写岗位和简历后点击分析" className="mt-12" />
        )}

        {result && (
          <>
            <Card title="匹配评分">
              <Row gutter={24} justify="center">
                <Col>
                  <Progress
                    type="dashboard"
                    percent={Math.round(result.total_score)}
                    format={(p) => `${p} 分`}
                    strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                    size={140}
                  />
                  <div className="text-center mt-2 text-gray-500">总分</div>
                </Col>
                <Col>
                  <Progress
                    type="dashboard"
                    percent={Math.round((result.skill_score / 50) * 100)}
                    format={() => `${result.skill_score} / 50`}
                    strokeColor="#5B8FF9"
                    size={120}
                  />
                  <div className="text-center mt-2 text-gray-500">技能</div>
                </Col>
                <Col>
                  <Progress
                    type="dashboard"
                    percent={Math.round((result.experience_score / 25) * 100)}
                    format={() => `${result.experience_score} / 25`}
                    strokeColor="#F6BD16"
                    size={120}
                  />
                  <div className="text-center mt-2 text-gray-500">经验</div>
                </Col>
                <Col>
                  <Progress
                    type="dashboard"
                    percent={Math.round((result.education_score / 25) * 100)}
                    format={() => `${result.education_score} / 25`}
                    strokeColor="#F5222D"
                    size={120}
                  />
                  <div className="text-center mt-2 text-gray-500">学历</div>
                </Col>
              </Row>
            </Card>

            <Row gutter={16} className="mt-4">
              <Col span={12}>
                <Card title={`✅ 已具备技能 (${result.matched_skills.length})`}>
                  {result.matched_skills.length === 0 && (
                    <Alert message="未匹配到任何技能" type="info" showIcon />
                  )}
                  <Space wrap>
                    {result.matched_skills.map((s) => (
                      <Tag
                        color={s.importance === 'required' ? 'green' : 'lime'}
                        key={s.name}
                      >
                        {s.name}
                      </Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title={`❌ 缺失技能 (${result.missing_skills.length})`}>
                  {result.missing_skills.length === 0 ? (
                    <Alert message="已具备所有核心技能！" type="success" showIcon />
                  ) : (
                    <Space wrap>
                      {result.missing_skills.map((s) => (
                        <Tag color="red" key={s.name}>
                          {s.name}
                        </Tag>
                      ))}
                    </Space>
                  )}
                </Card>
              </Col>
            </Row>

            <Card title={`🎯 推荐岗位 (${recommendations.length})`} className="mt-4">
              {recommendations.length === 0 ? (
                <Empty description="暂无相似岗位" />
              ) : (
                <Table
                  rowKey="job"
                  dataSource={recommendations}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '岗位', dataIndex: 'job', key: 'job' },
                    {
                      title: '匹配度',
                      dataIndex: 'match_ratio',
                      key: 'match_ratio',
                      render: (v) => (
                        <Progress
                          percent={Math.round(v * 100)}
                          size="small"
                          status={v >= 0.5 ? 'success' : 'normal'}
                        />
                      ),
                    },
                    {
                      title: '共享技能',
                      dataIndex: 'shared_skills',
                      key: 'shared_skills',
                      render: (skills: string[]) => (
                        <Space wrap>
                          {skills.map((s) => (
                            <Tag key={s}>{s}</Tag>
                          ))}
                        </Space>
                      ),
                    },
                    {
                      title: '覆盖',
                      key: 'coverage',
                      render: (_, r) => `${r.matched_skill_count}/${r.total_skill_count}`,
                    },
                  ]}
                />
              )}
            </Card>
          </>
        )}
      </Spin>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 检查**

```bash
cd "E:\pro\Smart_Employment_Big_Data_Platform\frontend" && npx tsc --noEmit
```

预期：无 graph_api.ts / JobMatchingPage.tsx 相关错误。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/student/JobMatchingPage.tsx
git commit -m "feat(frontend): 新增 JobMatchingPage 人岗匹配页（评分 + 缺口 + 推荐）"
```

---

## Task 7: 注册路由和菜单

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/layouts/MainLayout.tsx`

- [ ] **Step 1: 在 App.tsx 顶部添加 import**

打开 `frontend/src/App.tsx`，在 import 列表（约第 17 行 Jobs import 后）加入：

```tsx
import KnowledgeGraphPage from './pages/student/KnowledgeGraphPage'
import JobMatchingPage from './pages/student/JobMatchingPage'
```

- [ ] **Step 2: 在 App.tsx 添加两条 Route**

在 `<Route path="/history" ...>`（约第 306-316 行）之后、`</Routes>` 之前添加：

```tsx
<Route
  path="/knowledge-graph"
  element={
    <ProtectedRoute userType="student">
      <MainLayout>
        <Content className="p-6">
          <KnowledgeGraphPage />
        </Content>
      </MainLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/job-matching"
  element={
    <ProtectedRoute userType="student">
      <MainLayout>
        <Content className="p-6">
          <JobMatchingPage />
        </Content>
      </MainLayout>
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 3: 在 MainLayout.tsx 顶部添加 icon import**

打开 `frontend/src/layouts/MainLayout.tsx`，修改 import 块（约第 2-12 行）：

原：
```tsx
import {
  HomeOutlined,
  VideoCameraOutlined,
  BarChartOutlined,
  UserOutlined,
  BulbOutlined,
  LogoutOutlined,
  ShopOutlined,
  HistoryOutlined,
  BookOutlined,
} from '@ant-design/icons'
```

改为：
```tsx
import {
  HomeOutlined,
  VideoCameraOutlined,
  BarChartOutlined,
  UserOutlined,
  BulbOutlined,
  LogoutOutlined,
  ShopOutlined,
  HistoryOutlined,
  BookOutlined,
  ApartmentOutlined,
  AimOutlined,
} from '@ant-design/icons'
```

- [ ] **Step 4: 在 MainLayout.tsx menuItems 添加两项**

在 `menuItems` 数组（约第 36-82 行）的 `/jobs` 之后、`/resume-analysis` 之前插入：

```tsx
{
  key: '/knowledge-graph',
  icon: <ApartmentOutlined />,
  label: '能力图谱',
},
{
  key: '/job-matching',
  icon: <AimOutlined />,
  label: '人岗匹配',
},
```

完整插入位置示意（修改 `/jobs` 那块之后紧跟的两行）：

```tsx
{
  key: '/jobs',
  icon: <ShopOutlined />,
  label: '求职市场',
},
{
  key: '/knowledge-graph',
  icon: <ApartmentOutlined />,
  label: '能力图谱',
},
{
  key: '/job-matching',
  icon: <AimOutlined />,
  label: '人岗匹配',
},
{
  key: '/resume-analysis',
  icon: <UserOutlined />,
  label: '智能体简历分析',
},
```

- [ ] **Step 5: TypeScript 检查**

```bash
cd "E:\pro\Smart_Employment_Big_Data_Platform\frontend" && npx tsc --noEmit
```

预期：无错误。

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.tsx frontend/src/layouts/MainLayout.tsx
git commit -m "feat(frontend): 注册知识图谱和人岗匹配路由 + 菜单"
```

---

## Task 8: 端到端联调

**Files:** 无（验证任务）

- [ ] **Step 1: 启动后端图谱服务**

```bash
cd "E:\pro\Smart_Employment_Big_Data_Platform\backend" && uvicorn job_skill_graph_service:app --port 7576 --reload
```

预期：日志显示 `Uvicorn running on http://0.0.0.0:7576`。

> 若 Neo4j 未启动且图谱为空，仍可启动服务，只是接口返回空数据。

- [ ] **Step 2: 启动前端**

另开终端：
```bash
cd "E:\pro\Smart_Employment_Big_Data_Platform\frontend" && npm run dev
```

预期：Vite 启动，浏览器访问 `http://localhost:5173`，自动登录态（需先在 `/login` 登录一个学生账号）。

- [ ] **Step 3: 验证场景 1 - 能力图谱页加载**

1. 左侧菜单点 "能力图谱"
2. 页面顶部应显示 3 个 Statistic（岗位/技能/关系数）
3. 中部应渲染 G6 图，包含 Job（蓝色圆）和 Skill（黄色方）节点
4. 拖动画布、滚轮缩放应正常

预期：图谱正常渲染，无 console error。

- [ ] **Step 4: 验证场景 2 - 节点点击抽屉**

1. 点击任一 Skill 节点
2. 右侧应弹出 Drawer，显示技能名 + 需要的岗位数 + 共现技能
3. 关闭 Drawer，点击任一 Job 节点
4. Drawer 应显示岗位所需技能（required 红色 + preferred 橙色）+ 招聘公司

预期：抽屉内容正确加载。

- [ ] **Step 5: 验证场景 3 - 人岗匹配 - 文本输入**

1. 左侧菜单点 "人岗匹配"
2. 目标岗位 Select 选择 "Python开发"（或其他存在的岗位）
3. TextArea 粘贴简历，例如：
   ```
   张三，本科，3 年 Python 后端开发经验。熟悉 Python、Django、MySQL、Redis、Docker。了解微服务架构。
   ```
4. 点击 "开始分析"
5. 应显示：4 个 Progress 圆环 + 已具备技能 Tag + 缺失技能 Tag + 推荐岗位 Table

预期：所有模块渲染，匹配总分在 0-100 之间。

- [ ] **Step 6: 验证场景 4 - 边界场景**

1. 不选岗位直接点 "开始分析" → 应提示 "请选择目标岗位"
2. 选岗位但 TextArea 为空 → 应提示 "请粘贴简历内容"
3. 选择图谱中不存在的岗位（如果 Select 加载时拿不到该值，可手动调 `matchResume` 验证后端）

预期：前端 Ant Design message.warning 提示。

- [ ] **Step 7: 浏览器 console 检查**

打开 DevTools Console，确认：
- 无红色 error
- 无 404（特别是 /api/job-skill-graph/*）
- 无 antd deprecation warning（除已知历史 warning 外）

- [ ] **Step 8: 最终 commit（如有调试代码遗留）**

若有调试用 console.log 残留：
```bash
git add -A
git commit -m "chore: 清理调试代码（如有）"
```

若无变更，跳过此步。

---

## Done Criteria

- ✅ 后端 7576 服务正常启动，2 个新接口冒烟通过
- ✅ 前端 2 个菜单项可点击进入对应页面
- ✅ G6 全景图渲染、节点点击抽屉可见
- ✅ 匹配页可选岗位 + 粘贴简历 → 看到 4 维分数 + 缺口 + 推荐
- ✅ 浏览器 console 无 error
- ✅ 所有 commit 提交到当前分支 `cz`

## Not Done (Explicitly)

- 单元测试（项目无 vitest/jest 配置，本次不做）
- E2E 测试（无 playwright）
- PDF/Word 简历上传（spec 明确不做）
- 趋势分析页（Day 3 第三页，本次不做）
- Docker 部署（Day 4 任务）
- 幻觉防控 fact_checker（Day 4 任务）
- 缺失技能 → 学习资源跳转（仅占位）
