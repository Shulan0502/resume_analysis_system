---
title: 岗位能力图谱页 + 人岗匹配页 设计
date: 2026-06-19
status: 待审阅
---

# 岗位能力图谱页 + 人岗匹配页 设计

## 一、目标与背景

实现 `岗位能力图谱4天实现方案.md` 中 Day 3 的两个核心前端页面，并把 Day 2 缺失的"人岗匹配 / 差距分析"后端接口补齐。

### 1.1 现状

| 模块 | 现状 |
|------|------|
| 后端图谱构建（Job-Skill REQUIRES） | ✅ 已实现 `job_skill_graph_service.py` |
| 后端图谱查询 API | ✅ 已有 stats / search / skill-analysis / job-analysis / graph-data |
| 后端人岗匹配 / 差距分析 API | ❌ **完全缺失**（本次新增 match-resume + recommend-jobs） |
| 前端图谱可视化库 | ❌ 项目未安装 G6 / D3 / cytoscape |
| 前端能力图谱页面 | ❌ 不存在 |
| 前端人岗匹配页面 | ❌ 不存在 |
| Vite proxy 对 7576 端口 | ❌ 只代理了 8082 |

### 1.2 交付物

1. 前端 `KnowledgeGraphPage.tsx`（路由 `/knowledge-graph`）
2. 前端 `JobMatchingPage.tsx`（路由 `/job-matching`，仅文本简历输入）
3. 前端 `services/graph_api.ts`（图谱与匹配 API 封装）
4. 后端 `job_skill_graph_service.py` 新增 2 个接口（`match-resume` + `recommend-jobs`）
5. 菜单 + 路由注册
6. Vite proxy 增加 7576 端口代理
7. 安装 `@antv/g6` 依赖

---

## 二、架构

```
┌────────────── 学生端浏览器 ──────────────┐
│  KnowledgeGraphPage.tsx                  │
│   ├─ 顶部控制条 (limit / min_count)       │
│   ├─ 中部 G6 全景图 (force layout)       │
│   └─ 右侧抽屉 (节点点击 → 技能分析详情)  │
│                                          │
│  JobMatchingPage.tsx                     │
│   ├─ 上半: 输入区                          │
│   │   ├─ 目标岗位 Select (from /search)   │
│   │   ├─ 简历输入 (Tabs: 粘贴 / 上传)      │
│   │   └─ "开始分析" 按钮                   │
│   └─ 下半: 结果区                          │
│       ├─ 匹配分 (Progress / Ring)         │
│       ├─ 已具备技能 Tag (绿色)             │
│       ├─ 缺失技能 Tag (红色 + 推荐课程)    │
│       └─ 推荐岗位列表 (Table, 按分数排序)  │
└──────────────────────────────────────────┘
                  │ axios
                  ▼
   Vite proxy  /api/job-skill-graph/*  →  localhost:7576
                  │
                  ▼
   ┌────── FastAPI: job_skill_graph_service.py ──────┐
   │ 已有:                                             │
   │   GET  /api/job-skill-graph/graph-data            │
   │   GET  /api/job-skill-graph/stats                 │
   │   GET  /api/job-skill-graph/search                │
   │   GET  /api/job-skill-graph/skill-analysis/{name} │
   │   GET  /api/job-skill-graph/job-analysis/{name}   │
   │                                                  │
   │ 新增 (本次):                                       │
   │   POST /api/job-skill-graph/match-resume          │
   │     输入: target_job, resume_text | resume_file   │
   │     流程: LLM 抽技能 → 模糊匹配图谱 → 评分 + 缺口 │
   │                                                  │
   │   GET  /api/job-skill-graph/recommend-jobs        │
   │     输入: skills[], experience, education         │
   │     输出: 相似岗位 Top 10 (按 Jaccard 相似度排序) │
   │                                                  │
   │   POST /api/job-skill-graph/parse-resume-file     │
   │     输入: PDF/Word 文件                            │
   │     输出: 纯文本 (前端先调此接口拿文本,再调上面)   │
   └──────────────────────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
   Neo4j (Job-Skill      PostgreSQL
   REQUIRES 图谱)         job_postings
```

### 2.1 关键技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 图谱可视化 | `@antv/g6@^5` | 后端已按 G6 nodes/edges 格式返回；交互最专业 |
| 简历解析 | LLM (dashscope，复用现有 LLMClient) | 项目已有，无需新依赖 |
| 文件解析 | ~~（取消）~~ | MVP 不做文件上传，简化范围 |
| 评分算法 | 技能 50% + 经验 25% + 学历 25% | 方案文档 3.4 节定稿 |
| 推荐岗位算法 | Jaccard 相似度 (Cypher 实现) | 在 Neo4j 一句 Cypher 算完 |
| Vite proxy | 新增 `/api/job-skill-graph` 路径代理到 7576 | 避免改 baseURL，零侵入 |
| 路由保护 | 复用现有 `ProtectedRoute userType="student"` | 模式一致 |
| 状态管理 | 局部 `useState` + `useEffect` | 与现有页面一致，不引入新 store |

