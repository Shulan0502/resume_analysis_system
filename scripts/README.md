# 脚本文件整理说明

本目录包含各种数据库和系统维护脚本，按功能分类组织。

## 目录结构

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
- `test_db.py` - 数据库连接和基本操作测试
- `test_connection.py` - 测试数据库连接

### 📁 data_import/ - 数据导入脚本
- `import_data.py` - 数据导入主程序
- `insert_jobs.sql` - 插入基础岗位数据
- `insert_job_postings.sql` - 插入岗位详细信息
- `import_data.sql` - 批量数据导入SQL脚本
- `import_job_data.sql` - 导入岗位数据SQL
- `add_columns.sql` - 添加数据表字段

## 使用说明

### 运行检查脚本
```bash
# 检查数据库状态
python scripts/db_check/check_db.py

# 验证数据库
python scripts/db_check/verify_db.py

# 检查岗位数据
python scripts/db_check/check_job_postings.py
```

### 运行修复脚本
```bash
# 修复数据库结构
python scripts/db_fix/fix_db.py

# 修复序列
python scripts/db_fix/fix_sequence.py
```

### 运行测试脚本
```bash
# 测试岗位查询
python scripts/db_test/test_job_postings.py
```

### 数据导入
```bash
# 运行数据导入脚本
python scripts/data_import/import_data.py

# 或直接执行SQL文件
psql -U postgres -d job_graph -f scripts/data_import/insert_jobs.sql
```

## 注意事项

1. 所有脚本默认使用数据库配置：
   - 数据库名: `job_graph`
   - 用户: `postgres`
   - 密码: `123456@`
   - 主机: `localhost`

2. 运行修复脚本前请先备份数据库

3. 测试脚本应该在测试环境中运行

4. 数据导入脚本按顺序执行以确保数据完整性
