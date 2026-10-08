"""Prueba de humo del modo mesero: pedidos por QR, cuentas por mesa, roles, historial, cortes y cierre.

Uso: python3 backend/test_equipo.py   (base temporal; no toca ninguna base real)
"""
import http.cookiejar
import json
import os
import sqlite3
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
MENU = os.path.join(AQUI, "..", "sitio", "data", "menu.json")
PEDIDO_JS = os.path.join(AQUI, "..", "sitio", "assets", "js", "pedido.js")
PORT = "8798"
BASE = f"http://127.0.0.1:{PORT}"


class Cliente:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def call(self, method, path, data=None):
        req = urllib.request.Request(BASE + path, method=method, data=json.dumps(data).encode() if data is not None else None,
                                     headers={"Content-Type": "application/json"})
        try:
            with self.op.open(req) as r:
                t = r.read().decode("utf-8-sig")
                return r.status, (json.loads(t) if "json" in r.headers["Content-Type"] else t)
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")


def total_js(lineas):
    """Total según sitio/assets/js/pedido.js (mismo cálculo que ve el cliente)."""
    js = f"""
const P = require({json.dumps(PEDIDO_JS)}); const menu = require({json.dumps(MENU)});
let p = null; for (const l of {json.dumps(lineas)}) p = P.agregar(p, l, menu, Date.now());
console.log(P.total(p));"""
    return float(subprocess.run(["node", "-e", js], capture_output=True, text=True, check=True).stdout.strip())


