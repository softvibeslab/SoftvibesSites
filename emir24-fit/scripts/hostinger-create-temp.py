#!/usr/bin/env python3
"""Crea un sitio temporal mediante el servidor MCP oficial de Hostinger."""

from __future__ import annotations

import json
import os
import queue
import re
import subprocess
import sys
import threading
import time


ORDER_ID = int(sys.argv[1])
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


def wait_for(expected_id: int, timeout: int = 180) -> dict:
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
    raise TimeoutError(f"Hostinger no respondió para id={expected_id}")


def call(call_id: int, name: str, arguments: dict, timeout: int = 180) -> dict:
    send(
        {
            "jsonrpc": "2.0",
            "id": call_id,
            "method": "tools/call",
            "params": {"name": name, "arguments": arguments},
        }
    )
    response = wait_for(call_id, timeout)
    if "error" in response:
        raise RuntimeError(json.dumps(response["error"], ensure_ascii=False))
    result = response.get("result", {})
    if result.get("isError"):
        raise RuntimeError(json.dumps(result.get("content", []), ensure_ascii=False))
    return result


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

    generated = call(2, "hosting_generateAFreeSubdomainV1", {}, 180)
    serialized = json.dumps(generated, ensure_ascii=False)
    matches = re.findall(r"[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?\.hostingersite\.com", serialized)
    if not matches:
        raise RuntimeError("Hostinger no devolvió un subdominio temporal reconocible")
    domain = matches[0]
    print(f"Dominio generado: {domain}", flush=True)

    call(
        3,
        "hosting_createWebsiteV1",
        {"domain": domain, "order_id": ORDER_ID},
        240,
    )
    print("Creación solicitada; esperando disponibilidad...", flush=True)

    for attempt in range(24):
        listed = call(
            10 + attempt,
            "hosting_listWebsitesV1",
            {"domain": domain, "page": 1, "per_page": 10},
            120,
        )
        payload = json.dumps(listed, ensure_ascii=False)
        if domain in payload:
            print(f"DOMAIN={domain}", flush=True)
            break
        time.sleep(10)
    else:
        raise TimeoutError("El sitio fue solicitado, pero no apareció en el inventario")
finally:
    process.terminate()