---

## 三、后端新增接口

### 3.1 `POST /api/job-skill-graph/match-resume`

> **MVP 范围**：只接受纯文本简历输入，不做 PDF/Word 文件解析。

**请求体**：
```json
{
  "target_job": "Python开发",
  "resume_text": "用户的简历文本内容"
}
```

**处理流程**：
1. 调 LLM，prompt 返回 JSON：
   ```json
   {
     "skills": ["Python", "Django", "MySQL", "Docker"],
     "experience_years": 3,
     "education_level": "本科"
   }
   ```
2. 在 Neo4j 模糊查找 `target_job`（`MATCH (j:Job) WHERE j.name CONTAINS $name`）拿到标准岗位名
3. 查该岗位的 REQUIRES 技能，分 `required` 和 `preferred`
4. 算分：
   - 技能匹配分：`len(matched_required) / len(required) * 0.4 + len(matched_preferred) / len(preferred) * 0.1`
   - 经验匹配分：`min(resume_exp / required_exp, 1) * 0.25`
   - 学历匹配分：按 `{高中:1, 大专:2, 本科:3, 硕士:4, 博士:5}` 映射 `min(a/b, 1) * 0.25`
5. 列出缺失技能（required 中未匹配的）

**返回**：
```json
{
  "success": true,
  "data": {
    "matched_job": "Python开发",
    "total_score": 78.5,
    "skill_score": 35.0,
    "experience_score": 25.0,
    "education_score": 18.5,
    "resume_skills": ["Python", "Django", "MySQL", "Docker"],
    "matched_skills": [{"name": "Python", "importance": "required"}],
    "missing_skills": [
      {"name": "Redis", "importance": "required"},
      {"name": "Kubernetes", "importance": "required"}
    ],
    "required_skill_count": 5,
    "matched_required_count": 3
  }
}
```

### 3.2 `GET /api/job-skill-graph/recommend-jobs`

**查询参数**：`skills=Python,Django,MySQL&limit=10`

**Cypher**：
```cypher
MATCH (j:Job)-[r:REQUIRES]->(s:Skill)
WHERE s.name IN $candidate_skills
WITH j, collect(DISTINCT s.name) AS job_skills
WITH j, job_skills,
     size([x IN job_skills WHERE x IN $candidate_skills]) AS overlap,
     size(job_skills) + size($candidate_skills) - size([x IN job_skills WHERE x IN $candidate_skills]) AS union_size
WITH j, job_skills, overlap, union_size,
     toFloat(overlap) / union_size AS jaccard
RETURN j.name AS job,
       jaccard,
       job_skills,
       size(job_skills) AS total_skills,
       overlap
ORDER BY jaccard DESC
LIMIT $limit
```

**返回**：
```json
{
  "success": true,
  "data": [
    {
      "job": "Python后端",
      "match_ratio": 0.67,
      "matched_skill_count": 2,
      "total_skill_count": 3,
      "shared_skills": ["Python", "Django"]
    }
  ]
}
```

### 3.3 ~~`POST /api/job-skill-graph/parse-resume-file`~~

> **已取消**：MVP 阶段不做文件上传，此接口不需要。

### 3.4 后端依赖新增

无需新增依赖（pdfplumber / python-docx 不再需要）。

---

## 四、前端

### 4.1 文件清单

| 路径 | 操作 | 用途 |
|------|------|------|
| `frontend/package.json` | 修改 | 加 `@antv/g6@^5` |
| `frontend/vite.config.ts` | 修改 | 加 `/api/job-skill-graph` proxy 转发到 7576 |
| `frontend/src/App.tsx` | 修改 | 加 2 个路由（`/knowledge-graph`, `/job-matching`） |
| `frontend/src/layouts/MainLayout.tsx` | 修改 | 加 2 个菜单项 |
| `frontend/src/services/graph_api.ts` | 新增 | 封装图谱 + 匹配 API |
| `frontend/src/pages/student/KnowledgeGraphPage.tsx` | 新增 | 能力图谱页 |
| `frontend/src/pages/student/JobMatchingPage.tsx` | 新增 | 人岗匹配页 |

### 4.2 `services/graph_api.ts` 接口清单