def main():
    tmp = tempfile.mkdtemp()
    dbp = os.path.join(tmp, "e.db")
    env = {**os.environ, "CLUB_DB": dbp, "CLUB_SECRET": "t", "CLUB_PORT": PORT, "CLUB_COOKIE_SECURE": "0", "CLUB_MENU": MENU}
    srv_py = os.path.join(AQUI, "club_server.py")

    def staff(u, n, r, pin):
        return json.loads(subprocess.run([sys.executable, srv_py, "crear-staff", u, n, r, pin], env=env,
                                         capture_output=True, text=True, check=True).stdout)

    staff("admin.demo", "Admin Demo", "admin", "111111")
    staff("luis.demo", "Luis Demo", "mesero", "222222")
    staff("ana.demo", "Ana Demo", "mesero", "333333")
    srv = subprocess.Popen([sys.executable, srv_py], env=env)
    ok = 0
    try:
        cli, luis, ana, admin = Cliente(), Cliente(), Cliente(), Cliente()
        for _ in range(50):
            try:
                cli.call("GET", "/api/salud"); break
            except Exception:
                time.sleep(0.1)

        def check(c, m):
            nonlocal ok
            assert c, m
            ok += 1

        def sql(q, *p):
            c = sqlite3.connect(dbp); c.execute(q, p); c.commit(); c.close()

        sys.path.insert(0, AQUI)
        import club_server as cs
        check(cs.dia_operativo("2026-10-07T00:40:00-06:00") == "2026-10-06", "00:40 pertenece al día operativo anterior")
        check(cs.dia_operativo("2026-10-07T05:10:00-06:00") == "2026-10-07", "05:10 ya es el día nuevo")

        # ── Pedido del cliente (QR) ──
        lineas = [{"tipo": "barril", "id": "alarma", "variante": "12 oz", "cantidad": 2, "precio": 1},
                  {"tipo": "comida", "id": "chips-camote", "variante": "110g", "nota": "Salsa aparte"},
                  {"tipo": "vuelo", "cervezas": ["alarma", "henry-ix", "a-poco-si-pa", "agua-puerca"]}]
        for malo, msg in (([], "vacío"), ([{"tipo": "x", "id": "a"}], "tipo"), ([{"tipo": "barril", "id": "alarma", "variante": "99 oz"}], "medida"),
                          ([{"tipo": "lata", "id": "no-existe"}], "inexistente"), ([{"tipo": "barril", "id": "alarma", "variante": "12 oz", "cantidad": 21}], "cantidad")):
            s, _ = cli.call("POST", "/api/pedidos", {"lineas": malo})
            check(s == 400, f"rechaza pedido inválido ({msg})")
        s, r = cli.call("POST", "/api/pedidos", {"lineas": lineas, "mesa": ""})
        check(s == 201 and r["total"] == 475 and len(r["codigo"]) == 8, "pedido creado con precios del servidor ($475)")
        check(r["total"] == total_js([{k: v for k, v in l.items() if k != "precio"} for l in lineas]), "el servidor y pedido.js calculan el mismo total")
        cod = r["codigo"]
        s, r = cli.call("GET", f"/api/pedidos/{cod.lower()}/estado")
        check(s == 200 and r["estado"] == "pendiente", "estado pendiente (código insensible a mayúsculas)")

        # ── Login del equipo ──
        s, _ = luis.call("GET", "/api/equipo/yo")
        check(s == 401, "sin sesión del equipo → 401")
        s, _ = luis.call("POST", "/api/equipo/login", {"usuario": "luis.demo", "pin": "000000"})
        check(s == 401, "PIN incorrecto")
        s, r = luis.call("POST", "/api/equipo/login", {"usuario": "luis.demo", "pin": "222222"})
        check(s == 200 and r["staff"]["rol"] == "mesero", "login de mesero")
        galleta = [c for c in luis.jar if c.name == "cn_equipo"]
        check(galleta and galleta[0].path == "/api", "cookie del equipo separada (cn_equipo)")
        ana.call("POST", "/api/equipo/login", {"usuario": "ana.demo", "pin": "333333"})
        s, r = admin.call("POST", "/api/equipo/login", {"usuario": "admin.demo", "pin": "111111"})
        check(r["staff"]["rol"] == "admin", "login de admin")
        intruso = Cliente()
        for _ in range(5):
            intruso.call("POST", "/api/equipo/login", {"usuario": "ana.demo", "pin": "999999"})
        s, _ = intruso.call("POST", "/api/equipo/login", {"usuario": "ana.demo", "pin": "333333"})
        check(s == 429, "5 intentos fallidos bloquean el usuario")
        cs._bloqueos.clear()  # (el bloqueo vive en el proceso del servidor; aquí solo se comprueba el 429)

        # ── Escanear y tomar ──
        s, r = luis.call("GET", f"/api/equipo/pedidos/{cod}")
        check(s == 200 and r["pedido"]["lineas"][1]["nota"] == "Salsa aparte" and r["pedido"]["socio"] is None, "el mesero ve el pedido escaneado")
        s, _ = luis.call("POST", f"/api/equipo/pedidos/{cod}/tomar", {})
        check(s == 400, "tomar exige mesa si el cliente no la puso")
        s, r = luis.call("POST", f"/api/equipo/pedidos/{cod}/tomar", {"mesa": "7"})
        check(s == 200 and r["cuenta"]["mesa"] == "7" and r["cuenta"]["total"] == 475, "pedido tomado → cuenta de la mesa 7")
        cuenta7 = r["cuenta"]["id"]
        s, r = cli.call("GET", f"/api/pedidos/{cod}/estado")
        check(r["estado"] == "tomado" and r["mesero"] == "Luis", "el cliente ve «tomado por Luis»")
        s, _ = ana.call("POST", f"/api/equipo/pedidos/{cod}/tomar", {"mesa": "7"})
        check(s == 409, "no se toma dos veces")
        _, r2 = cli.call("POST", "/api/pedidos", {"lineas": [{"tipo": "lata", "id": "lata-loba-negra"}], "mesa": "7"})
        s, r = luis.call("POST", f"/api/equipo/pedidos/{r2['codigo']}/tomar", {})
        check(s == 200 and r["cuenta"]["id"] == cuenta7 and r["cuenta"]["rondas"] == 2 and r["cuenta"]["total"] == 585,
              "segunda ronda en la misma cuenta por mesa ($475 + $110)")
        _, r3 = cli.call("POST", "/api/pedidos", {"lineas": [{"tipo": "bebida", "id": "bebida-refresco"}], "mesa": "9"})
        sql("update pedidos set expira_at = '2020-01-01T00:00:00-06:00' where codigo = ?", r3["codigo"])
        s, _ = luis.call("POST", f"/api/equipo/pedidos/{r3['codigo']}/tomar", {})
        check(s == 410, "pedido caducado no se toma")
        s, r = luis.call("POST", "/api/equipo/pedidos/importar", {"datos": {"mesa": "3", "lineas": [{"tipo": "lata", "id": "lata-loba-negra", "precio": 1}]}})
        check(s == 201 and r["pedido"]["origen"] == "offline" and r["pedido"]["total"] == 110, "pedido sin internet importado con precio del servidor")
        imp = r["pedido"]["codigo"]
        datos_imp = {"mesa": "3", "lineas": [{"tipo": "lata", "id": "lata-loba-negra", "precio": 1}]}
        s, r = ana.call("POST", "/api/equipo/pedidos/importar", {"datos": datos_imp})
        check(s == 200 and r.get("repetido") and r["pedido"]["codigo"] == imp, "el mismo QR sin internet no se duplica")
        s, r = luis.call("POST", "/api/equipo/pedidos/importar", {"datos": {**datos_imp, "t": "k1x9"}})
        check(s == 201 and r["pedido"]["codigo"] != imp, "otra ronda idéntica (otra marca t) sí es un pedido nuevo")
        luis.call("POST", f"/api/equipo/pedidos/{r['pedido']['codigo']}/cancelar", {"motivo": "prueba"})
        s, r = ana.call("POST", f"/api/equipo/pedidos/{imp}/tomar", {})
        cuenta3 = r["cuenta"]["id"]

        # ── Ajustes (sin cambiar precios) ──
        s, r = luis.call("GET", f"/api/equipo/cuentas/{cuenta7}")
        ped1 = r["cuenta"]["pedidos"][0]["id"]
        s, r = luis.call("POST", f"/api/equipo/cuentas/{cuenta7}/linea", {"pedido_id": ped1, "indice": 0, "cantidad": 1, "precio": 1})
        check(s == 200 and r["cuenta"]["total"] == 485 and r["cuenta"]["pedidos"][0]["lineas"][0]["precio"] == 100,
              "ajustar cantidad recalcula y no cambia precios ($485)")
        s, _ = ana.call("GET", f"/api/equipo/cuentas/{cuenta7}")
        check(s == 404, "otro mesero no ve la cuenta ajena")
        s, _ = luis.call("POST", f"/api/equipo/cuentas/{cuenta7}/linea", {"pedido_id": ped1, "indice": 9, "cantidad": 1})
        check(s == 400, "índice inválido")

        # ── Cerrar cuenta ──
        for pagos, prop, msg in (([{"metodo": "efectivo", "monto": 100}], 0, "no cuadra"), ([{"metodo": "bitcoin", "monto": 485}], 0, "método"),
                                 ([], 0, "sin pagos")):
            s, _ = luis.call("POST", f"/api/equipo/cuentas/{cuenta7}/cerrar", {"pagos": pagos, "propina": prop})
            check(s == 400, f"cierre rechazado ({msg})")
        s, r = luis.call("POST", f"/api/equipo/cuentas/{cuenta7}/cerrar",
                         {"pagos": [{"metodo": "efectivo", "monto": 300}, {"metodo": "tarjeta_debito", "monto": 235.5}], "propina": 50.5})
        check(s == 200 and r["cuenta"]["estado"] == "cerrada" and r["cuenta"]["propina"] == 50.5, "cuenta cerrada con pago mixto y propina")
        s, _ = luis.call("POST", f"/api/equipo/cuentas/{cuenta7}/linea", {"pedido_id": ped1, "indice": 0, "cantidad": 2})
        check(s == 409, "no se edita una cuenta cerrada")
        s, _ = ana.call("POST", f"/api/equipo/cuentas/{cuenta3}/cancelar", {})
        check(s == 400, "cancelar exige motivo")

        # ── Corte del mesero ──
        s, r = ana.call("POST", "/api/equipo/corte", {})
        check(s == 409 and len(r["abiertas"]) == 1, "corte bloqueado con cuentas abiertas")
        s, r = ana.call("GET", "/api/equipo/companeros")
        luis_id = next(x["id"] for x in r["staff"] if x["nombre"] == "Luis Demo")
        s, _ = ana.call("POST", f"/api/equipo/cuentas/{cuenta3}/transferir", {"staff_id": luis_id})
        check(s == 200, "transferir cuenta a otro mesero")
        s, r = ana.call("POST", "/api/equipo/corte", {})
        check(s == 201 and r["corte"]["resumen"]["cuentas"] == 0, "corte de Ana (sin cuentas propias)")
        s, _ = ana.call("POST", "/api/equipo/corte", {})
        check(s == 409, "un corte por día")
        s, r = admin.call("GET", "/api/equipo/cierre")
        check(any(m["nombre"] == "Ana Demo" and m["corte"] for m in r["por_mesero"]), "el cierre lista a quien hizo un corte vacío")
        s, r = admin.call("GET", "/api/equipo/cierre?dia=2020-01-01")
        check(s == 200 and r["pedidos_pendientes"] == 0, "pedidos pendientes contados por día")
        s, r = luis.call("POST", "/api/equipo/corte", {})
        check(s == 409, "Luis no corta con la cuenta transferida abierta")
        luis.call("POST", f"/api/equipo/cuentas/{cuenta3}/cerrar", {"pagos": [{"metodo": "tarjeta_credito", "monto": 110}]})

        # ── Historial ──
        s, r = luis.call("GET", "/api/equipo/historial?rango=hoy")
        ind = r["indicadores"]
        check(s == 200 and ind["cuentas"] == 2 and ind["total"] == 595 and ind["propinas"] == 50.5
              and ind["por_metodo"]["efectivo"] == 300 and ind["por_metodo"]["tarjeta_credito"] == 110, "indicadores del día de Luis")
        check(any(p["producto"].startswith("¡Alarma!") for p in ind["top_productos"]), "productos más pedidos")
        s, r = ana.call("GET", "/api/equipo/historial?rango=mes")
        check(r["indicadores"]["cuentas"] == 0, "el mesero solo ve lo suyo")
        s, r = admin.call("GET", "/api/equipo/historial?rango=semana&metodo=tarjeta_credito")
        check(r["total_cuentas"] == 1, "admin filtra por forma de pago")
        hoy = cs.dia_operativo()
        s, r = admin.call("GET", f"/api/equipo/historial?desde={hoy}T00:00&hasta={hoy}T23:59&estado=todas&mesa=7")
        check(s == 200 and r["total_cuentas"] == 1, "intervalo por fecha y hora + mesa")
        s, _ = admin.call("GET", "/api/equipo/historial?desde=ayer-no")
        check(s == 400, "fechas inválidas")
        s, csvt = admin.call("GET", "/api/equipo/historial.csv?rango=hoy")
        check(s == 200 and "tarjeta_debito" in csvt and "Luis Demo" in csvt, "exportar CSV")

        # ── Corte de Luis y cierre del día ──
        s, r = luis.call("POST", "/api/equipo/corte", {})
        check(s == 201 and r["corte"]["resumen"]["total"] == 595, "corte de Luis")
        s, _ = luis.call("POST", f"/api/equipo/cuentas/{cuenta3}/cancelar", {"motivo": "x"})
        check(s == 409, "cuentas del corte quedan bloqueadas")
        s, _ = luis.call("GET", "/api/equipo/cierre")
        check(s == 403, "el mesero no hace cierre del día")
        _, rr = cli.call("POST", "/api/pedidos", {"lineas": [{"tipo": "lata", "id": "lata-loba-negra"}], "mesa": "4"})
        mesero3 = Cliente(); admin.call("POST", "/api/equipo/staff", {"nombre": "Pepe Demo", "usuario": "pepe.demo", "rol": "mesero", "pin": "444444"})
        mesero3.call("POST", "/api/equipo/login", {"usuario": "pepe.demo", "pin": "444444"})
        mesero3.call("POST", f"/api/equipo/pedidos/{rr['codigo']}/tomar", {})
        s, r = admin.call("POST", "/api/equipo/cierre", {})
        check(s == 409 and "Pepe Demo" in r["sin_corte"], "cierre bloqueado: falta un corte y hay cuenta abierta")
        s, _ = admin.call("POST", "/api/equipo/cierre", {"forzar": True})
        check(s == 409, "forzar exige motivo")
        s, r = admin.call("POST", "/api/equipo/cierre", {"forzar": True, "motivo": "Prueba: Pepe se fue sin corte"})
        check(s == 201 and r["cierre"]["forzado"] == 1 and r["indicadores"]["total"] == 595, "cierre forzado con motivo")
        s, _ = admin.call("POST", "/api/equipo/cierre", {"forzar": True, "motivo": "otra vez"})
        check(s == 409, "no se cierra dos veces")
        s, _ = admin.call("POST", "/api/equipo/cierre/reabrir", {})
        check(s == 400, "reabrir exige motivo")
        s, r = admin.call("POST", "/api/equipo/cierre/reabrir", {"motivo": "Corrección"})
        check(s == 200 and r["cierre"]["reabierto_at"], "reapertura registrada")

        # ── Cuentas del equipo ──
        s, _ = luis.call("GET", "/api/equipo/staff")
        check(s == 403, "el mesero no gestiona cuentas")
        s, r = admin.call("POST", "/api/equipo/staff", {"nombre": "Otro", "usuario": "luis.demo", "rol": "mesero"})
        check(s == 400, "usuario duplicado")
        s, r = admin.call("POST", "/api/equipo/staff", {"nombre": "Nuevo Demo", "usuario": "nuevo.demo", "rol": "mesero"})
        check(s == 201 and len(r["pin"]) == 6, "alta con PIN generado")
        s, r = admin.call("GET", "/api/equipo/staff")
        pepe = next(x for x in r["staff"] if x["usuario"] == "pepe.demo")
        s, _ = admin.call("PUT", f"/api/equipo/staff/{pepe['id']}", {"activo": False})
        s2, _ = mesero3.call("GET", "/api/equipo/yo")
        check(s == 200 and s2 == 401, "desactivar corta la sesión")
        s, r = admin.call("GET", "/api/equipo/yo")
        s, _ = admin.call("PUT", f"/api/equipo/staff/{r['staff']['id']}", {"activo": False})
        check(s == 400, "el admin no se desactiva a sí mismo")
        s, _ = luis.call("POST", "/api/equipo/logout", {})
        check(s == 200 and luis.call("GET", "/api/equipo/yo")[0] == 401, "logout del equipo")
        print(f"OK — {ok} verificaciones")
    finally:
        srv.terminate()


if __name__ == "__main__":
    main()
