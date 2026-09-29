#!/usr/bin/env python3
"""Build deterministic Behance and indexed-search URLs from a design query."""

from __future__ import annotations

import argparse
import json
from urllib.parse import quote


def build_query(query: str, kind: str) -> dict[str, str]:
    normalized = " ".join(query.split())
    if len(normalized) < 2:
        raise ValueError("query must contain at least two characters")
    if len(normalized) > 200:
        raise ValueError("query must not exceed 200 characters")

    encoded = quote(normalized, safe="")
    return {
        "query": normalized,
        "kind": kind,
        "encoded_query": encoded,
        "behance_url": f"https://www.behance.net/search/{kind}/{encoded}",
        "legacy_query_url": f"https://www.behance.net/search/{kind}?search={encoded}",
        "site_query": f'site:behance.net/gallery "{normalized}"',
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate Behance navigation and indexed-search queries."
    )
    parser.add_argument("query", help="Design inspiration query")
    parser.add_argument(
        "--kind",
        choices=("projects", "images", "users"),
        default="projects",
        help="Behance search surface (default: projects)",
    )
    parser.add_argument(
        "--format", choices=("json", "text"), default="json", help="Output format"
    )
    args = parser.parse_args()

    try:
        result = build_query(args.query, args.kind)
    except ValueError as exc:
        parser.error(str(exc))

    if args.format == "json":
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        for key, value in result.items():
            print(f"{key}: {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

