#!/usr/bin/env python3
"""Validate and normalize a stable BeGlobal Pro course or lesson URL."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from urllib.parse import urlsplit, urlunsplit


ALLOWED_HOSTS = {"beglobalpro.org", "platform.example.invalid"}
UUID_PATTERN = r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
LESSON_RE = re.compile(rf"^/cursos/contenido/(?P<course>{UUID_PATTERN})/(?P<lesson>[0-9]+)/?$", re.I)
COURSE_RE = re.compile(rf"^/cursos/(?:contenido/)?(?P<course>{UUID_PATTERN})/?$", re.I)


class ItemUrlError(ValueError):
    """Raised when an item URL is not a supported stable BeGlobal URL."""


@dataclass(frozen=True)
class ItemUrl:
    normalized_url: str
    item_type: str
    course_id: str
    lesson_id: str | None


def normalize_item_url(value: str) -> ItemUrl:
    raw = str(value or "").strip()
    if not raw or len(raw) > 2048 or any(ord(ch) < 32 for ch in raw):
        raise ItemUrlError("item_url ausente o inválida")
    parsed = urlsplit(raw)
    if parsed.scheme != "https":
        raise ItemUrlError("item_url debe usar https")
    if parsed.username or parsed.password:
        raise ItemUrlError("item_url no puede incluir credenciales")
    host = (parsed.hostname or "").lower().rstrip(".")
    if host not in ALLOWED_HOSTS or parsed.port not in (None, 443):
        raise ItemUrlError("item_url debe pertenecer a beglobalpro.org")

    path = re.sub(r"/{2,}", "/", parsed.path)
    lesson = LESSON_RE.fullmatch(path)
    course = COURSE_RE.fullmatch(path)
    if lesson:
        item_type = "lesson"
        course_id = lesson.group("course").lower()
        lesson_id = lesson.group("lesson")
        canonical_path = f"/cursos/contenido/{course_id}/{lesson_id}"
    elif course:
        item_type = "course"
        course_id = course.group("course").lower()
        lesson_id = None
        canonical_path = f"/cursos/{course_id}"
    else:
        raise ItemUrlError("se requiere una URL estable de curso o lección")

    normalized = urlunsplit(("https", "platform.example.invalid", canonical_path, "", ""))
    return ItemUrl(normalized, item_type, course_id, lesson_id)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("item_url")
    args = parser.parse_args()
    try:
        print(json.dumps(asdict(normalize_item_url(args.item_url)), ensure_ascii=False))
    except ItemUrlError as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False))
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
