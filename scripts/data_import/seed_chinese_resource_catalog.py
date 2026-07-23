"""Replace legacy scraped rows with a balanced Chinese resource catalogue."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

import psycopg2


ROOT = Path(__file__).parents[2]
SCHEMA_PATH = ROOT / "backend" / "src" / "main" / "resources" / "learning-resources-schema.sql"


@dataclass(frozen=True)
class Resource:
    title: str
    author: str
    category: str
    resource_type: str
    description: str
    url: str
    difficulty: str
    tags: str
    duration: int | None = None
    rating: float = 4.7


RESOURCES = (
    Resource("尚硅谷 Vue 3 教程", "哔哩哔哩", "前端开发", "video", "中文 Vue 3 系统视频课程，适合配合站内 Vue 中文指南学习。", "https://search.bilibili.com/all?keyword=%E5%B0%9A%E7%A1%85%E8%B0%B7%20Vue3%20%E6%95%99%E7%A8%8B", "beginner", "catalog-v2,Vue,前端,视频", 600),
    Resource("黑马程序员 React 教程", "哔哩哔哩", "前端开发", "video", "从组件基础到项目实践的中文 React 视频教程。", "https://search.bilibili.com/all?keyword=%E9%BB%91%E9%A9%AC%E7%A8%8B%E5%BA%8F%E5%91%98%20React%20%E6%95%99%E7%A8%8B", "beginner", "catalog-v2,React,前端,视频", 720),
    Resource("Python 全套入门教程", "哔哩哔哩", "Python", "video", "面向零基础学习者的中文 Python 编程视频课程。", "https://search.bilibili.com/all?keyword=Python%20%E9%9B%B6%E5%9F%BA%E7%A1%80%20%E6%95%99%E7%A8%8B", "beginner", "catalog-v2,Python,编程基础,视频", 900),
    Resource("数据结构与算法公开课", "中国大学 MOOC", "算法与数据结构", "video", "中文高校数据结构与算法课程合集，覆盖常用结构与经典算法。", "https://www.icourse163.org/search.htm?search=%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%E4%B8%8E%E7%AE%97%E6%B3%95", "intermediate", "catalog-v2,算法,数据结构,视频", 960),
    Resource("现代 JavaScript 教程", "现代 JavaScript 教程", "前端开发", "article", "结构清晰的中文 JavaScript 教程，覆盖语言基础、浏览器和进阶主题。", "https://zh.javascript.info/", "beginner", "catalog-v2,JavaScript,前端,文章"),
    Resource("TypeScript 入门教程", "TypeScript 中文文档", "前端开发", "article", "面向 JavaScript 开发者的中文 TypeScript 学习资料。", "https://typescript.bootcss.com/", "intermediate", "catalog-v2,TypeScript,前端,文章"),
    Resource("Python 3 教程", "菜鸟教程", "Python", "article", "中文 Python 3 基础教程，适合快速查阅语法和常用示例。", "https://www.runoob.com/python3/python3-tutorial.html", "beginner", "catalog-v2,Python,编程基础,文章"),
    Resource("Git 教程", "廖雪峰的官方网站", "工程实践", "article", "中文 Git 教程，覆盖版本管理、分支协作和远程仓库。", "https://www.liaoxuefeng.com/wiki/896043488029600", "beginner", "catalog-v2,Git,工程实践,文章"),
    Resource("LeetCode 中文题库", "力扣", "算法与数据结构", "practice", "按难度和主题练习算法题，支持中文题目与在线判题。", "https://leetcode.cn/problemset/", "intermediate", "catalog-v2,算法,面试,练习"),
    Resource("牛客在线编程题库", "牛客", "求职面试", "practice", "覆盖企业真题、专项练习和编程面试题。", "https://www.nowcoder.com/exam/oj", "intermediate", "catalog-v2,面试,编程题,练习"),
    Resource("PTA 程序设计题库", "拼题 A", "编程基础", "practice", "中文程序设计练习平台，适合基础语法、数据结构和算法训练。", "https://pintia.cn/problem-sets?tab=0", "beginner", "catalog-v2,编程基础,算法,练习"),
    Resource("蓝桥云课在线实验", "蓝桥云课", "工程实践", "practice", "通过在线实验环境练习开发工具、后端、数据库和云计算。", "https://www.lanqiao.cn/courses/", "intermediate", "catalog-v2,在线实验,工程实践,练习"),
)


def connection():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB", "job_graph"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "123456@"),
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
    )


def main() -> int:
    legacy_authors = ("MDN Web Docs", "Python Documentation", "React Documentation", "Project Seed")
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute(SCHEMA_PATH.read_text(encoding="utf-8"))
        cursor.execute("SELECT id FROM learning_resources WHERE author = ANY(%s)", (list(legacy_authors),))
        legacy_ids = [row[0] for row in cursor.fetchall()]
        if legacy_ids:
            cursor.execute("DELETE FROM user_favorites WHERE favorite_type = 'resource' AND target_id = ANY(%s)", (legacy_ids,))
            cursor.execute("DELETE FROM learning_resources WHERE id = ANY(%s)", (legacy_ids,))
        for item in RESOURCES:
            cursor.execute("""
                INSERT INTO learning_resources
                  (title, author, category, resource_type, description, url, duration, difficulty_level, is_free, price, rating, tags, status, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, 0, %s, %s, 'active', CURRENT_TIMESTAMP)
                ON CONFLICT (url) DO UPDATE SET title = EXCLUDED.title, author = EXCLUDED.author,
                  category = EXCLUDED.category, resource_type = EXCLUDED.resource_type, description = EXCLUDED.description,
                  duration = EXCLUDED.duration, difficulty_level = EXCLUDED.difficulty_level, rating = EXCLUDED.rating,
                  tags = EXCLUDED.tags, status = 'active', updated_at = CURRENT_TIMESTAMP
            """, (item.title, item.author, item.category, item.resource_type, item.description, item.url, item.duration, item.difficulty, item.rating, item.tags))
    print(f"已移除 {len(legacy_ids)} 条旧资源，写入 {len(RESOURCES)} 条中文分类资源")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
