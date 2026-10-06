"""Club Cisne Negro: Pasaporte (visitas y cortesías) y NPS.

Servidor HTTP sin dependencias externas (Python 3.11+ y SQLite). Corre detrás de nginx:
  /api/*        → API pública del menú (socios, check-in, NPS)
  /api/admin/*  → panel del personal (nginx pide usuario y contraseña)

Variables de entorno:
  CLUB_DB      ruta de la base SQLite        (default ./club.db)
  CLUB_SECRET  secreto para el código del día (obligatorio en producción)
  CLUB_PORT    puerto local                  (default 8790)
  CLUB_REVIEW_URL  enlace para dejar reseña en Google
"""
import csv
import hashlib
import hmac
import io
import json
import os
import re
import secrets
import sqlite3
import threading
import time
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

DB_PATH = os.environ.get("CLUB_DB", "club.db")
SECRET = os.environ.get("CLUB_SECRET", "dev-secret")
PORT = int(os.environ.get("CLUB_PORT", "8790"))
REVIEW_URL = os.environ.get(
    "CLUB_REVIEW_URL", "https://search.google.com/local/writereview?placeid=ChIJ-ed8Ic0J0YURa34980-5WC0")
TZ = timezone(timedelta(hours=-6))  # America/Mexico_City (sin horario de verano desde 2022)

# Recompensas por número de visita. El ciclo se repite cada 10 visitas.
RECOMPENSAS = {5: "Cerveza de barril de 4 oz de cortesía", 10: "Cerveza de barril de 12 oz de cortesía"}
CICLO = 10
VIGENCIA_DIAS = 30
SESION_DIAS = 180

SCHEMA = """
create table if not exists socios (
  id integer primary key,
  nombre text not null,
  telefono text not null unique,
  pin_hash text not null,
  acepta_privacidad_at text not null,
  acepta_whatsapp integer not null default 0,
  creado_at text not null
);
create table if not exists sesiones (
  token text primary key,
  socio_id integer not null references socios(id),
  creado_at text not null
);
create table if not exists visitas (
  id integer primary key,
  socio_id integer not null references socios(id),
  dia text not null,
  creado_at text not null,
  unique (socio_id, dia)
);
create table if not exists recompensas (
  id integer primary key,
  socio_id integer not null references socios(id),
  visita_id integer references visitas(id),
  codigo text not null unique,
  nombre text not null,
  estado text not null default 'emitida',
  emitida_at text not null,
  vence_at text not null,
  canjeada_at text
);
create table if not exists nps (
  id integer primary key,
  socio_id integer not null references socios(id),
  visita_id integer not null unique references visitas(id),
  score integer not null check (score between 0 and 10),
  comentario text,
  creado_at text not null,
  seguimiento text not null default 'nuevo',
  notas text,
  actualizado_at text
);
create table if not exists clicks_resena (
  id integer primary key,
  socio_id integer references socios(id),
  visita_id integer references visitas(id),
  creado_at text not null
);
"""

_lock = threading.Lock()
_intentos: dict[str, list[float]] = {}


def ahora():
    return datetime.now(TZ)


def iso(dt=None):
    return (dt or ahora()).isoformat(timespec="seconds")


def db():
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    con.execute("pragma foreign_keys = on")
    return con


def init_db():
    with db() as con:
        con.executescript(SCHEMA)
        con.execute("pragma journal_mode = wal")


def codigo_del_dia(dia=None):
    dia = dia or ahora().date().isoformat()
    digest = hmac.new(SECRET.encode(), dia.encode(), hashlib.sha256).hexdigest()
    return f"{int(digest[:8], 16) % 10000:04d}"


def hash_pin(telefono, pin):
    return hashlib.pbkdf2_hmac("sha256", pin.encode(), f"cn:{telefono}".encode(), 200_000).hex()


def normaliza_tel(tel):
    digitos = re.sub(r"\D", "", tel or "")
    if len(digitos) == 12 and digitos.startswith("52"):
        digitos = digitos[2:]
    return digitos if len(digitos) == 10 else None


