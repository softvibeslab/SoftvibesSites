"""Genera 3 propuestas de background para el hero (1920x1080).
Foto del artista al lado derecho, fundida al fondo, texto va a la izquierda."""
from PIL import Image, ImageOps, ImageEnhance, ImageDraw, ImageFilter
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, 'assets', 'retrato-color.jpg')
OUT = os.path.join(BASE, 'assets')
W, H = 1920, 1080

photo = Image.open(SRC).convert('RGB')          # 1080x1440 (ratio 3:4)
PW = 810                                        # 810x1080 conserva el ratio
p_base = photo.resize((PW, H), Image.LANCZOS)


def hfade_mask(size, fade_px, right_fade=0):
    """Máscara L: transparente a la izquierda -> opaco; opcional fundido derecho."""
    w, h = size
    mask = Image.new('L', (w, h), 255)
    d = ImageDraw.Draw(mask)
    for x in range(fade_px):
        d.line([(x, 0), (x, h)], fill=int(255 * (x / fade_px) ** 1.4))
    for x in range(right_fade):
        v = int(255 * (x / right_fade) ** 1.4)
        d.line([(w - 1 - x, 0), (w - 1 - x, h)], fill=min(v, 255))
    return mask


def radial(size, center, radius, power=1.0):
    """Gradiente radial L (255 en el centro -> 0 al borde), barato vía upscale."""
    s = 8
    w, h = size[0] // s, size[1] // s
    g = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(g)
    cx, cy, r = center[0] // s, center[1] // s, max(radius // s, 2)
    steps = 90
    for i in range(steps, 0, -1):
        rr = r * i / steps
        v = int(255 * (1 - i / steps) ** power)
        d.ellipse([cx - rr, cy - rr * 0.82, cx + rr, cy + rr * 0.82], fill=v)
    return g.resize(size, Image.BILINEAR).filter(ImageFilter.GaussianBlur(24))


def add_glow(canvas, center, radius, color, strength=1.0, power=1.0):
    g = radial(canvas.size, center, radius, power)
    if strength < 1.0:
        g = g.point(lambda v: int(v * strength))
    overlay = Image.new('RGB', canvas.size, color)
    return Image.composite(overlay, canvas, g)


def add_grain(img, sigma=14, alpha=16):
    noise = Image.effect_noise(img.size, sigma).convert('L')
    gray = Image.merge('RGB', (noise, noise, noise))
    return Image.blend(img, gray, alpha / 255)


def vertical_shade(img, top_dark=0.25, bottom_dark=0.55, color=(6, 8, 12)):
    """Oscurece suavemente arriba y abajo para anclar navbar y CTAs."""
    w, h = img.size
    mask = Image.new('L', (1, h))
    d = ImageDraw.Draw(mask)
    for y in range(h):
        t = y / h
        v = 0
        if t < 0.28:
            v = int(255 * top_dark * (1 - t / 0.28))
        elif t > 0.62:
            v = int(255 * bottom_dark * ((t - 0.62) / 0.38) ** 1.3)
        d.point((0, y), fill=v)
    mask = mask.resize((w, h))
    overlay = Image.new('RGB', img.size, color)
    return Image.composite(overlay, img, mask)


def paste_photo(canvas, p_img, fade_px=340):
    mask = hfade_mask(p_img.size, fade_px)
    canvas.paste(p_img, (W - PW, 0), mask)
    return canvas


# ---------- PROPUESTA A · Ámbar nocturno (duotono ámbar, club de jazz) ----------
def variant_a():
    bg = Image.new('RGB', (W, H), (11, 14, 20))
    bg = add_glow(bg, (W - 380, 300), 900, (58, 42, 24), strength=0.9)      # calidez tras la foto
    bg = add_glow(bg, (260, 880), 700, (16, 22, 34), strength=0.8)          # azul frío abajo-izq
    gray = ImageOps.autocontrast(ImageOps.grayscale(p_base), cutoff=1)
    duo = ImageOps.colorize(gray, black=(9, 11, 17), white=(240, 196, 137), mid=(122, 88, 52))
    duo = ImageEnhance.Contrast(duo).enhance(1.06)
    bg = paste_photo(bg, duo)
    bg = add_glow(bg, (W - 300, 190), 640, (224, 164, 88), strength=0.22)   # brillo de escenario
    bg = vertical_shade(bg)
    bg = add_grain(bg, 16, 14)
    bg.save(os.path.join(OUT, 'hero-propuesta-a.jpg'), quality=85)


# ---------- PROPUESTA B · Luz de escenario (color cálido, spotlight) ----------
def variant_b():
    bg = Image.new('RGB', (W, H), (10, 13, 19))
    bg = add_glow(bg, (W - 400, 120), 1050, (46, 34, 22), strength=1.0, power=1.2)
    bg = add_glow(bg, (420, 540), 900, (14, 19, 30), strength=0.9)
    p = p_base.copy()
    r, g, b = p.split()
    r = r.point(lambda v: min(255, int(v * 1.07)))
    b = b.point(lambda v: int(v * 0.88))
    p = Image.merge('RGB', (r, g, b))
    p = ImageEnhance.Color(p).enhance(0.82)
    p = ImageEnhance.Brightness(p).enhance(0.86)
    p = ImageEnhance.Contrast(p).enhance(1.05)
    bg = paste_photo(bg, p, fade_px=380)
    spot = radial((W, H), (W - PW // 2, -140), 1250, power=1.4)
    spot = spot.point(lambda v: int(v * 0.28))
    bg = Image.composite(Image.new('RGB', (W, H), (238, 190, 130)), bg, spot)
    bg = vertical_shade(bg, top_dark=0.3, bottom_dark=0.6)
    bg = add_grain(bg, 13, 11)
    bg.save(os.path.join(OUT, 'hero-propuesta-b.jpg'), quality=85)


# ---------- PROPUESTA C · Azul StingRay (duotono azul + acento ámbar) ----------
def variant_c():
    bg = Image.new('RGB', (W, H), (8, 11, 18))
    bg = add_glow(bg, (W - 350, 260), 950, (24, 38, 64), strength=1.0)      # azul del bajo
    bg = add_glow(bg, (180, 960), 760, (66, 48, 26), strength=0.75)         # acento ámbar abajo-izq
    gray = ImageOps.autocontrast(ImageOps.grayscale(p_base), cutoff=1)
    duo = ImageOps.colorize(gray, black=(7, 10, 17), white=(158, 191, 235), mid=(52, 76, 118))
    duo = ImageEnhance.Contrast(duo).enhance(1.08)
    bg = paste_photo(bg, duo)
    bg = add_glow(bg, (W - 760, 850), 560, (224, 164, 88), strength=0.16)   # chispa cálida
    bg = vertical_shade(bg)
    bg = add_grain(bg, 17, 15)
    bg.save(os.path.join(OUT, 'hero-propuesta-c.jpg'), quality=85)


variant_a()
variant_b()
variant_c()
print('ok: hero-propuesta-a/b/c.jpg generadas en assets/')