```typescript
// 已有 (后端已实现)
getGraphData(params: { limit?: number; min_skill_count?: number }): Promise<...>
getGraphStats(): Promise<...>
searchGraph(query: string): Promise<...>
getSkillAnalysis(skillName: string): Promise<...>
getJobAnalysis(jobName: string): Promise<...>

// 新增 (本次后端补)
matchResume(payload: {
  target_job: string;
  resume_text: string;        // 仅文本，不支持文件
}): Promise<MatchResult>
recommendJobs(skills: string[], limit?: number): Promise<RecommendJob[]>
// parseResumeFile 已取消
```

> 注意：所有请求路径用 `/job-skill-graph/*` 前缀（Vite proxy 会把 `/api` → 后端对应服务）。由于图谱服务跑在 7576 端口，与主 8082 不同，proxy 需新增一条 `/api/job-skill-graph` 路径前缀的转发规则。

### 4.3 `KnowledgeGraphPage.tsx` UI

- 顶部 Card：标题 + Slider（`min_skill_count` 1-20，默认 5）+ Input（节点搜索）+ Button（刷新）
- 中部 Card：G6 Graph 容器，高度 `calc(100vh - 240px)`
- 右侧 Drawer（width=480px）：节点点击时打开
  - 顶部：节点名（大字号）
  - 若是 Skill：显示 "被 N 个岗位需要" + 岗位列表 + 共现技能 Top 10（调 `getSkillAnalysis`）
  - 若是 Job：显示 "需要 N 个技能" + 技能列表（required 红色、preferred 黄色） + 招聘公司 Top 20（调 `getJobAnalysis`）

### 4.4 `JobMatchingPage.tsx` UI

**上半 输入区 Card**：
- Row:
  - 左：`<Select>` 目标岗位（`showSearch`，从 `searchGraph('')` 加载所有 Job 类型节点）
  - 右：`<Input.TextArea rows={8} placeholder="请粘贴简历内容（技能、经验、学历等）">`（不再做文件上传）
- Button `开始分析` (loading 状态)

**下半 结果区**（分析后渲染）：
- 顶部 Row：3 个 `<Progress type="dashboard">` 圆环
  - 总分 (大, 主色)
  - 技能匹配 (蓝)
  - 经验匹配 (绿)
  - 学历匹配 (橙)
- 中部 Card "✅ 已具备技能"：Tag 列表（绿色）
- 中部 Card "❌ 缺失技能"：Tag 列表（红色）+ 每行右侧 "去学习" 链接（暂用 `#`，留 TODO 给学习资源模块联调）
- 底部 Card "🎯 推荐岗位"：Table，列：岗位名 / 匹配度 / 共享技能 / 总技能数

### 4.5 菜单项配置

`MainLayout.tsx` 在 `/jobs` 之后插入：
```typescript
{ key: '/knowledge-graph', icon: <ApartmentOutlined />, label: '能力图谱' },
{ key: '/job-matching', icon: <AimOutlined />, label: '人岗匹配' },
```

需要在 `import { ... } from '@ant-design/icons'` 加 `ApartmentOutlined, AimOutlined`。

### 4.6 路由配置

`App.tsx` 加 2 条 `<Route>`，结构与 `/analysis` 完全一致：
```tsx
<Route path="/knowledge-graph" element={
  <ProtectedRoute userType="student">
    <MainLayout><Content className="p-6"><KnowledgeGraphPage /></Content></MainLayout>
  </ProtectedRoute>
} />
<Route path="/job-matching" element={...} />
```

### 4.7 Vite proxy 改动

`vite.config.ts` 加：
```typescript
proxy: {
  '/api': { target: 'http://localhost:8082', changeOrigin: true },
  '/api/job-skill-graph': {
    target: 'http://localhost:7576',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/job-skill-graph/, '/api/job-skill-graph'),
  },
},
```
> 注意：Vite proxy 的两条 `/api` 规则需要按"更具体的优先"放上面，这里 `/api/job-skill-graph` 比 `/api` 更具体，写在上面。

---

## 五、数据流（典型场景）

### 场景 1：用户在能力图谱页点击 "Python" 节点

1. G6 `node:click` 事件 → `setSelectedNode({name: "Python", type: "Skill"})`
2. 打开 Drawer → `useEffect` 触发 → `getSkillAnalysis("Python")`
3. 后端 Cypher：`MATCH (j)-[:REQUIRES]->(s:Skill {name: "Python"}) RETURN j.name`
4. 渲染岗位列表 + 共现技能

### 场景 2：用户粘贴简历文本分析 "Python开发" 岗位

