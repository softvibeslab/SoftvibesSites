#!/usr/bin/env python3
"""Despliega un sitio estático vía el servidor MCP de Hostinger (JSON-RPC sobre stdio)."""
import json, os, subprocess, sys, threading, queue

DOMAIN = sys.argv[1] if len(sys.argv) > 1 else 'darkgreen-sparrow-923810.hostingersite.com'
ARCHIVE = sys.argv[2] if len(sys.argv) > 2 else '/tmp/vivemar-deploy.zip'
TOKEN = os.environ['HOSTINGER_API_TOKEN']

proc = subprocess.Popen(
    ['npx', '--package=hostinger-api-mcp@latest', 'hostinger-hosting-mcp'],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
    env={**os.environ, 'HOSTINGER_API_TOKEN': TOKEN}, text=True,
)

lineas = queue.Queue()
threading.Thread(target=lambda: [lineas.put(l) for l in proc.stdout], daemon=True).start()

def enviar(msg):
    proc.stdin.write(json.dumps(msg) + '\n')
    proc.stdin.flush()

def esperar(id_esperado, timeout=600):
    import time
    fin = time.time() + timeout
    while time.time() < fin:
        try:
            linea = lineas.get(timeout=5)
        except queue.Empty:
            continue
        linea = linea.strip()
        if not linea.startswith('{'):
            continue
        try:
            m = json.loads(linea)
        except json.JSONDecodeError:
            continue
        if m.get('id') == id_esperado:
            return m
    raise TimeoutError(f'sin respuesta para id={id_esperado}')

enviar({'jsonrpc': '2.0', 'id': 1, 'method': 'initialize', 'params': {
    'protocolVersion': '2024-11-05', 'capabilities': {},
    'clientInfo': {'name': 'softvibes-deploy', 'version': '1.0'}}})
init = esperar(1, 60)
print('MCP inicializado:', init['result']['serverInfo'])

enviar({'jsonrpc': '2.0', 'method': 'notifications/initialized'})

print(f'Desplegando {ARCHIVE} → {DOMAIN} ...')
enviar({'jsonrpc': '2.0', 'id': 2, 'method': 'tools/call', 'params': {
    'name': 'hosting_deployStaticWebsite',
    'arguments': {'domain': DOMAIN, 'archivePath': ARCHIVE, 'removeArchive': False}}})
resp = esperar(2, 600)
proc.terminate()

if 'error' in resp:
    print('ERROR:', json.dumps(resp['error'], indent=2)[:2000])
    sys.exit(1)
contenido = resp.get('result', {}).get('content', [])
for c in contenido:
    if c.get('type') == 'text':
        print(c['text'][:3000])
print('¿isError?:', resp.get('result', {}).get('isError', False))

# --- Post-deploy: purgar caché de Hostinger y OPcache de PHP ---
import time
import urllib.request

USUARIO_HOSTING = 'u641670749'
LLAVE_OPCACHE = 'eac1047f8fc22e640e477459778e23e70dbe877b53bb3946ded88e0cc3e1bc54'

time.sleep(8)  # dar tiempo a que la extracción del zip termine

try:
    req = urllib.request.Request(
        f'https://developers.hostinger.com/api/hosting/v1/accounts/{USUARIO_HOSTING}/websites/{DOMAIN}/cache/clear',
        method='POST',
        headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'},
        data=b'{}',
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        print('Caché Hostinger purgada:', r.status)
except Exception as e:
    print('Aviso: purga de caché Hostinger falló (no crítico):', e)

for intento in range(4):
    try:
        with urllib.request.urlopen(
            f'https://{DOMAIN}/admin/opcache-reset.php?llave={LLAVE_OPCACHE}', timeout=30
        ) as r:
            print('OPcache PHP reseteado:', r.read().decode()[:200])
            break
    except Exception as e:
        if intento == 3:
            print('Aviso: reset de OPcache falló:', e)
        time.sleep(6)
