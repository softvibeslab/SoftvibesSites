#!/usr/bin/env python3
"""Validate the core invariants of a Behance inspiration library."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import urlparse


VALID_STATES = {"candidate", "favorite", "rejected"}


def validate(data: object) -> list[str]:
    errors: list[str] = []
    if not isinstance(data, dict):
        return ["root must be a JSON object"]

    if data.get("schema_version") != "1.0":
        errors.append("schema_version must be '1.0'")

    collection = data.get("collection")
    if not isinstance(collection, dict) or not collection.get("id"):
        errors.append("collection.id is required")

    if not isinstance(data.get("search_seeds", []), list):
        errors.append("search_seeds must be an array")

    items = data.get("items")
    if not isinstance(items, list):
        errors.append("items must be an array")
        return errors

    seen_ids: set[str] = set()
    seen_urls: set[str] = set()
    for index, item in enumerate(items):
        prefix = f"items[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{prefix} must be an object")
            continue

        item_id = item.get("id")
        if not isinstance(item_id, str) or not item_id:
            errors.append(f"{prefix}.id is required")
        elif item_id in seen_ids:
            errors.append(f"{prefix}.id duplicates {item_id}")
        else:
            seen_ids.add(item_id)

        state = item.get("status")
        if state not in VALID_STATES:
            errors.append(f"{prefix}.status must be one of {sorted(VALID_STATES)}")
        if state == "favorite" and item.get("liked_by_user") is not True:
            errors.append(f"{prefix}: favorite requires liked_by_user=true")

        source_url = item.get("source_url")
        if not isinstance(source_url, str) or not source_url:
            errors.append(f"{prefix}.source_url is required")
        else:
            parsed = urlparse(source_url)
            hostname = (parsed.hostname or "").lower()
            if hostname not in {"behance.net", "www.behance.net"}:
                errors.append(f"{prefix}.source_url must use behance.net")
            if not parsed.path.startswith("/gallery/"):
                errors.append(f"{prefix}.source_url must be a Behance gallery URL")
            if source_url in seen_urls:
                errors.append(f"{prefix}.source_url is duplicated")
            seen_urls.add(source_url)

        for field in ("title", "creator", "captured_at"):
            if not isinstance(item.get(field), str) or not item.get(field):
                errors.append(f"{prefix}.{field} is required")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an inspiration-library.json file")
    parser.add_argument("path", type=Path)
    args = parser.parse_args()

    try:
        data = json.loads(args.path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"INVALID: {exc}")
        return 1

    errors = validate(data)
    if errors:
        print("INVALID")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"VALID: {args.path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