def limitar(clave, maximo=8, ventana=300):
    """Rate limit en memoria: máximo N intentos por clave en la ventana (segundos)."""
    t = time.time()
    with _lock:
        lista = [x for x in _intentos.get(clave, []) if t - x < ventana]
        lista.append(t)
        _intentos[clave] = lista
        return len(lista) <= maximo


def nuevo_codigo(con):
    alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    while True:
        codigo = "CN-" + "".join(secrets.choice(alfabeto) for _ in range(5))
        if not con.execute("select 1 from recompensas where codigo = ?", (codigo,)).fetchone():
            return codigo


def estado_socio(con, socio_id):
    s = con.execute("select id, nombre, telefono from socios where id = ?", (socio_id,)).fetchone()
    visitas = con.execute("select count(*) from visitas where socio_id = ?", (socio_id,)).fetchone()[0]
    hoy = ahora().date().isoformat()
    visita_hoy = con.execute("select id from visitas where socio_id = ? and dia = ?", (socio_id, hoy)).fetchone()
    nps_hoy = bool(visita_hoy and con.execute(
        "select 1 from nps where visita_id = ?", (visita_hoy["id"],)).fetchone())
    recompensas = [dict(r) for r in con.execute(
        "select codigo, nombre, estado, vence_at from recompensas where socio_id = ? "
        "and estado = 'emitida' and vence_at >= ? order by emitida_at desc", (socio_id, iso()))]
    en_ciclo = visitas % CICLO
    siguiente = next((n for n in sorted(RECOMPENSAS) if n > en_ciclo), None)
    return {
        "nombre": s["nombre"], "telefono_final": s["telefono"][-4:], "visitas": visitas,
        "sellos_ciclo": en_ciclo if en_ciclo or not visitas else CICLO, "ciclo": CICLO,
        "proxima_recompensa": {"en_visita": siguiente, "faltan": siguiente - en_ciclo,
                               "nombre": RECOMPENSAS[siguiente]} if siguiente else None,
        "visita_hoy": visita_hoy["id"] if visita_hoy else None, "nps_hoy": nps_hoy,
        "recompensas": recompensas,
    }


# ── Handlers ────────────────────────────────────────────────────────────────

def api_registro(h, body):
    nombre = (body.get("nombre") or "").strip()[:60]
    tel = normaliza_tel(body.get("telefono"))
    pin = str(body.get("pin") or "")
    if not nombre or not tel or not re.fullmatch(r"\d{4}", pin):
        return 400, {"error": "Escribe tu nombre, un teléfono de 10 dígitos y un PIN de 4 números."}
    if not body.get("acepta_privacidad"):
        return 400, {"error": "Necesitamos que aceptes el aviso de privacidad."}
    if not limitar("reg:" + h.ip(), 60, 3600):
        return 429, {"error": "Demasiados intentos. Prueba más tarde."}
    with db() as con:
        if con.execute("select 1 from socios where telefono = ?", (tel,)).fetchone():
            return 409, {"error": "Ese teléfono ya tiene Pasaporte. Entra con tu PIN."}
        cur = con.execute(
            "insert into socios (nombre, telefono, pin_hash, acepta_privacidad_at, acepta_whatsapp, creado_at) "
            "values (?, ?, ?, ?, ?, ?)",
            (nombre, tel, hash_pin(tel, pin), iso(), 1 if body.get("acepta_whatsapp") else 0, iso()))
        token = secrets.token_urlsafe(32)
        con.execute("insert into sesiones values (?, ?, ?)", (token, cur.lastrowid, iso()))
        return 201, {"token": token, "socio": estado_socio(con, cur.lastrowid)}