1. 用户在 TextArea 输入简历 → 点 "开始分析"
2. 前端 → `matchResume({target_job, resume_text})`
3. 后端：LLM 抽技能 → Cypher 查岗位技能 → 算分
4. 返回结构化结果 → 前端渲染 4 个 Progress 圆环 + Tag 列表
5. 拿到 `resume_skills` 后并发请求 `recommendJobs(skills, 10)`
6. 渲染推荐岗位 Table

---

## 六、错误处理

| 场景 | 处理 |
|------|------|
| 图谱未构建（Neo4j 空） | 后端返回空数据，前端 Show Empty 状态 + "请联系管理员运行 build-graph" 提示 |
| 后端 7576 服务不可达 | axios 拦截 → `message.error('图谱服务连接失败，请确认 7576 端口已启动')` |
| LLM 解析简历失败 | 前端捕获 → 提示 "简历解析失败，请手动粘贴文本" + 自动切到粘贴 Tab |
| 目标岗位在图谱中找不到 | 后端 `matched_job` 为空 → 前端提示 "该岗位暂无数据，请选择其他岗位" |
| 文件超过 10MB | 前端 Upload `beforeUpload` 校验 size |
| 文件类型不支持 | 前端 Upload `accept=".pdf,.doc,.docx"` + 后端再校验 |

---

## 七、测试策略

### 7.1 后端冒烟测试

`backend/tests/test_matching.py`：
- 准备 3 条 mock 简历文本（涵盖高/中/低匹配场景）
- 准备 5 个已知岗位（如 "Python开发"、"Java后端"）
- 断言 `match-resume` 返回分数在合理区间、缺失技能正确

### 7.2 前端联调

- `npm run dev` 启动前端 + `uvicorn job_skill_graph_service:app --port 7576` 启动后端
- 浏览器实测 4 个场景：
  1. 图谱页加载、拖拽缩放、节点搜索、点击 Skill 节点查看详情
  2. 图谱页点击 Job 节点查看所需技能
  3. 匹配页粘贴简历 + 选 "Python开发" → 看到分数和缺口
  4. 匹配页上传 PDF → 同样的结果

### 7.3 准确率验证（方案硬指标 ≥90%）

准备 5 份真实简历 + 5 个目标岗位，对比人工判断的"是否匹配"与系统输出，准确率应 ≥ 90%（匹配/不匹配二分类）。

---

## 八、范围控制（YAGNI）

明确**不做**：
- ❌ 趋势分析页（Day 3 第三页，本次跳过）
- ❌ 公司详情页内嵌图谱
- ❌ G6 节点自定义图标 / 复杂布局
- ❌ 简历历史记录持久化（每次分析独立）
- ❌ 缺失技能的"去学习"实际跳转（留 TODO）
- ❌ 后端单元测试覆盖率（Day 4 任务）
- ❌ Docker 部署（Day 4 任务）
- ❌ 幻觉防控 fact_checker（Day 4 任务）

---

## 九、变更清单

| 文件 | 变更 |
|------|------|
| `backend/job_skill_graph_service.py` | +2 接口（match-resume + recommend-jobs）, +~150 行 |
| `backend/requirements.txt` | 无变化（不做文件解析） |
| `frontend/package.json` | +@antv/g6 |
| `frontend/vite.config.ts` | +proxy 规则 |
| `frontend/src/App.tsx` | +2 路由 |
| `frontend/src/layouts/MainLayout.tsx` | +2 菜单项, +2 icon import |
| `frontend/src/services/graph_api.ts` | 新文件 |
| `frontend/src/pages/student/KnowledgeGraphPage.tsx` | 新文件 |
| `frontend/src/pages/student/JobMatchingPage.tsx` | 新文件 |

---

## 十、风险

| 风险 | 应对 |
|------|------|
| G6 v5 API 与 v4 差异大 | 文档锁版本到 `^5.0.0`，按 v5 写法 |
| 简历文本超长 (LLM token 限制) | LLM prompt 加 "请精简输出 JSON"；超 6000 字截断 |
| Neo4j 未启动 → 图谱空 | 启动文档加 `docker-compose up neo4j` 步骤 |
| 后端 7576 端口冲突 | `.env` 用 `JOB_GRAPH_PORT` 环境变量 |
| 大量节点 G6 卡顿 | 默认 `min_skill_count=5`，超 200 节点自动隐藏次要 |

---

## 十一、后续可扩展（本次不做）

下列能力 MVP 不做，等后续迭代：

- PDF / Word 简历文件上传与解析（需 `pdfplumber` + `python-docx`）
- 简历历史记录持久化（每次分析独立）
- 缺失技能"去学习"实际跳转学习资源模块
- 简历 OCR 支持扫描版 PDF
