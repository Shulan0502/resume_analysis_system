# 脚本文件整理说明

本目录包含各种数据库和系统维护脚本，按功能分类组织。

## 目录结构

### 📁 data_import/ - 数据导入脚本（Neo4j 知识图谱）
- `build_job_skill_graph.py` - ⭐ **主要脚本**：构建岗位-技能知识图谱到Neo4j
- `import_job_data_fixed.sql` - 修复后的岗位数据批量导入（推荐使用）
- `insert_jobs.sql` - 智能插入基础岗位数据（含用户创建）
- `add_columns.sql` - 添加数据表字段
- `import_data.py` - 数据导入主程序

### 📁 db_check/ - 数据库检查验证脚本
- `check_db.py` - 检查用户和角色表结构与数据
- `check_job_postings.py` - 检查岗位数据表状态
- `check_routes.py` - 检查API路由配置
- `verify_db.py` - 验证数据库完整性和用户数据
- `check_data.py` - 检查数据质量
- `debug_db.py` - 数据库调试工具

### 📁 db_fix/ - 数据库修复脚本
- `fix_db.py` - 修复数据库结构和用户角色关系
- `fix_sequence.py` - 修复数据库序列问题
- `fix_status.py` - 修复数据状态字段

### 📁 db_test/ - 数据库测试脚本
- `test_job_postings.py` - 测试岗位数据查询功能

## 使用说明

### 🚀 Neo4j 知识图谱构建（推荐）

**前置条件：**
- Neo4j 容器正在运行
- PostgreSQL 数据库有 `job_postings` 表
- 后端服务已启动

**快速开始：**
```bash
# 1. 启动 Neo4j
docker-compose -f docker-compose-neo4j-only.yml up -d

# 2. 启动后端服务
cd backend
python job_skill_graph_service.py &

# 3. 运行知识图谱构建脚本
cd ..
python scripts/data_import/build_job_skill_graph.py
```

**脚本功能：**
- 从 PostgreSQL 读取岗位数据
- 通过 LLM 规范化岗位名称和技能
- 在 Neo4j 中构建 Job-Skill 知识图谱
- 支持大规模数据处理（几千到上万条岗位）

详细文档：[docs/NEO4J_SETUP.md](../docs/NEO4J_SETUP.md)

### 📊 PostgreSQL 数据导入

```bash
# 方法1：执行智能插入脚本（推荐）
psql -U postgres -d job_graph -f scripts/data_import/insert_jobs.sql

# 方法2：执行批量数据导入
psql -U postgres -d job_graph -f scripts/data_import/import_job_data_fixed.sql
```

### 🔍 数据库检查

```bash
# 检查数据库状态
python scripts/db_check/check_db.py

# 验证数据库完整性
python scripts/db_check/verify_db.py

# 检查岗位数据
python scripts/db_check/check_job_postings.py
```

### 🔧 数据库修复

```bash
# 修复数据库结构
python scripts/db_fix/fix_db.py

# 修复序列问题
python scripts/db_fix/fix_sequence.py
```

### 🧪 数据库测试

```bash
# 测试岗位查询功能
python scripts/db_test/test_job_postings.py
```

## 核心文件说明

### 🌟 build_job_skill_graph.py
**最重要的脚本** - 构建 Neo4j 知识图谱的核心工具

**工作流程：**
1. 从 PostgreSQL 读取原始岗位数据
2. 调用后端 LLM 服务规范化岗位和技能
3. 通过 API 将数据写入 Neo4j
4. 生成 Job-Skill 关系图谱

**使用场景：**
- 初始化知识图谱
- 更新图谱数据
- 批量处理新岗位数据

### 📋 import_job_data_fixed.sql
**修复版本的数据导入脚本**

**特点：**
- 使用正确的字段名（`welfare_list`）
- 包含 UTF-8 编码设置
- 完整的字段结构（status, view_count, application_count）
- 180行高质量数据

### 🔧 insert_jobs.sql
**智能岗位插入脚本**

**特点：**
- 使用 PostgreSQL DO 块
- 自动创建 company1 用户和角色
- 动态获取用户ID，更安全
- 包含错误处理和提示信息

## 数据库配置

所有脚本默认使用以下数据库配置：
- 数据库名: `job_graph`
- 用户: `postgres`
- 密码: `123456@`
- 主机: `localhost`
- Neo4j URI: `bolt://localhost:7687`
- Neo4j 用户: `neo4j`
- Neo4j 密码: `password123`

## 注意事项

1. **环境配置**
   - 运行前确保 `.env` 文件配置正确
   - 检查数据库连接是否正常
   - Neo4j 容器必须处于运行状态

2. **数据安全**
   - 运行修复脚本前请先备份数据库
   - 大批量导入建议在测试环境先验证
   - 注意监控 Neo4j 内存使用情况

3. **脚本执行顺序**
   - 修复脚本应该在检查脚本之后运行
   - 数据导入前确保表结构正确
   - 知识图谱构建需要后端服务支持

4. **性能考虑**
   - 大数据集导入可能需要1-3小时
   - LLM 调用有速率限制，脚本内置了延迟
   - 可以根据服务器资源调整并发参数

## 文件清理记录

**最近清理（2025-06-19）：**
- ❌ 删除 `import_job_data.sql`（过时版本，字段名错误）
- ❌ 删除 `import_data.sql`（低质量重复文件）
- ❌ 删除 `insert_job_postings.sql`（简单版本，无错误处理）
- ❌ 删除 `test_connection.py`（功能重复）
- ❌ 删除 `test_db.py`（功能重复）

**清理效果：**
- 文件数量：21个 → 16个（减少24%）
- 目录大小：289KB → 133KB（减少54%）
- 保留高质量文件，提升可维护性

## 故障排查

### Neo4j 连接失败
```bash
# 检查 Neo4j 状态
docker ps | grep neo4j
docker logs resume_analysis_neo4j

# 重启 Neo4j
docker restart resume_analysis_neo4j
```

### PostgreSQL 连接失败
```bash
# 测试数据库连接
psql -h localhost -U postgres -d job_graph

# 检查数据库状态
docker ps | grep postgres
```

### LLM 服务超时
- 检查 `DASHSCOPE_API_KEY` 配置
- 确认网络连接正常
- 考虑调整请求延迟时间

## 技术支持

- 📖 详细文档：[docs/NEO4J_SETUP.md](../docs/NEO4J_SETUP.md)
- 📱 快速指南：[README_NEO4J.md](../README_NEO4J.md)
- 🐛 问题反馈：GitHub Issues
