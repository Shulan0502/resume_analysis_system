# Neo4j 数据导入和使用指南

## 前提条件

- 已安装 Docker 和 Docker Compose
- 已经有 PostgreSQL 数据库（包含 job_postings 表）
- Python 环境已配置好依赖

## 快速启动

### 1. 启动 Neo4j 容器

```bash
# 使用专门的 Neo4j docker-compose 配置
docker-compose -f docker-compose-neo4j-only.yml up -d

# 查看容器状态
docker ps | grep neo4j

# 查看 Neo4j 日志
docker logs resume_analysis_neo4j
```

### 2. 等待 Neo4j 启动完成

Neo4j 首次启动需要 10-30 秒，可以通过以下方式检查是否就绪：

```bash
# 方法1：检查容器健康状态
docker inspect resume_analysis_neo4j | grep -A 5 Health

# 方法2：测试 HTTP 连接
curl http://localhost:7474

# 方法3：查看日志，看到 "Started" 表示启动完成
docker logs resume_analysis_neo4j | grep "Started"
```

### 3. 访问 Neo4j 浏览器

打开浏览器访问：http://localhost:7474

- 用户名：`neo4j`
- 密码：`password123`

## 数据导入

### 方法1：使用 Python 脚本导入（推荐）

项目提供了自动化脚本来构建知识图谱：

```bash
# 1. 确保后端依赖已安装
cd backend
pip install -r requirements.txt


# 2. 启动后端服务（需要先启动）
python job_skill_graph_service.py &

# 3. 运行数据导入脚本
cd ..
python scripts/data_import/build_job_skill_graph.py
```

**脚本功能说明：**

该脚本 (`scripts/data_import/build_job_skill_graph.py`) 会自动：
1. 从 PostgreSQL 读取 `job_postings` 表的数据
2. 调用后端服务的 LLM 接口规范化岗位名称和技能要求
3. 通过后端服务 API 在 Neo4j 中构建岗位-技能知识图谱
4. 创建 Job 和 Skill 节点，以及 REQUIRES 关系

**工作流程：**
- 脚本 → PostgreSQL（读取数据）→ 后端服务（LLM处理）→ Neo4j（存储图谱）

**预计耗时：**
- 小数据集（几百条岗位）：10-20 分钟
- 中等数据集（几千条岗位）：1-2 小时
- 大数据集（万条以上岗位）：2-4 小时

**注意：**
- 需要先启动后端服务 (`job_skill_graph_service.py`)
- 需要配置 LLM API 密钥（用于技能规范化）
- 脚本会显示处理进度和成功率

### 方法2：通过 API 构建（备选）

如果后端服务已经在运行，也可以通过 API 触发图谱构建：

```bash
# 启动后端服务
cd backend
python job_skill_graph_service.py

# 调用构建 API
curl -X POST http://localhost:7576/api/job-skill-graph/build-graph
```

## 验证数据导入

### 在 Neo4j 浏览器中验证

访问 http://localhost:7474，执行以下 Cypher 查询：

```cypher
// 查看节点总数
MATCH (n) RETURN count(n) as total_nodes

// 查看关系总数
MATCH ()-[r]->() RETURN count(r) as total_relationships

// 查看岗位节点数量
MATCH (j:Job) RETURN count(j) as job_count

// 查看技能节点数量
MATCH (s:Skill) RETURN count(s) as skill_count

// 查看热门技能（前10个）
MATCH (j:Job)-[:REQUIRES]->(s:Skill)
RETURN s.name as skill, count(j) as job_count
ORDER BY job_count DESC
LIMIT 10

// 查看图谱样本（任意20个节点和关系）
MATCH (n)-[r]->(m)
RETURN n, r, m
LIMIT 20
```

### 通过 API 验证

```bash
# 获取图谱统计信息
curl http://localhost:7576/api/job-skill-graph/stats

# 搜索特定节点
curl "http://localhost:7576/api/job-skill-graph/search?query=Python"
```

## 常见问题

### 1. Neo4j 启动失败

**问题：** 容器启动后立即退出

**解决方案：**
```bash
# 查看详细日志
docker logs resume_analysis_neo4j

# 如果看到 "Neo4j is already running" 错误，删除旧容器
docker rm -f resume_analysis_neo4j

# 重新启动
docker-compose -f docker-compose-neo4j-only.yml up -d
```

### 2. 内存不足

**问题：** Neo4j 启动后频繁崩溃

**解决方案：**
修改 `docker-compose-neo4j-only.yml` 中的内存设置：
```yaml
environment:
  NEO4J_dbms_memory_heap_initial__size: 256m  # 减小初始内存
  NEO4J_dbms_memory_heap_max__size: 256m     # 减小最大内存
```

### 3. 数据导入脚本失败

**问题：** 脚本报错 "连接 Neo4j 失败"

**解决方案：**
```bash
# 1. 确认 Neo4j 已启动
docker ps | grep neo4j

# 2. 测试 Bolt 连接
curl http://localhost:7474

# 3. 检查环境变量配置
cat backend/.env | grep NEO4J

# 4. 如果使用不同的密码，更新 .env 文件
```

### 4. PostgreSQL 连接问题

**问题：** 脚本报错 "连接 PostgreSQL 失败"

**解决方案：**
```bash
# 1. 确认 PostgreSQL 正在运行
docker ps | grep postgres

# 2. 测试数据库连接
psql -h localhost -U postgres -d job_graph

# 3. 检查 job_postings 表是否存在
psql -h localhost -U postgres -d job_graph -c "\dt job_postings"
```

## 停止和清理

### 停止 Neo4j

```bash
# 停止容器（保留数据）
docker-compose -f docker-compose-neo4j-only.yml stop

# 或者使用 docker 命令
docker stop resume_analysis_neo4j
```

### 完全删除（包括数据）

```bash
# 停止并删除容器
docker-compose -f docker-compose-neo4j-only.yml down

# 删除数据卷（会清空所有图谱数据）
docker volume rm resume_analysis_neo4j_data
```

## 备份和恢复

### 备份 Neo4j 数据

```bash
# 方法1：使用 neo4j-admin 备份（需要进入容器）
docker exec -it resume_analysis_neo4j neo4j-admin database dump neo4j --to-path /var/lib/neo4j/

# 方法2：导出为 Cypher 脚本
docker exec -it resume_analysis_neo4j cypher-shell -u neo4j -p password123 "CALL apoc.export.cypher.all('backup.cypher', {})"
```

### 恢复数据

```bash
# 从备份恢复
docker exec -it resume_analysis_neo4j neo4j-admin database load neo4j --from-path /var/lib/neo4j/
```

## 性能优化建议

1. **内存设置**：根据服务器内存调整堆内存大小
2. **数据导入**：大批量导入时考虑临时调大内存
3. **查询优化**：为常用查询字段创建索引
4. **并发控制**：数据导入时控制并发连接数

## 技术支持

如有问题，请查看：
- Neo4j 官方文档：https://neo4j.com/docs/
- 项目 GitHub Issues
- 团队技术支持联系人
