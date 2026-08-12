"""Genera un vinilo (PNG transparente) con surcos, brillo y etiqueta ámbar."""
from PIL import Image, ImageDraw, ImageFilter
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, 'assets', 'vinyl.png')
S = 900
c = S // 2

img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# disco
d.ellipse([8, 8, S - 8, S - 8], fill=(15, 18, 25, 255))

# surcos concéntricos
for r in range(150, 438, 4):
    alpha = 16 + ((r // 24) % 3) * 9
    d.ellipse([c - r, c - r, c + r, c + r], outline=(190, 198, 212, alpha))

# brillo diagonal (dos abanicos suaves)
sheen = Image.new('RGBA', (S, S), (0, 0, 0, 0))
ds = ImageDraw.Draw(sheen)
ds.pieslice([30, 30, S - 30, S - 30], 205, 245, fill=(245, 246, 250, 26))
ds.pieslice([30, 30, S - 30, S - 30], 25, 65, fill=(245, 246, 250, 18))
sheen = sheen.filter(ImageFilter.GaussianBlur(18))
img = Image.alpha_composite(img, sheen)
d = ImageDraw.Draw(img)

# etiqueta ámbar
d.ellipse([c - 148, c - 148, c + 148, c + 148], fill=(224, 164, 88, 255))
d.ellipse([c - 148, c - 148, c + 148, c + 148], outline=(11, 14, 20, 80), width=3)
d.ellipse([c - 96, c - 96, c + 96, c + 96], outline=(11, 14, 20, 70), width=2)
d.ellipse([c - 44, c - 44, c + 44, c + 44], outline=(11, 14, 20, 60), width=2)

# perno central
d.ellipse([c - 13, c - 13, c + 13, c + 13], fill=(15, 18, 25, 255))

img.save(OUT)
print('ok:', OUT)
