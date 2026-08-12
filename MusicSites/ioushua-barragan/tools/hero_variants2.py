"""Segunda ronda de propuestas de hero (D, E, F) — mismo retrato, tratamientos nuevos."""
from PIL import Image, ImageOps, ImageEnhance, ImageDraw, ImageFilter
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, 'assets', 'retrato-color.jpg')
OUT = os.path.join(BASE, 'assets')
W, H = 1920, 1080
PW = 810

photo = Image.open(SRC).convert('RGB')
p_base = photo.resize((PW, H), Image.LANCZOS)


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


def vertical_shade(img, top_dark=0.25, bottom_dark=0.55, color=(6, 8, 12)):
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


def paste_photo(canvas, p_img, fade_px=340):
    canvas.paste(p_img, (W - PW, 0), hfade_mask(p_img.size, fade_px))
    return canvas


# ---------- PROPUESTA D · Film noir (B/N alto contraste, plata) ----------
def variant_d():
    bg = Image.new('RGB', (W, H), (13, 15, 18))
    bg = add_glow(bg, (W - 420, 260), 950, (38, 42, 48), strength=1.0)      # halo plata
    bg = add_glow(bg, (300, 900), 700, (20, 22, 26), strength=0.8)
    gray = ImageOps.autocontrast(ImageOps.grayscale(p_base), cutoff=2)
    noir = ImageOps.colorize(gray, black=(4, 5, 7), white=(233, 235, 239), mid=(92, 97, 105))
    noir = ImageEnhance.Contrast(noir).enhance(1.22)
    noir = ImageEnhance.Brightness(noir).enhance(0.94)
    bg = paste_photo(bg, noir)
    bg = vertical_shade(bg, color=(4, 5, 7))
    bg = add_grain(bg, 18, 17)                                              # grano de película
    bg.save(os.path.join(OUT, 'hero-propuesta-d.jpg'), quality=85)


# ---------- PROPUESTA E · Caribe profundo (duotono esmeralda + arena) ----------
def variant_e():
    bg = Image.new('RGB', (W, H), (6, 13, 13))
    bg = add_glow(bg, (W - 380, 300), 950, (16, 54, 50), strength=1.0)      # esmeralda tras la foto
    bg = add_glow(bg, (240, 900), 720, (58, 46, 26), strength=0.7)          # arena cálida abajo-izq
    gray = ImageOps.autocontrast(ImageOps.grayscale(p_base), cutoff=1)
    duo = ImageOps.colorize(gray, black=(5, 12, 12), white=(226, 214, 178), mid=(26, 82, 76))
    duo = ImageEnhance.Contrast(duo).enhance(1.07)
    bg = paste_photo(bg, duo)
    bg = add_glow(bg, (W - 300, 170), 600, (224, 164, 88), strength=0.15)   # chispa ámbar arriba
    bg = vertical_shade(bg, color=(4, 9, 9))
    bg = add_grain(bg, 15, 13)
    bg.save(os.path.join(OUT, 'hero-propuesta-e.jpg'), quality=85)


# ---------- PROPUESTA F · Oro editorial (split-tone vino/oro, cartel de gig) ----------
def variant_f():
    bg = Image.new('RGB', (W, H), (16, 10, 8))
    bg = add_glow(bg, (W - 400, 240), 1000, (72, 38, 22), strength=1.0, power=1.2)
    bg = add_glow(bg, (280, 880), 700, (40, 18, 14), strength=0.8)
    gray = ImageOps.autocontrast(ImageOps.grayscale(p_base), cutoff=1)
    gray = ImageOps.posterize(gray.convert('L'), 5)                          # toque de cartel
    split = ImageOps.colorize(gray, black=(22, 10, 9), white=(246, 210, 142), mid=(126, 64, 38))
    split = ImageEnhance.Contrast(split).enhance(1.1)
    bg = paste_photo(bg, split)
    bg = add_glow(bg, (W - 700, 900), 520, (224, 164, 88), strength=0.18)
    bg = vertical_shade(bg, top_dark=0.3, bottom_dark=0.6, color=(10, 6, 5))
    bg = add_grain(bg, 19, 18)
    bg.save(os.path.join(OUT, 'hero-propuesta-f.jpg'), quality=85)


variant_d()
variant_e()
variant_f()
print('ok: hero-propuesta-d/e/f.jpg generadas en assets/')
