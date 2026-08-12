"""Tercera ronda de propuestas de hero (G, H, I) — foto B/N del contrabajo con telón."""
from PIL import Image, ImageOps, ImageEnhance, ImageDraw, ImageFilter
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, 'assets', 'galeria-contrabajo-escenario.jpg')  # original limpio de contra.png
OUT = os.path.join(BASE, 'assets')
W, H = 1920, 1080
PW = 810

photo = Image.open(SRC).convert('RGB')            # 1080x1350
# recorte a ratio 3:4 conservando al músico (queda a la izquierda del cuadro)
p_crop = photo.crop((0, 0, 1012, 1350))
p_base = p_crop.resize((PW, H), Image.LANCZOS)


def hfade_mask(size, fade_px):
    w, h = size
    mask = Image.new('L', (w, h), 255)
    d = ImageDraw.Draw(mask)
    for x in range(fade_px):
        d.line([(x, 0), (x, h)], fill=int(255 * (x / fade_px) ** 1.4))
    return mask


def radial(size, center, radius, power=1.0):
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
    return Image.composite(Image.new('RGB', canvas.size, color), canvas, g)


def add_grain(img, sigma=14, alpha=16):
    noise = Image.effect_noise(img.size, sigma).convert('L')
    return Image.blend(img, Image.merge('RGB', (noise, noise, noise)), alpha / 255)


def vertical_shade(img, top_dark=0.25, bottom_dark=0.5, color=(5, 7, 11)):
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
    return Image.composite(Image.new('RGB', img.size, color), img, mask.resize((w, h)))


def paste_photo(canvas, p_img, fade_px=360):
    canvas.paste(p_img, (W - PW, 0), hfade_mask(p_img.size, fade_px))
    return canvas


gray_base = ImageOps.autocontrast(ImageOps.grayscale(p_base), cutoff=1)


# ---------- PROPUESTA G · Telón de plata (B/N frío, luz lateral ámbar sutil) ----------
def variant_g():
    bg = Image.new('RGB', (W, H), (11, 14, 20))
    bg = add_glow(bg, (W - 460, 300), 900, (34, 38, 46), strength=1.0)
    noir = ImageOps.colorize(gray_base, black=(5, 6, 9), white=(230, 232, 236), mid=(88, 93, 102))
    noir = ImageEnhance.Contrast(noir).enhance(1.16)
    bg = paste_photo(bg, noir)
    bg = add_glow(bg, (240, 920), 700, (60, 44, 24), strength=0.55)   # calidez ámbar junto a CTAs
    bg = vertical_shade(bg)
    bg = add_grain(bg, 17, 15)
    bg.save(os.path.join(OUT, 'hero-propuesta-g.jpg'), quality=85)


# ---------- PROPUESTA H · Brasa de club (duotono ámbar/cobre) ----------
def variant_h():
    bg = Image.new('RGB', (W, H), (13, 10, 8))
    bg = add_glow(bg, (W - 420, 260), 980, (56, 36, 20), strength=1.0, power=1.15)
    ember = ImageOps.colorize(gray_base, black=(9, 7, 6), white=(240, 199, 141), mid=(112, 78, 46))
    ember = ImageEnhance.Contrast(ember).enhance(1.1)
    bg = paste_photo(bg, ember)
    bg = add_glow(bg, (W - 340, 180), 620, (224, 164, 88), strength=0.2)
    bg = vertical_shade(bg, color=(8, 6, 5))
    bg = add_grain(bg, 15, 13)
    bg.save(os.path.join(OUT, 'hero-propuesta-h.jpg'), quality=85)


# ---------- PROPUESTA I · Medianoche (duotono azul profundo + chispa ámbar) ----------
def variant_i():
    bg = Image.new('RGB', (W, H), (7, 10, 17))
    bg = add_glow(bg, (W - 400, 280), 950, (22, 36, 62), strength=1.0)
    mid = ImageOps.colorize(gray_base, black=(6, 9, 15), white=(168, 196, 234), mid=(48, 72, 112))
    mid = ImageEnhance.Contrast(mid).enhance(1.1)
    bg = paste_photo(bg, mid)
    bg = add_glow(bg, (200, 940), 660, (66, 48, 26), strength=0.6)    # ámbar abajo-izquierda
    bg = vertical_shade(bg, color=(4, 6, 11))
    bg = add_grain(bg, 16, 14)
    bg.save(os.path.join(OUT, 'hero-propuesta-i.jpg'), quality=85)


variant_g()
variant_h()
variant_i()
print('ok: hero-propuesta-g/h/i.jpg generadas en assets/')
