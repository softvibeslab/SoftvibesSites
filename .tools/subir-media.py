#!/usr/bin/env python3
"""Sube la media cosechada y categorizada al Media Hub del CMS (idempotente por sha1)."""
import json, os, subprocess, sys

BASE = 'https://darkgreen-sparrow-923810.hostingersite.com'
MEDIA = '/tmp/vivemar-media'
JAR = '/tmp/cms-cookies-subida.txt'
USUARIO, CLAVE = 'roger', 'holamundo'
# Categorías útiles para el sitio (excluimos el archivo personal 'viridiana')
CATEGORIAS = ['propiedades', 'propiedades-corasol', 'propiedades-selva-serena',
              'propiedades-bacab', 'interiores', 'zonas', 'clientes', 'branding']

def curl(*args):
    r = subprocess.run(['curl', '-s', *args], capture_output=True, text=True, timeout=120)
    return r.stdout

# Login + CSRF
if os.path.exists(JAR):
    os.remove(JAR)
curl('-c', JAR, '-d', f'usuario={USUARIO}&clave={CLAVE}', f'{BASE}/admin/index.php', '-o', '/dev/null')
html = curl('-b', JAR, f'{BASE}/admin/copies.php')
import re
m = re.search(r'name="csrf" value="([a-f0-9]{32})"', html)
if not m:
    sys.exit('No pude obtener CSRF (¿login falló?)')
CSRF = m.group(1)

# Sha1 ya presentes en el servidor
listado = json.loads(curl('-b', JAR, '-H', f'X-CSRF: {CSRF}', '-F', 'accion=listar_media', f'{BASE}/admin/api.php'))
en_servidor = {a.get('sha1') for a in listado.get('archivos', []) if a.get('sha1')}
print(f'en servidor: {len(listado.get("archivos", []))} archivos ({len(en_servidor)} con sha1)')

manifest = json.load(open(f'{MEDIA}/manifest-unificado.json'))
pendientes = [m for m in manifest if m['categoria'] in CATEGORIAS and m['sha1'] not in en_servidor]
print(f'a subir: {len(pendientes)}')

ok = fallos = omitidos = 0
for i, item in enumerate(pendientes):
    origen = f"{MEDIA}/{item['archivo']}"
    if not os.path.exists(origen):
        continue
    nombre = f"{item['categoria']}-{item['sha1'][:10]}.jpg"
    resp = curl('-b', JAR, '-H', f'X-CSRF: {CSRF}',
                '--form-string', 'accion=importar_media',
                '--form-string', f'nombre={nombre}',
                '--form-string', f"categoria={item['categoria']}",
                '--form-string', f"caption={item.get('alt','')[:380]}",
                '--form-string', f"origen={item['fuente']}:{item['cuenta']}",
                '--form-string', f"post={item.get('post','')[:280]}",
                '--form-string', f"sha1={item['sha1']}",
                '-F', f'archivo=@{origen}',
                f'{BASE}/admin/api.php')
    try:
        j = json.loads(resp)
    except json.JSONDecodeError:
        j = {}
    if j.get('ok') and j.get('omitido'):
        omitidos += 1
    elif j.get('ok'):
        ok += 1
    else:
        fallos += 1
        if fallos <= 5:
            print(f"  fallo {item['archivo']}: {str(j.get('error', resp))[:100]}")
    if (i + 1) % 25 == 0:
        print(f'  progreso: {i+1}/{len(pendientes)} (ok={ok} omitidos={omitidos} fallos={fallos})')

print(f'\nRESULTADO: subidos={ok} · omitidos(duplicados)={omitidos} · fallos={fallos}')
