#!/usr/bin/env python3
"""Despliega un archivo precompilado mediante el MCP oficial de Hostinger."""

from __future__ import annotations

import json
import os
import queue
import subprocess
import sys
import threading
import time


DOMAIN = sys.argv[1]
ARCHIVE = os.path.abspath(sys.argv[2])
TOKEN = os.environ["HOSTINGER_API_TOKEN"]

process = subprocess.Popen(
    ["npx", "--yes", "--package=hostinger-api-mcp@latest", "hostinger-hosting-mcp"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.DEVNULL,
    env={**os.environ, "HOSTINGER_API_TOKEN": TOKEN},
    text=True,
)
lines: queue.Queue[str] = queue.Queue()
threading.Thread(
    target=lambda: [lines.put(line) for line in process.stdout], daemon=True
).start()


def send(payload: dict) -> None:
    assert process.stdin is not None
    process.stdin.write(json.dumps(payload) + "\n")
    process.stdin.flush()


def wait_for(expected_id: int, timeout: int) -> dict:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            raw = lines.get(timeout=5).strip()
        except queue.Empty:
            continue
        if not raw.startswith("{"):
            continue
        try:
            message = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if message.get("id") == expected_id:
            return message
    raise TimeoutError("Hostinger no confirmó el despliegue dentro del tiempo esperado")


try:
    send(
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "emir24-deploy", "version": "1.0"},
            },
        }
    )
    wait_for(1, 60)
    send({"jsonrpc": "2.0", "method": "notifications/initialized"})
    send(
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "hosting_deployStaticWebsite",
                "arguments": {
                    "domain": DOMAIN,
                    "archivePath": ARCHIVE,
                    "removeArchive": False,
                },
            },
        }
    )
    response = wait_for(2, 600)
    if "error" in response:
        raise RuntimeError(json.dumps(response["error"], ensure_ascii=False))
    result = response.get("result", {})
    if result.get("isError"):
        raise RuntimeError(json.dumps(result.get("content", []), ensure_ascii=False))
    print(f"DEPLOYED=https://{DOMAIN}/")
finally:
    process.terminate()