def api_login(h, body):
    tel = normaliza_tel(body.get("telefono"))
    pin = str(body.get("pin") or "")
    if not limitar("login:" + h.ip(), 60, 300) or (tel and not limitar("login-tel:" + tel, 8, 300)):
        return 429, {"error": "Demasiados intentos. Espera 5 minutos."}
    with db() as con:
        s = con.execute("select id, pin_hash from socios where telefono = ?", (tel,)).fetchone() if tel else None
        if not s or not hmac.compare_digest(s["pin_hash"], hash_pin(tel, pin)):
            return 401, {"error": "Teléfono o PIN incorrectos."}
        token = secrets.token_urlsafe(32)
        con.execute("insert into sesiones values (?, ?, ?)", (token, s["id"], iso()))
        return 200, {"token": token, "socio": estado_socio(con, s["id"])}


def api_yo(h, body, socio_id):
    with db() as con:
        return 200, {"socio": estado_socio(con, socio_id)}


def api_checkin(h, body, socio_id):
    if not limitar(f"checkin:{socio_id}", 6, 600):
        return 429, {"error": "Demasiados intentos. Pídele el código del día al equipo."}
    if str(body.get("codigo") or "").strip() != codigo_del_dia():
        return 400, {"error": "Ese no es el código de hoy. Pídeselo al equipo en la barra."}
    hoy = ahora().date().isoformat()
    with db() as con:
        ya = con.execute("select id from visitas where socio_id = ? and dia = ?", (socio_id, hoy)).fetchone()
        if ya:
            return 200, {"ya_registrada": True, "visita_id": ya["id"], "socio": estado_socio(con, socio_id)}
        cur = con.execute("insert into visitas (socio_id, dia, creado_at) values (?, ?, ?)", (socio_id, hoy, iso()))
        n = con.execute("select count(*) from visitas where socio_id = ?", (socio_id,)).fetchone()[0]
        recompensa = None
        nombre = RECOMPENSAS.get(((n - 1) % CICLO) + 1)
        if nombre:
            codigo = nuevo_codigo(con)
            vence = iso(ahora() + timedelta(days=VIGENCIA_DIAS))
            con.execute("insert into recompensas (socio_id, visita_id, codigo, nombre, emitida_at, vence_at) "
                        "values (?, ?, ?, ?, ?, ?)", (socio_id, cur.lastrowid, codigo, nombre, iso(), vence))
            recompensa = {"codigo": codigo, "nombre": nombre, "vence_at": vence}
        return 201, {"ya_registrada": False, "visita_id": cur.lastrowid, "recompensa": recompensa,
                     "socio": estado_socio(con, socio_id)}


def api_nps(h, body, socio_id):
    try:
        score = int(body.get("score"))
        visita_id = int(body.get("visita_id"))
    except (TypeError, ValueError):
        return 400, {"error": "Elige un número del 0 al 10."}
    if not 0 <= score <= 10:
        return 400, {"error": "Elige un número del 0 al 10."}
    comentario = (body.get("comentario") or "").strip()[:1000]
    with db() as con:
        if not con.execute("select 1 from visitas where id = ? and socio_id = ?", (visita_id, socio_id)).fetchone():
            return 404, {"error": "Primero registra tu visita de hoy."}
        if con.execute("select 1 from nps where visita_id = ?", (visita_id,)).fetchone():
            return 200, {"ya_respondida": True}
        con.execute("insert into nps (socio_id, visita_id, score, comentario, creado_at) values (?, ?, ?, ?, ?)",
                    (socio_id, visita_id, score, comentario, iso()))
    return 201, {"ya_respondida": False, "invitar_resena": score >= 9,
                 "resena_url": REVIEW_URL if score >= 9 else None}


def api_click_resena(h, body, socio_id):
    with db() as con:
        v = con.execute("select id from visitas where id = ? and socio_id = ?",
                        (body.get("visita_id"), socio_id)).fetchone()
        if not v:
            return 404, {"error": "Visita no encontrada"}
        if not con.execute("select 1 from clicks_resena where visita_id = ?", (v["id"],)).fetchone():
            con.execute("insert into clicks_resena (socio_id, visita_id, creado_at) values (?, ?, ?)",
                        (socio_id, v["id"], iso()))
    return 201, {"ok": True}


