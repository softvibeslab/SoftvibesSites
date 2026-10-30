"""Genera el diorama isométrico del hero (svg/linea.svg).

Uso: python3 -I tools/gen_linea_svg.py > svg/linea.svg
El SVG se incrusta en index.html entre <!-- linea:inicio --> y <!-- linea:fin -->
con tools/incrustar_linea.py. Proyección: X = (x - y)·cos30, Y = (x + y)·sin30 - z.
"""

S = 44  # px por unidad
C, H = 0.8660254 * S, 0.5 * S


PTS = []


def p(x, y, z=0.0):
    pt = ((x - y) * C, (x + y) * H - z * S)
    PTS.append(pt)
    return pt


def poly(pts, cls):
    d = " ".join(f"{a:.1f},{b:.1f}" for a, b in pts)
    return f'<polygon class="{cls}" points="{d}"/>'


def caja(x0, y0, z0, x1, y1, z1, tono):
    """Tres caras visibles: superior, frente x1 y frente y1."""
    top = [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)]
    fx = [p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1)]
    fy = [p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)]
    return poly(fy, f"{tono}-l") + poly(fx, f"{tono}-r") + poly(top, f"{tono}-t")


out = []

# Piso con retícula
for i in range(0, 15):
    a, b = p(i, 0), p(i, 4.4)
    out.append(f'<line class="grid" x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>')
for j in range(0, 5):
    a, b = p(0, j), p(14.5, j)
    out.append(f'<line class="grid" x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>')

# Banda transportadora
out.append(caja(0.4, 1.7, 0, 11.2, 2.5, 0.32, "belt"))
for k in range(1, 22):
    x = 0.4 + k * 0.5
    a, b = p(x, 1.7, 0.32), p(x, 2.5, 0.32)
    out.append(f'<line class="belt-rib" x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>')

# Torre (fondo-derecha) antes de las estaciones delanteras para respetar el orden
tx0, ty0, tx1, ty1, th = 11.8, 0.4, 13.8, 2.6, 5.2
out.append(caja(tx0, ty0, 0, tx1, ty1, th, "tower"))
for fila in range(9):
    z = 0.5 + fila * 0.5
    for col in range(4):
        x = tx0 + 0.25 + col * 0.45
        w = [p(x, ty1, z), p(x + 0.25, ty1, z), p(x + 0.25, ty1, z + 0.28), p(x, ty1, z + 0.28)]
        lit = "win-on" if (fila * 3 + col * 5) % 7 not in (0, 3) else "win-off"
        out.append(poly(w, lit))
    for col in range(3):
        y = ty0 + 0.25 + col * 0.65
        w = [p(tx1, y, z), p(tx1, y + 0.35, z), p(tx1, y + 0.35, z + 0.28), p(tx1, y, z + 0.28)]
        lit = "win-on dim" if (fila + col) % 3 else "win-off"
        out.append(poly(w, lit))
# Grúa
gx = 13.4
out.append(caja(gx, 1.3, th, gx + 0.18, 1.48, th + 1.6, "crane"))
a, b = p(gx - 2.2, 1.39, th + 1.5), p(gx + 0.7, 1.39, th + 1.5)
out.append(f'<line class="crane-arm" x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>')
c1, c2 = p(gx - 1.8, 1.39, th + 1.5), p(gx - 1.8, 1.39, th + 0.6)
out.append(f'<line class="crane-cable" x1="{c1[0]:.1f}" y1="{c1[1]:.1f}" x2="{c2[0]:.1f}" y2="{c2[1]:.1f}"/>')

# Estaciones (pórticos) con lámpara
estaciones = [2.2, 4.8, 7.4, 10.0]
for n, x in enumerate(estaciones, 1):
    out.append(f'<g class="station-g" data-n="{n}">')
    out.append(caja(x, 1.2, 0, x + 0.28, 1.45, 1.6, "post"))
    out.append(caja(x, 1.2, 1.6, x + 0.28, 2.8, 1.85, "beam"))
    lx, ly = p(x + 0.14, 2.0, 2.1)
    out.append(f'<circle class="lamp-halo" cx="{lx:.1f}" cy="{ly:.1f}" r="16"/>')
    out.append(f'<circle class="lamp" cx="{lx:.1f}" cy="{ly:.1f}" r="5"/>')
    out.append("</g>")

# Tickets que viajan por la banda (SMIL; main.js los pausa con reduced-motion)
inicio, fin = p(0.5, 1.85, 0.32), p(10.9, 1.85, 0.32)
dx, dy = fin[0] - inicio[0], fin[1] - inicio[1]
tk = [p(0, 0, 0), p(0.55, 0, 0), p(0.55, 0.5, 0), p(0, 0.5, 0)]
tkd = " ".join(f"{a:.1f},{b:.1f}" for a, b in tk)
for i in range(4):
    out.append(
        f'<g class="ticket-g" transform="translate({inicio[0]:.1f} {inicio[1]:.1f})">'
        f'<polygon class="tk" points="{tkd}">'
        f'<animate attributeName="fill" dur="12s" begin="{i * 3}s" repeatCount="indefinite" '
        f'values="#6f8597;#6f8597;#f3e6cf;#f3e6cf;#c6f24e" keyTimes="0;0.2;0.3;0.85;1"/>'
        f"</polygon>"
        f'<animateMotion dur="12s" begin="{i * 3}s" repeatCount="indefinite" path="M0,0 L{dx:.1f},{dy:.1f}"/>'
        f"</g>"
    )
# Los pórticos delanteros (cara y1) se repintan encima de los tickets
for x in estaciones:
    out.append(caja(x, 2.55, 0, x + 0.28, 2.8, 1.6, "post"))

xs = [a for a, _ in PTS]
ys = [b for _, b in PTS]
pad = 24
vb = f"{min(xs) - pad:.0f} {min(ys) - pad:.0f} {max(xs) - min(xs) + 2 * pad:.0f} {max(ys) - min(ys) + 2 * pad:.0f}"

print(
    f'<svg class="linea-svg" viewBox="{vb}" role="img" aria-labelledby="linea-svg-t" xmlns="http://www.w3.org/2000/svg">'
    '<title id="linea-svg-t">Diorama: prospectos que avanzan por cuatro estaciones hasta un desarrollo inmobiliario</title>'
    + "".join(out)
    + "</svg>"
)
