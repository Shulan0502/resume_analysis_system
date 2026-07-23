"""Synchronize complete Chinese Markdown documentation series locally.

Each approved repository is shallow-cloned with Git sparse checkout. Only the
configured documentation subtree is downloaded, then copied into
backend/learning_content and indexed in PostgreSQL for the reader API.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

import psycopg2


ROOT = Path(__file__).parents[2]
CONTENT_ROOT = ROOT / "backend" / "learning_content"
SCHEMA_PATH = ROOT / "backend" / "src" / "main" / "resources" / "learning-resources-schema.sql"


@dataclass(frozen=True)
class Series:
    slug: str
    title: str
    provider: str
    category: str
    description: str
    repository_url: str
    source_site_url: str
    repository_clone_url: str
    branch: str
    content_subdir: str


SERIES = (
    Series(
        slug="vue-zh-guide",
        title="Vue.js 中文指南",
        provider="Vue.js 中文文档",
        category="前端开发",
        description="Vue 官方中文指南，覆盖基础语法、组件、组合式 API 与工程实践。",
        repository_url="https://github.com/vuejs-translations/docs-zh-cn",
        source_site_url="https://cn.vuejs.org/guide/introduction.html",
        repository_clone_url="https://github.com/vuejs-translations/docs-zh-cn.git",
        branch="main",
        content_subdir="src/guide",
    ),
    Series(
        slug="react-zh-guide",
        title="React 中文学习路径",
        provider="React 中文文档",
        category="前端开发",
        description="React 官方中文学习文档，从界面描述、交互到状态管理与进阶实践。",
        repository_url="https://github.com/reactjs/zh-hans.react.dev",
        source_site_url="https://zh-hans.react.dev/learn",
        repository_clone_url="https://github.com/reactjs/zh-hans.react.dev.git",
        branch="main",
        content_subdir="src/content/learn",
    ),
    Series(
        slug="mdn-web-zh",
        title="MDN Web 开发中文课程",
        provider="MDN 中文文档",
        category="前端开发",
        description="MDN 中文 Web 开发课程，系统学习 HTML、CSS、JavaScript 与常用工具。",
        repository_url="https://github.com/mdn/translated-content",
        source_site_url="https://developer.mozilla.org/zh-CN/docs/Learn_web_development",
        repository_clone_url="https://github.com/mdn/translated-content.git",
        branch="main",
        content_subdir="files/zh-cn/learn_web_development",
    ),
)


def connection():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB", "job_graph"), user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "123456@"), host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
    )


def markdown_title(content: str, path: Path) -> str:
    frontmatter = re.match(r"^---\s*\n(.*?)\n---", content, flags=re.DOTALL)
    title_match = re.search(r"^title:\s*['\"]?(.+?)['\"]?\s*$", frontmatter.group(1), flags=re.MULTILINE) if frontmatter else None
    heading_match = re.search(r"^#\s+(.+)$", content, flags=re.MULTILINE)
    title = title_match.group(1).strip() if title_match else (
        heading_match.group(1).strip() if heading_match else path.parent.name.replace("_", " ").replace("-", " ")
    )
    title = re.sub(r"\s*\{#[^}]+\}\s*$", "", title)
    title = re.sub(r"[*_`]", "", title).strip()
    return (title or path.stem)[:300]


def ensure_schema() -> None:
    with connection() as conn, conn.cursor() as cursor:
        cursor.execute(SCHEMA_PATH.read_text(encoding="utf-8"))


def clone_document_tree(series: Series, workspace: Path) -> Path:
    repository = workspace / "repository"
    subprocess.run([
        "git", "clone", "--depth", "1", "--filter=blob:none", "--sparse",
        "--branch", series.branch, series.repository_clone_url, str(repository),
    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    subprocess.run([
        "git", "-C", str(repository), "sparse-checkout", "set", series.content_subdir,
    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    content_tree = repository / series.content_subdir
    if not content_tree.is_dir():
        raise RuntimeError(f"仓库中不存在目录: {series.content_subdir}")
    return content_tree


def document_sort_key(path: Path) -> tuple[int, int, str]:
    is_index = path.name.lower() in {"index.md", "introduction.md"}
    return (len(path.parts), 0 if is_index else 1, path.as_posix())


def sync_series(series: Series, limit: int, dry_run: bool) -> int:
    with tempfile.TemporaryDirectory(prefix=f"learning-{series.slug}-") as temporary:
        content_tree = clone_document_tree(series, Path(temporary))
        markdown_files = sorted(content_tree.rglob("*.md"), key=lambda path: document_sort_key(path.relative_to(content_tree)))
        if limit:
            markdown_files = markdown_files[:limit]
        documents: list[tuple[str, str, str, Path]] = []
        asset_files = [path for path in content_tree.rglob("*") if path.is_file() and path.suffix.lower() != ".md"]
        destination_root = (CONTENT_ROOT / series.slug).resolve()
        if not dry_run and CONTENT_ROOT.resolve() in destination_root.parents and destination_root.is_dir():
            shutil.rmtree(destination_root)
        for source_path in markdown_files:
            relative_path = source_path.relative_to(content_tree)
            content = source_path.read_text(encoding="utf-8")
            local_path = CONTENT_ROOT / series.slug / relative_path
            source_url = f"{series.repository_url}/blob/{series.branch}/{series.content_subdir}/{relative_path.as_posix()}"
            documents.append((markdown_title(content, relative_path), relative_path.as_posix(), source_url, local_path))
            if not dry_run:
                local_path.parent.mkdir(parents=True, exist_ok=True)
                local_path.write_text(content, encoding="utf-8")

        if not dry_run:
            for source_path in asset_files:
                relative_path = source_path.relative_to(content_tree)
                local_path = CONTENT_ROOT / series.slug / relative_path
                local_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, local_path)

    if dry_run:
        print(f"{series.title}: 完整目录包含 {len(documents)} 篇 Markdown")
        return len(documents)

    with connection() as conn, conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO learning_resource_series (slug, title, provider, category, description, repository_url, source_site_url, language, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'zh-CN', CURRENT_TIMESTAMP)
            ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, provider = EXCLUDED.provider,
              category = EXCLUDED.category, description = EXCLUDED.description, repository_url = EXCLUDED.repository_url,
              source_site_url = EXCLUDED.source_site_url, updated_at = CURRENT_TIMESTAMP
            RETURNING id
        """, (series.slug, series.title, series.provider, series.category, series.description, series.repository_url, series.source_site_url))
        series_id = cursor.fetchone()[0]
        for order, (title, relative_path, source_url, local_path) in enumerate(documents):
            relative_local_path = local_path.relative_to(CONTENT_ROOT).as_posix()
            cursor.execute("""
                INSERT INTO learning_resource_documents (series_id, title, relative_path, local_path, source_url, sort_order, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (series_id, relative_path) DO UPDATE SET title = EXCLUDED.title, local_path = EXCLUDED.local_path,
                  source_url = EXCLUDED.source_url, sort_order = EXCLUDED.sort_order, updated_at = CURRENT_TIMESTAMP
            """, (series_id, title, relative_path, relative_local_path, source_url, order))
        if documents:
            cursor.execute(
                "DELETE FROM learning_resource_documents WHERE series_id = %s AND NOT (relative_path = ANY(%s))",
                (series_id, [document[1] for document in documents]),
            )
    print(f"{series.title}: 已同步完整目录，共 {len(documents)} 篇文档、{len(asset_files)} 个资源文件")
    return len(documents)


def main() -> int:
    parser = argparse.ArgumentParser(description="同步完整中文 Markdown 学习系列到本地")
    parser.add_argument("--series", choices=[item.slug for item in SERIES] + ["all"], default="all")
    parser.add_argument("--limit", type=int, default=0, help="每个系列最多同步的篇数，0 表示全部")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--init-db", action="store_true")
    args = parser.parse_args()
    if args.limit < 0:
        parser.error("--limit 不能小于 0")
    if args.init_db and not args.dry_run:
        ensure_schema()
    selected = SERIES if args.series == "all" else tuple(item for item in SERIES if item.slug == args.series)
    try:
        total = sum(sync_series(item, args.limit, args.dry_run) for item in selected)
    except (subprocess.CalledProcessError, RuntimeError) as error:
        parser.exit(1, f"同步失败: {error}\n")
    print(f"完成，共处理 {total} 篇文档")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
