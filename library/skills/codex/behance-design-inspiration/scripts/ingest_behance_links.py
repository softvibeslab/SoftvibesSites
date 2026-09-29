#!/usr/bin/env python3
"""Canonicalize Behance project URLs and extract public project metadata."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


PROJECT_PATH = re.compile(r"^/gallery/(?P<id>\d+)/(?P<slug>[^/?#]+)")
LICENSE = re.compile(r'"license"\s*:\s*\{\s*"license"\s*:\s*"([^"]+)"')
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
)


class ProjectHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.ld_json_blocks: list[str] = []
        self._in_ld_json = False
        self._buffer: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        values = {key: value for key, value in attrs if value is not None}
        if tag == "meta":
            key = values.get("property") or values.get("name")
            content = values.get("content")
            if key and content:
                self.meta[key] = unescape(content)
        elif tag == "script" and values.get("type") == "application/ld+json":
            self._in_ld_json = True
            self._buffer = []

    def handle_data(self, data: str) -> None:
        if self._in_ld_json:
            self._buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._in_ld_json:
            self.ld_json_blocks.append("".join(self._buffer))
            self._in_ld_json = False
            self._buffer = []


def canonicalize(raw_url: str) -> tuple[str, str]:
    parsed = urlparse(raw_url.strip())
    hostname = (parsed.hostname or "").lower()
    if hostname not in {"behance.net", "www.behance.net"}:
        raise ValueError("URL must use behance.net")
    match = PROJECT_PATH.match(parsed.path)
    if not match:
        raise ValueError("URL must be a Behance /gallery/<id>/<slug> project")
    project_id = match.group("id")
    canonical = f"https://www.behance.net/gallery/{project_id}/{match.group('slug')}"
    return project_id, canonical


def fetch(url: str, timeout: float, retries: int) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "en-US,en;q=0.8",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            with urlopen(request, timeout=timeout) as response:
                return response.read().decode("utf-8", errors="replace")
        except (HTTPError, URLError, TimeoutError) as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(1.0 * (attempt + 1))
    raise RuntimeError(str(last_error or "unknown fetch error"))


def find_visual_artwork(blocks: list[str]) -> dict[str, Any]:
    for block in blocks:
        try:
            value = json.loads(block)
        except json.JSONDecodeError:
            continue
        candidates = value if isinstance(value, list) else [value]
        for candidate in candidates:
            if isinstance(candidate, dict) and candidate.get("@type") == "VisualArtwork":
                return candidate
    return {}


def creator_names(value: Any) -> list[str]:
    values = value if isinstance(value, list) else [value]
    names: list[str] = []
    for creator in values:
        if isinstance(creator, dict) and isinstance(creator.get("name"), str):
            names.append(creator["name"])
        elif isinstance(creator, str):
            names.append(creator)
    return names


def preview_images(source: str, limit: int) -> list[str]:
    normalized = source.replace("\\/", "/")
    matches = re.findall(
        r'https://mir-s3-cdn-cf\.behance\.net/project_modules/1400/[^"\'<>\s]+',
        normalized,
    )
    unique: list[str] = []
    seen: set[str] = set()
    for image_url in matches:
        image_url = unescape(image_url).replace("\\u0026", "&")
        if image_url not in seen:
            seen.add(image_url)
            unique.append(image_url)
        if len(unique) >= limit:
            break
    return unique


def extract(raw_url: str, timeout: float, retries: int, image_limit: int) -> dict[str, Any]:
    project_id, canonical_url = canonicalize(raw_url)
    source = fetch(canonical_url, timeout=timeout, retries=retries)
    parser = ProjectHTMLParser()
    parser.feed(source)
    artwork = find_visual_artwork(parser.ld_json_blocks)
    license_match = LICENSE.search(source)
    return {
        "id": project_id,
        "canonical_url": canonical_url,
        "title": artwork.get("name") or parser.meta.get("og:title") or "",
        "creators": creator_names(artwork.get("creator", [])),
        "description": artwork.get("description") or parser.meta.get("og:description") or "",
        "cover_url": artwork.get("image") or "",
        "hero_image_url": parser.meta.get("og:image", ""),
        "preview_image_urls": preview_images(source, image_limit),
        "behance_license": license_match.group(1) if license_match else "unknown",
    }


def load_urls(path: Path) -> list[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    urls: list[str] = []
    seen_ids: set[str] = set()
    for number, line in enumerate(lines, start=1):
        value = line.strip()
        if not value or value.startswith("#"):
            continue
        project_id, canonical = canonicalize(value)
        if project_id not in seen_ids:
            seen_ids.add(project_id)
            urls.append(canonical)
        else:
            print(f"deduplicated line {number}: project {project_id}", file=sys.stderr)
    return urls


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract public metadata for canonical Behance project URLs."
    )
    parser.add_argument("input", type=Path, help="Text file with one project URL per line")
    parser.add_argument("--output", type=Path, help="Write JSON to this path")
    parser.add_argument("--delay", type=float, default=0.4, help="Delay between requests")
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--max-preview-images", type=int, default=3)
    args = parser.parse_args()

    records: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    try:
        urls = load_urls(args.input)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))

    for index, url in enumerate(urls):
        try:
            records.append(
                extract(url, args.timeout, args.retries, args.max_preview_images)
            )
        except (ValueError, RuntimeError) as exc:
            errors.append({"url": url, "error": str(exc)})
        if index + 1 < len(urls) and args.delay > 0:
            time.sleep(args.delay)

    payload = {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "count": len(records),
        "error_count": len(errors),
        "projects": records,
        "errors": errors,
    }
    rendered = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())

