"""Medianoche full-width: el telón de la foto se extiende por todo el ancho del hero."""
from PIL import Image, ImageOps, ImageEnhance, ImageDraw, ImageFilter
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, 'assets', 'galeria-contrabajo-escenario.jpg')
OUT = os.path.join(BASE, 'assets', 'hero-medianoche-full.jpg')
W, H = 1920, 1080
PW = 810

photo = Image.open(SRC).convert('RGB')
p_crop = photo.crop((0, 0, 1012, 1350))
p_panel = p_crop.resize((PW, H), Image.LANCZOS)

# --- fondo: telón continuo construido con la propia cortina de la foto ---
curtain = p_crop.crop((600, 0, 1012, 1350)).resize((W, H), Image.LANCZOS)
curtain = ImageOps.mirror(curtain).filter(ImageFilter.GaussianBlur(6))
curtain = ImageEnhance.Brightness(curtain).enhance(0.78)

canvas = Image.new('RGB', (W, H), (10, 12, 16))
canvas.paste(curtain, (0, 0))

# --- foto del músico a la derecha, fundida sobre el telón ---
fade = 560
mask = Image.new('L', p_panel.size, 255)
d = ImageDraw.Draw(mask)
for x in range(fade):
    d.line([(x, 0), (x, H)], fill=int(255 * (x / fade) ** 2.2))
canvas.paste(p_panel, (W - PW, 0), mask)

# --- duotono medianoche sobre TODO el lienzo ---
gray = ImageOps.autocontrast(ImageOps.grayscale(canvas), cutoff=1)
mid = ImageOps.colorize(gray, black=(6, 9, 15), white=(168, 196, 234), mid=(48, 72, 112))
mid = ImageEnhance.Contrast(mid).enhance(1.08)


def radial(size, center, radius, power=1.0):
    s = 8
    w, h = size[0] // s, size[1] // s
    g = Image.new('L', (w, h), 0)
    d2 = ImageDraw.Draw(g)
    cx, cy, r = center[0] // s, center[1] // s, max(radius // s, 2)
    steps = 90
    for i in range(steps, 0, -1):
        rr = r * i / steps
        v = int(255 * (1 - i / steps) ** power)
        d2.ellipse([cx - rr, cy - rr * 0.82, cx + rr, cy + rr * 0.82], fill=v)
    return g.resize(size, Image.BILINEAR).filter(ImageFilter.GaussianBlur(24))


def add_glow(cv, center, radius, color, strength=1.0):
    g = radial(cv.size, center, radius)
    if strength < 1.0:
        g = g.point(lambda v: int(v * strength))
    return Image.composite(Image.new('RGB', cv.size, color), cv, g)


mid = add_glow(mid, (W - 400, 280), 950, (24, 40, 68), strength=0.6)   # luz azul tras el músico
mid = add_glow(mid, (200, 940), 660, (66, 48, 26), strength=0.55)      # ámbar junto a CTAs

# --- velo oscuro a la izquierda para legibilidad del titular ---
veil = Image.new('L', (W, 1), 0)
dv = ImageDraw.Draw(veil)
for x in range(W):
    t = x / W
    v = int(200 * max(0.0, 1 - t / 0.62) ** 1.25)
    dv.point((x, 0), fill=v)
veil = veil.resize((W, H))
mid = Image.composite(Image.new('RGB', (W, H), (7, 9, 14)), mid, veil)

# --- sombra vertical + grano ---
shade = Image.new('L', (1, H))
ds = ImageDraw.Draw(shade)
for y in range(H):
    t = y / H
    v = 0
    if t < 0.28:
        v = int(255 * 0.25 * (1 - t / 0.28))
    elif t > 0.62:
        v = int(255 * 0.5 * ((t - 0.62) / 0.38) ** 1.3)
    ds.point((0, y), fill=v)
mid = Image.composite(Image.new('RGB', (W, H), (4, 6, 11)), mid, shade.resize((W, H)))

noise = Image.effect_noise((W, H), 16).convert('L')
mid = Image.blend(mid, Image.merge('RGB', (noise, noise, noise)), 14 / 255)

mid.save(OUT, quality=85)
print('ok:', OUT)