def api_logout(h, body, socio_id):
    with db() as con:
        con.execute("delete from sesiones where token = ?", (h.token(),))
    return 200, {"ok": True}


# ── Admin (nginx protege /api/admin con basic auth) ─────────────────────────

def admin_resumen(h, q):
    try:
        dias = min(max(int(q.get("dias", ["30"])[0]), 1), 365)
    except ValueError:
        dias = 30
    desde = (ahora() - timedelta(days=dias)).isoformat(timespec="seconds")
    with db() as con:
        scores = [r[0] for r in con.execute("select score from nps where creado_at >= ?", (desde,))]
        prom = sum(1 for s in scores if s >= 9)
        det = sum(1 for s in scores if s <= 6)
        return 200, {
            "codigo_del_dia": codigo_del_dia(), "fecha": ahora().date().isoformat(),
            "socios": con.execute("select count(*) from socios").fetchone()[0],
            "socios_nuevos": con.execute("select count(*) from socios where creado_at >= ?", (desde,)).fetchone()[0],
            "visitas": con.execute("select count(*) from visitas where creado_at >= ?", (desde,)).fetchone()[0],
            "visitas_hoy": con.execute("select count(*) from visitas where dia = ?",
                                       (ahora().date().isoformat(),)).fetchone()[0],
            "nps": {"respuestas": len(scores), "promotores": prom, "detractores": det,
                    "pasivos": len(scores) - prom - det,
                    "score": round((prom - det) * 100 / len(scores)) if scores else None},
            "clicks_resena": con.execute("select count(*) from clicks_resena where creado_at >= ?",
                                         (desde,)).fetchone()[0],
            "recompensas": {r["estado"]: r["n"] for r in con.execute(
                "select estado, count(*) n from recompensas where emitida_at >= ? group by estado", (desde,))},
            "por_recuperar": con.execute("select count(*) from nps where score <= 6 and seguimiento in "
                                         "('nuevo','contactado')").fetchone()[0],
        }


def admin_nps(h, q):
    filtro = q.get("filtro", ["todos"])[0]
    where = {"detractores": "where n.score <= 6", "pendientes": "where n.score <= 6 and n.seguimiento "
             "in ('nuevo','contactado')"}.get(filtro, "")
    with db() as con:
        rows = con.execute(f"select n.id, n.score, n.comentario, n.creado_at, n.seguimiento, n.notas, "
                           f"s.nombre, s.telefono from nps n join socios s on s.id = n.socio_id {where} "
                           f"order by n.creado_at desc limit 200").fetchall()
        return 200, {"respuestas": [dict(r) for r in rows]}


def admin_nps_update(h, body, nps_id):
    estado = body.get("seguimiento")
    if estado not in ("nuevo", "contactado", "resuelto", "cerrado"):
        return 400, {"error": "Estado inválido"}
    with db() as con:
        cur = con.execute("update nps set seguimiento = ?, notas = ?, actualizado_at = ? where id = ?",
                          (estado, (body.get("notas") or "")[:1000], iso(), nps_id))
        if not cur.rowcount:
            return 404, {"error": "Respuesta no encontrada"}
    return 200, {"ok": True}


def admin_canjear(h, body):
    codigo = (body.get("codigo") or "").strip().upper()
    if codigo and not codigo.startswith("CN-"):
        codigo = "CN-" + codigo
    with db() as con:
        r = con.execute("select r.*, s.nombre as socio_nombre from recompensas r "
                        "join socios s on s.id = r.socio_id where r.codigo = ?", (codigo,)).fetchone()
        if not r:
            return 404, {"error": "Código no encontrado."}
        if r["estado"] == "canjeada":
            return 409, {"error": f"Ya se canjeó el {r['canjeada_at'][:16].replace('T', ' ')}."}
        if r["vence_at"] < iso():
            return 410, {"error": "El código venció."}
        con.execute("update recompensas set estado = 'canjeada', canjeada_at = ? where id = ?", (iso(), r["id"]))
        return 200, {"ok": True, "nombre": r["nombre"], "socio": r["socio_nombre"]}


