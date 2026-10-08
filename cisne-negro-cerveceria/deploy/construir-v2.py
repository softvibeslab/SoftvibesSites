"""Construye la versión de sitio/ que se sirve bajo un prefijo (por defecto /v2).

El sitio usa rutas absolutas (/assets/, /api/, /menu/…). Este script copia sitio/ a una carpeta
de salida y reescribe esas rutas a /v2/…, en HTML, JS, CSS y el manifest. Al final verifica que no
quede ninguna ruta raíz sin prefijo ni ninguna duplicada (/v2/v2).

Uso: python3 deploy/construir-v2.py <salida> [prefijo=/v2]
"""
import pathlib
import re
import shutil
import sys

RAIZ = pathlib.Path(__file__).resolve().parents[1]
SITIO = RAIZ / "sitio"
SALIDA = pathlib.Path(sys.argv[1]).resolve()
PREFIJO = (sys.argv[2] if len(sys.argv) > 2 else "/v2").rstrip("/")
EXCLUIR = {"qa", "experiencia", "DESIGN.md", ".DS_Store"}
SEGMENTOS = ("assets", "data", "menu", "api", "admin", "equipo", "privacidad", "proyecto", "analisis",
             "sw.js", "manifest.webmanifest", "offline.html")
SEG = "|".join(re.escape(s) for s in SEGMENTOS)
# Ruta raíz dentro de comillas, paréntesis (url()) o atributos: "/assets/…", '/api', (/assets/…), `/api…`
PATRON = re.compile(rf"""(?P<pre>["'(`])/(?P<seg>{SEG})(?=[/"'`?#)\s]|$)""")
# Enlaces a la raíz del sitio: href="/" y href="/#barril"
RAIZ_HREF = re.compile(r"""(?P<pre>(?:href|action)=["'])/(?=["'#?])""")
# Manifest y registro del service worker: scope "/" o '/'
SCOPE = re.compile(r"""(?P<pre>(?:"scope"\s*:\s*|scope\s*:\s*))(?P<q>["'])/(?P=q)""")


def reescribir(texto):
    texto = PATRON.sub(lambda m: f"{m['pre']}{PREFIJO}/{m['seg']}", texto)
    texto = RAIZ_HREF.sub(lambda m: f"{m['pre']}{PREFIJO}/", texto)
    texto = SCOPE.sub(lambda m: f"{m['pre']}{m['q']}{PREFIJO}/{m['q']}", texto)
    return texto


def main():
    if SALIDA.exists():
        shutil.rmtree(SALIDA)
    for origen in SITIO.rglob("*"):
        rel = origen.relative_to(SITIO)
        if any(p in EXCLUIR for p in rel.parts) or origen.suffix == ".py" or rel.as_posix() == "analisis/data.json":
            continue
        destino = SALIDA / rel
        if origen.is_dir():
            destino.mkdir(parents=True, exist_ok=True)
            continue
        destino.parent.mkdir(parents=True, exist_ok=True)
        if origen.suffix in (".html", ".js", ".css", ".webmanifest") and "lib" not in rel.parts:
            destino.write_text(reescribir(origen.read_text(encoding="utf-8")), encoding="utf-8")
        else:
            shutil.copy2(origen, destino)

    # Verificación: ninguna ruta raíz sin prefijo y ninguna duplicada
    problemas = []
    for f in SALIDA.rglob("*"):
        if f.suffix not in (".html", ".js", ".css", ".webmanifest") or "lib" in f.parts:
            continue
        t = f.read_text(encoding="utf-8")
        for m in PATRON.finditer(t):
            problemas.append(f"{f.relative_to(SALIDA)}: ruta sin prefijo «{t[m.start():m.end() + 12]}»")
        if f"{PREFIJO}{PREFIJO}/" in t:
            problemas.append(f"{f.relative_to(SALIDA)}: prefijo duplicado")
    if problemas:
        print("\n".join(problemas[:30]))
        sys.exit(f"Construcción con {len(problemas)} problemas")
    n = sum(1 for _ in SALIDA.rglob("*") if _.is_file())
    print(f"Construido {SALIDA} con prefijo {PREFIJO}: {n} archivos")


if __name__ == "__main__":
    main()
