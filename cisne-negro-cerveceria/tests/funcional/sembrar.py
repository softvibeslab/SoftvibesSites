"""Siembra una base desechable con historial realista para la batería funcional. Solo QA local.

Uso: python3 tests/funcional/sembrar.py <ruta/a/dev-PUERTO.db>
"""
import os, random, sys, sqlite3
from datetime import date, timedelta
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'backend'))
import club_server as cs
if len(sys.argv) < 2 or not os.path.basename(sys.argv[1]).startswith('dev-'):
    sys.exit('Indica la base desechable: tests/funcional/sembrar.py backend/dev-PUERTO.db')
cs.DB_PATH = sys.argv[1]
cs.SECRET = 'dev'
cs.init_db()
random.seed(7)
nombres = ["Ana María Ruiz", "Luis Hernández", "Carla Pérez", "Jorge Téllez", "Mariana Soto", "Iván Cruz",
           "Paola Ávila", "Ricardo Núñez", "Fernanda Ortiz", "Diego Mendoza", "Sofía Ramírez", "Héctor Lara",
           "Valeria Gómez", "Emilio Reyes"]
hoy = cs.ahora().date()
with cs.db() as con:
    for k, nombre in enumerate(nombres):
        tel = f"77110{k:05d}"
        alta = hoy - timedelta(days=random.randint(20, 170))
        cur = con.execute("insert into socios (nombre, telefono, pin_hash, acepta_privacidad_at, acepta_whatsapp, creado_at, mostrar_ranking)"
                          " values (?, ?, ?, ?, ?, ?, 1)", (nombre, tel, cs.hash_pin(tel, '1111'), alta.isoformat() + 'T19:00:00-06:00',
                          random.random() < .6, alta.isoformat() + 'T19:00:00-06:00'))
        sid = cur.lastrowid
        # Días abiertos (mar–dom) entre el alta y ayer; los primeros 6 socios vienen también este mes.
        dias = [alta + timedelta(days=i) for i in range((hoy - alta).days) if (alta + timedelta(days=i)).weekday() != 0]
        n = random.randint(1, min(14, len(dias)))
        elegidos = sorted(random.sample(dias, n))
        if k < 6:
            elegidos += [d for d in [date(hoy.year, hoy.month, 1) + timedelta(days=j) for j in range(5)] if d < hoy and d.weekday() != 0][: (6 - k) // 2 + 1]
        for d in sorted(set(elegidos)):
            vid, nueva, rec = cs.registrar_visita(con, sid, origen='menu', dia=d.isoformat())
            if random.random() < .65:
                score = random.choice([10, 10, 9, 9, 9, 8, 8, 7, 6, 5, 3, 10, 9])
                con.execute("insert into nps (socio_id, visita_id, score, comentario, creado_at) values (?, ?, ?, ?, ?)",
                            (sid, vid, score, random.choice(["", "La Red IPA, buenísima", "Tardaron en servir", "Muy buen ambiente", ""]),
                             d.isoformat() + 'T21:00:00-06:00'))
                if score >= 7 and random.random() < .4:
                    con.execute("insert into clicks_resena (socio_id, visita_id, creado_at) values (?, ?, ?)", (sid, vid, d.isoformat() + 'T21:05:00-06:00'))
        for r in con.execute("select id from recompensas where socio_id = ?", (sid,)).fetchall():
            if random.random() < .5:
                con.execute("update recompensas set estado='canjeada', canjeada_at=? where id=?", (cs.iso(), r[0]))
    print(con.execute("select count(*) from socios").fetchone()[0], 'socios,', con.execute("select count(*) from visitas").fetchone()[0], 'visitas,',
          con.execute("select count(*) from nps").fetchone()[0], 'nps')
