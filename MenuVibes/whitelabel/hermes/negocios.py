#!/usr/bin/env python3
"""Toolkit del perfil MenuVibes Operator (Hermes): acceso a TODOS los negocios.
Credenciales por entorno — NUNCA hardcodear:
    export SUPABASE_URL=https://supabase.rovicrm.com      # opcional (default)
    export SUPABASE_SERVICE_KEY=<service_role>            # requerido para escritura

Uso:
    python3 negocios.py list
    python3 negocios.py get <slug>
    python3 negocios.py features <slug> [--nps on|off] [--resenas on|off]
    python3 negocios.py canal <slug> add "<Plataforma>" "<url>"
    python3 negocios.py canal <slug> list
"""
import os, sys, json, urllib.request, urllib.error

URL = os.environ.get("SUPABASE_URL", "https://supabase.rovicrm.com").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")

def _req(method, path, body=None, prefer=None, base="/rest/v1/"):
    if not KEY:
        sys.exit("!! Falta SUPABASE_SERVICE_KEY en el entorno")
    h = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(URL + base + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            txt = resp.read().decode()
            return resp.status, (json.loads(txt) if txt.strip() else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def _neg_id(slug):
    s, d = _req("GET", f"negocios?slug=eq.{slug}&select=id")
    if not d:
        sys.exit(f"!! negocio '{slug}' no encontrado")
    return d[0]["id"]

def cmd_list():
    s, d = _req("GET", "negocios?select=slug,nombre,estado&order=nombre")
    print(f"{len(d)} negocios:")
    for n in d:
        print(f"  {n['estado']:10} {n['slug']:38} {n['nombre']}")

def cmd_get(slug):
    nid = _neg_id(slug)
    out = {"negocio": _req("GET", f"negocios?id=eq.{nid}")[1]}
    for t in ("branding", "features", "canales_resena", "beneficios_premium"):
        out[t] = _req("GET", f"{t}?negocio_id=eq.{nid}")[1]
    out["secciones"] = _req("GET", f"secciones?negocio_id=eq.{nid}&select=key,titulo,orden&order=orden")[1]
    out["productos"] = _req("GET", f"productos?negocio_id=eq.{nid}&select=nombre,precio&order=orden")[1]
    print(json.dumps(out, ensure_ascii=False, indent=2))

def cmd_features(slug, args):
    nid = _neg_id(slug)
    patch = {}
    if "--nps" in args:      patch["nps_visitas"]    = args[args.index("--nps") + 1] == "on"
    if "--resenas" in args:  patch["resenas_premium"] = args[args.index("--resenas") + 1] == "on"
    if not patch:
        print(json.dumps(_req("GET", f"features?negocio_id=eq.{nid}")[1], ensure_ascii=False, indent=2)); return
    s, _ = _req("PATCH", f"features?negocio_id=eq.{nid}", patch, prefer="return=minimal")
    print(f"features {slug} -> {s} {patch}")

def cmd_canal(slug, args):
    nid = _neg_id(slug)
    if args and args[0] == "list":
        print(json.dumps(_req("GET", f"canales_resena?negocio_id=eq.{nid}&order=orden")[1], ensure_ascii=False, indent=2)); return
    if len(args) >= 3 and args[0] == "add":
        s, _ = _req("POST", "canales_resena",
                    {"negocio_id": nid, "plataforma": args[1], "url": args[2], "activo": True},
                    prefer="return=minimal")
        print(f"canal add {slug} '{args[1]}' -> {s}"); return
    sys.exit("uso: canal <slug> add \"<Plataforma>\" \"<url>\"  |  canal <slug> list")

def main():
    a = sys.argv[1:]
    if not a:
        print(__doc__); return
    cmd, rest = a[0], a[1:]
    if   cmd == "list":     cmd_list()
    elif cmd == "get":      cmd_get(rest[0])
    elif cmd == "features": cmd_features(rest[0], rest[1:])
    elif cmd == "canal":    cmd_canal(rest[0], rest[1:])
    else: sys.exit(f"comando desconocido: {cmd}\n{__doc__}")

if __name__ == "__main__":
    main()
