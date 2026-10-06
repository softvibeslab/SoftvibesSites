"""Prueba de humo del club: levanta el servidor con una DB temporal y recorre el flujo completo.

Uso: python3 backend/test_club.py
"""
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
PORT = "8799"
BASE = f"http://127.0.0.1:{PORT}"


def call(method, path, data=None, token=None):
    req = urllib.request.Request(BASE + path, method=method,
                                 data=json.dumps(data).encode() if data is not None else None,
                                 headers={"Content-Type": "application/json",
                                          **({"Authorization": f"Bearer {token}"} if token else {})})
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read().decode("utf-8-sig")
            return r.status, (json.loads(body) if "json" in r.headers["Content-Type"] else body)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def main():
    tmp = tempfile.mkdtemp()
    env = {**os.environ, "CLUB_DB": os.path.join(tmp, "t.db"), "CLUB_SECRET": "test", "CLUB_PORT": PORT}
    srv = subprocess.Popen([sys.executable, os.path.join(AQUI, "club_server.py")], env=env)
    ok = 0
    try:
        for _ in range(50):
            try:
                call("GET", "/api/salud")
                break
            except Exception:
                time.sleep(0.1)
        sys.path.insert(0, AQUI)
        os.environ["CLUB_SECRET"] = "test"
        import club_server
        club_server.SECRET = "test"
        codigo = club_server.codigo_del_dia()

        def check(cond, msg):
            nonlocal ok
            assert cond, msg
            ok += 1

        s, r = call("POST", "/api/registro", {"nombre": "Ana", "telefono": "771 123 0000", "pin": "1234"})
        check(s == 400, "rechaza registro sin aviso de privacidad")
        s, r = call("POST", "/api/registro", {"nombre": "Ana", "telefono": "+52 771 123 0000", "pin": "1234",
                                              "acepta_privacidad": True})
        check(s == 201 and r["token"], "registro")
        tok = r["token"]
        s, _ = call("POST", "/api/registro", {"nombre": "Ana", "telefono": "7711230000", "pin": "1234",
                                              "acepta_privacidad": True})
        check(s == 409, "teléfono duplicado")
        s, _ = call("POST", "/api/login", {"telefono": "7711230000", "pin": "9999"})
        check(s == 401, "PIN incorrecto")
        s, r = call("POST", "/api/login", {"telefono": "7711230000", "pin": "1234"})
        check(s == 200, "login")
        s, _ = call("POST", "/api/checkin", {"codigo": "0000" if codigo != "0000" else "1111"}, tok)
        check(s == 400, "código del día incorrecto")
        s, r = call("POST", "/api/checkin", {"codigo": codigo}, tok)
        check(s == 201 and r["socio"]["visitas"] == 1 and r["recompensa"] is None, "primer check-in")
        visita = r["visita_id"]
        s, r = call("POST", "/api/checkin", {"codigo": codigo}, tok)
        check(s == 200 and r["ya_registrada"], "una visita por día")
        s, r = call("POST", "/api/nps", {"visita_id": visita, "score": 10, "comentario": "¡Increíble!"}, tok)
        check(s == 201 and r["invitar_resena"] and r["resena_url"], "NPS promotor invita a reseña")
        s, r = call("POST", "/api/nps", {"visita_id": visita, "score": 3}, tok)
        check(s == 200 and r["ya_respondida"], "un NPS por visita")

        # Simula 4 visitas más en días anteriores para llegar a la 5ª con recompensa
        import sqlite3
        con = sqlite3.connect(env["CLUB_DB"])
        con.execute("update visitas set dia = '2020-01-01'")
        for d in ("2020-01-02", "2020-01-03", "2020-01-04"):
            con.execute("insert into visitas (socio_id, dia, creado_at) values (1, ?, ?)", (d, d))
        con.commit()
        con.close()
        s, r = call("POST", "/api/checkin", {"codigo": codigo}, tok)
        check(s == 201 and r["socio"]["visitas"] == 5 and r["recompensa"]
              and "4 oz" in r["recompensa"]["nombre"], "recompensa en la 5ª visita")
        cupon = r["recompensa"]["codigo"]
        s, r = call("POST", "/api/nps", {"visita_id": r["visita_id"], "score": 4, "comentario": "Tardaron"}, tok)
        check(s == 201 and not r["invitar_resena"], "detractor no se invita a reseña")
        s, r = call("GET", "/api/yo", token=tok)
        check(s == 200 and len(r["socio"]["recompensas"]) == 1, "recompensa visible en el pasaporte")
        s, r = call("POST", "/api/admin/canjear", {"codigo": cupon[3:]})
        check(s == 200 and r["socio"] == "Ana", "canje por el personal")
        s, _ = call("POST", "/api/admin/canjear", {"codigo": cupon})
        check(s == 409, "no se canjea dos veces")
        s, r = call("GET", "/api/admin/resumen")
        check(s == 200 and r["nps"]["respuestas"] == 2 and r["nps"]["score"] == 0 and r["por_recuperar"] == 1,
              "resumen NPS (1 promotor + 1 detractor = 0)")
        s, r = call("GET", "/api/admin/nps?filtro=pendientes")
        check(s == 200 and len(r["respuestas"]) == 1, "detractores pendientes")
        s, _ = call("POST", f"/api/admin/nps/{r['respuestas'][0]['id']}", {"seguimiento": "contactado"})
        check(s == 200, "seguimiento de detractor")
        s, csv_txt = call("GET", "/api/admin/socios.csv")
        check(s == 200 and "7711230000" in csv_txt, "export CSV")
        s, _ = call("GET", "/api/yo", token="falso")
        check(s == 401, "token inválido")
        s, _ = call("GET", "/api/admin/resumen?dias=abc")
        check(s == 200, "dias no numérico no rompe el resumen")
        s, _ = call("POST", "/api/admin/nps/99999", {"seguimiento": "resuelto"})
        check(s == 404, "seguimiento de NPS inexistente")
        s, _ = call("POST", "/api/resena-click", {"visita_id": 99999}, tok)
        check(s == 404, "clic a reseña con visita ajena o inexistente")
        call("POST", "/api/resena-click", {"visita_id": visita}, tok)
        call("POST", "/api/resena-click", {"visita_id": visita}, tok)
        s, r = call("GET", "/api/admin/resumen")
        check(r["clicks_resena"] == 1, "un clic a reseña por visita")
        for i in range(12):  # wifi compartido del bar: varios registros desde la misma IP
            s, _ = call("POST", "/api/registro", {"nombre": f"Cliente {i}", "telefono": f"77100000{i:02d}",
                                                  "pin": "4321", "acepta_privacidad": True})
        check(s == 201, "12 registros seguidos desde la misma IP")
        con = sqlite3.connect(env["CLUB_DB"])
        con.execute("update sesiones set creado_at = '2020-01-01T00:00:00-06:00' where token = ?", (tok,))
        con.commit()
        con.close()
        s, _ = call("GET", "/api/yo", token=tok)
        check(s == 401, "sesión vencida tras 180 días")
        print(f"OK — {ok} verificaciones")
    finally:
        srv.terminate()


if __name__ == "__main__":
    main()
