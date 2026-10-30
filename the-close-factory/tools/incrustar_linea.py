"""Incrusta svg/linea.svg en index.html y resuelve los enlaces WA[origen].

Uso: python3 -I tools/incrustar_linea.py   (idempotente)
"""
import pathlib
import re
import urllib.parse

raiz = pathlib.Path(__file__).resolve().parent.parent
html_path = raiz / "index.html"
html = html_path.read_text(encoding="utf-8")
svg = (raiz / "svg" / "linea.svg").read_text(encoding="utf-8").strip()

html = re.sub(
    r"<!-- linea:inicio -->.*?<!-- linea:fin -->",
    lambda _: f"<!-- linea:inicio -->\n        {svg}\n        <!-- linea:fin -->",
    html,
    flags=re.S,
)

BASE = "Hola, quiero solicitar un diagnóstico comercial de THE CLOSE FACTORY."


def wa(match):
    texto = f"{BASE} Vengo de: {match.group(1)}."
    return "https://wa.me/529841362816?text=" + urllib.parse.quote(texto, safe="")


html = re.sub(r"WA\[([^\]]+)\]", wa, html)
html_path.write_text(html, encoding="utf-8")
print("ok", len(html), "bytes")