def admin_socios_csv(h, q):
    with db() as con:
        rows = con.execute("select s.nombre, s.telefono, s.creado_at, s.acepta_whatsapp, "
                           "(select count(*) from visitas v where v.socio_id = s.id) visitas, "
                           "(select max(dia) from visitas v where v.socio_id = s.id) ultima_visita "
                           "from socios s order by s.creado_at").fetchall()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["nombre", "telefono", "alta", "acepta_whatsapp", "visitas", "ultima_visita"])
    for r in rows:
        w.writerow(list(r))
    return 200, buf.getvalue()


# ── Servidor ────────────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    server_version = "ClubCisne/1.0"

    def log_message(self, fmt, *args):  # sin datos personales en logs
        pass

    def ip(self):
        return self.headers.get("X-Real-IP") or self.client_address[0]

    def token(self):
        auth = self.headers.get("Authorization", "")
        return auth[7:] if auth.startswith("Bearer ") else ""

    def socio_id(self):
        tok = self.token()
        if not tok:
            return None
        with db() as con:
            limite = iso(ahora() - timedelta(days=SESION_DIAS))
            con.execute("delete from sesiones where creado_at < ?", (limite,))
            r = con.execute("select socio_id from sesiones where token = ?", (tok,)).fetchone()
            return r["socio_id"] if r else None

    def responder(self, status, data):
        if isinstance(data, str):
            payload, ctype = data.encode("utf-8-sig"), "text/csv; charset=utf-8"
        else:
            payload, ctype = json.dumps(data, ensure_ascii=False).encode(), "application/json; charset=utf-8"
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > 20_000:
            return None
        try:
            return json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            return None

    def do_GET(self):
        url = urlparse(self.path)
        q = parse_qs(url.query)
        try:
            if url.path == "/api/salud":
                return self.responder(200, {"ok": True})
            if url.path == "/api/yo":
                sid = self.socio_id()
                return self.responder(*(api_yo(self, {}, sid) if sid else (401, {"error": "Sesión vencida"})))
            if url.path == "/api/admin/resumen":
                return self.responder(*admin_resumen(self, q))
            if url.path == "/api/admin/nps":
                return self.responder(*admin_nps(self, q))
            if url.path == "/api/admin/socios.csv":
                return self.responder(*admin_socios_csv(self, q))
            self.responder(404, {"error": "No encontrado"})
        except Exception:  # noqa: BLE001 — nunca exponer trazas
            self.responder(500, {"error": "Error interno"})

    def do_POST(self):
        path = urlparse(self.path).path
        body = self.body()
        if body is None:
            return self.responder(400, {"error": "JSON inválido"})
        publicas = {"/api/registro": api_registro, "/api/login": api_login}
        privadas = {"/api/checkin": api_checkin, "/api/nps": api_nps,
                    "/api/resena-click": api_click_resena, "/api/logout": api_logout}
        try:
            if path in publicas:
                return self.responder(*publicas[path](self, body))
            if path in privadas:
                sid = self.socio_id()
                if not sid:
                    return self.responder(401, {"error": "Sesión vencida. Vuelve a entrar."})
                return self.responder(*privadas[path](self, body, sid))
            if path == "/api/admin/canjear":
                return self.responder(*admin_canjear(self, body))
            m = re.fullmatch(r"/api/admin/nps/(\d+)", path)
            if m:
                return self.responder(*admin_nps_update(self, body, int(m.group(1))))
            self.responder(404, {"error": "No encontrado"})
        except Exception:  # noqa: BLE001
            self.responder(500, {"error": "Error interno"})


def main():
    init_db()
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Club Cisne Negro escuchando en 127.0.0.1:{PORT} (db={DB_PATH})", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
