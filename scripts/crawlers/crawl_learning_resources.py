"""Collect public learning catalogue metadata into the learning_resources table.

The crawler only records title, source, and original public URL. It does not
download course content, bypass access controls, or crawl pages outside the
configured catalogue pages. Run with --dry-run first to inspect output.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from dataclasses import asdict, dataclass
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

import psycopg2
import requests


USER_AGENT = "ResumeAnalysisLearningResourceBot/1.0 (catalogue metadata collector)"
REQUEST_DELAY_SECONDS = 1.0


@dataclass(frozen=True)
class Source:
    name: str
    catalogue_url: str
    base_url: str
    url_pattern: re.Pattern[str]
    resource_type: str
    category: str


@dataclass
class Resource:
    title: str
    author: str
    category: str
    resource_type: str
    description: str
    url: str
    difficulty_level: str
    tags: list[str]
    is_free: bool = True
    rating: float = 4.7


SOURCES = {
    "mdn": Source(
        name="MDN Web Docs",
        catalogue_url="https://developer.mozilla.org/en-US/docs/Learn_web_development",
        base_url="https://developer.mozilla.org",
        url_pattern=re.compile(r"^/en-US/docs/Learn_web_development/.+"),
        resource_type="article",
        category="前端开发",
    ),
    "python": Source(
        name="Python Documentation",
        catalogue_url="https://docs.python.org/3/tutorial/",
        base_url="https://docs.python.org",
        url_pattern=re.compile(r"^/3/tutorial/.+\.html$"),
        resource_type="article",
        category="Python",
    ),
    "react": Source(
        name="React Documentation",
        catalogue_url="https://react.dev/learn",
        base_url="https://react.dev",
        url_pattern=re.compile(r"^/learn/.+"),
        resource_type="article",
        category="前端开发",
    ),
}


class AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str]] = []
        self._href: str | None = None
        self._text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "a":
            self._href = dict(attrs).get("href")
            self._text = []

    def handle_data(self, data: str) -> None:
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._href:
            title = " ".join("".join(self._text).split())
            self.links.append((self._href, title))
            self._href = None
            self._text = []


def normalize_title(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value)).strip(" -|:")


def is_learning_title(title: str) -> bool:
    lowered = title.lower()
    excluded = ("changelog", "contributor", "educator", "privacy", "copyright")
    return not any(term in lowered for term in excluded)


def infer_difficulty(title: str) -> str:
    lowered = title.lower()
    if any(term in lowered for term in ("advanced", "optimization", "performance", "architecture", "concurrent")):
        return "advanced"
    if any(term in lowered for term in ("introduction", "getting started", "basics", "first steps", "tutorial")):
        return "beginner"
    return "intermediate"


def collect_from_source(source: Source, limit: int) -> list[Resource]:
    response = requests.get(source.catalogue_url, headers={"User-Agent": USER_AGENT}, timeout=25)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or "utf-8"
    parser = AnchorParser()
    parser.feed(response.text)
    resources: list[Resource] = []
    seen: set[str] = set()
    source_host = urlparse(source.base_url).netloc

    for href, raw_title in parser.links:
        absolute_url = urljoin(source.catalogue_url, href).split("#", 1)[0]
        parsed = urlparse(absolute_url)
        if parsed.netloc != source_host or not source.url_pattern.match(parsed.path):
            continue
        title = normalize_title(raw_title)
        if not title or len(title) < 3 or not is_learning_title(title) or absolute_url in seen:
            continue
        seen.add(absolute_url)
        resources.append(Resource(
            title=title[:500],
            author=source.name,
            category=source.category,
            resource_type=source.resource_type,
            description=f"来自 {source.name} 公开目录的 {title} 学习资源。",
            url=absolute_url,
            difficulty_level=infer_difficulty(title),
            tags=[source.category, source.name],
        ))
        if len(resources) >= limit:
            break
    return resources


def write_json(resources: Iterable[Resource], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps([asdict(item) for item in resources], ensure_ascii=False, indent=2), encoding="utf-8")


def get_database_connection():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB", "job_graph"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "123456@"),
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
    )


def ensure_schema() -> None:
    schema_path = Path(__file__).parents[1] / "data_import" / "learning_resources.sql"
    with get_database_connection() as connection, connection.cursor() as cursor:
        cursor.execute(schema_path.read_text(encoding="utf-8"))


def upsert_resources(resources: list[Resource]) -> int:
    connection = get_database_connection()
    query = """
        INSERT INTO learning_resources
          (title, author, category, resource_type, description, url, difficulty_level, is_free, price, rating, tags, status, updated_at)
        VALUES (%(title)s, %(author)s, %(category)s, %(resource_type)s, %(description)s, %(url)s, %(difficulty_level)s, %(is_free)s, 0, %(rating)s, %(tags)s, 'active', CURRENT_TIMESTAMP)
        ON CONFLICT (url) DO UPDATE SET
          title = EXCLUDED.title,
          author = EXCLUDED.author,
          category = EXCLUDED.category,
          resource_type = EXCLUDED.resource_type,
          description = EXCLUDED.description,
          difficulty_level = EXCLUDED.difficulty_level,
          tags = EXCLUDED.tags,
          status = 'active',
          updated_at = CURRENT_TIMESTAMP
    """
    try:
        with connection, connection.cursor() as cursor:
            for resource in resources:
                payload = asdict(resource)
                payload["tags"] = ",".join(resource.tags)
                cursor.execute(query, payload)
        return len(resources)
    finally:
        connection.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="采集公开学习目录并写入 learning_resources")
    parser.add_argument("--source", choices=[*SOURCES, "all"], default="all", help="采集来源，默认全部")
    parser.add_argument("--limit", type=int, default=30, help="每个来源最多保留的条数")
    parser.add_argument("--dry-run", action="store_true", help="只采集并输出 JSON，不写入数据库")
    parser.add_argument("--init-db", action="store_true", help="执行 learning_resources 表迁移后再写入")
    parser.add_argument("--output", type=Path, help="可选：保存采集到的 JSON 文件")
    args = parser.parse_args()
    if args.limit < 1:
        parser.error("--limit 必须大于 0")

    selected = SOURCES.values() if args.source == "all" else [SOURCES[args.source]]
    collected: list[Resource] = []
    for index, source in enumerate(selected):
        try:
            rows = collect_from_source(source, args.limit)
            print(f"{source.name}: 采集 {len(rows)} 条")
            collected.extend(rows)
        except requests.RequestException as error:
            print(f"{source.name}: 请求失败，已跳过 ({error})", file=sys.stderr)
        if index < len(selected) - 1:
            time.sleep(REQUEST_DELAY_SECONDS)

    deduplicated = list({item.url: item for item in collected}.values())
    if args.output:
        write_json(deduplicated, args.output)
        print(f"JSON 已写入: {args.output}")
    if args.dry_run:
        print(f"试运行完成，共 {len(deduplicated)} 条，未写入数据库")
        return 0
    if not deduplicated:
        print("没有可写入的数据", file=sys.stderr)
        return 1
    if args.init_db:
        ensure_schema()
        print("数据库表结构已确认")
    count = upsert_resources(deduplicated)
    print(f"写入完成，共处理 {count} 条学习资源")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
