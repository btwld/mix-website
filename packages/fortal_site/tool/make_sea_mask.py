"""Sea mask for the Beira-Mar photo: its connected water and surf, feathered, at half size.

    uv run --no-project --with pillow --with numpy python -I tool/make_sea_mask.py \
        assets/photos/fortaleza-beira-mar.jpg assets/photos/fortaleza-beira-mar-sea.png
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
rgb = Image.open(src).convert('RGB')
im = np.asarray(rgb).astype(np.float32)
h, w, _ = im.shape
r, g, b = im[..., 0], im[..., 1], im[..., 2]
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
yy = np.arange(h)[:, None].repeat(w, 1)
water = ((b > r + 18) & (g > r + 6) & (lum < 150) & (yy > 0.2 * h)) | ((yy > 0.86 * h) & (g >= r + 6) & (lum < 95))
m = Image.fromarray((water * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
# Keep only the regions connected to seeds in open water (left bay, bottom strip).
seeds = [(60, 600), (200, 780), (300, 450), (500, 800), (600, 820), (700, 840), (800, 845)]
work = m.copy()
for s in seeds:
    if work.getpixel(s) == 255:
        ImageDraw.floodfill(work, s, 128)
main = np.asarray(work) == 128
# Surf: bright, neutral-to-cool pixels next to the water (sand is warmer: r > b).
near = np.asarray(Image.fromarray((main * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(25))) > 0
foam = (lum > 140) & (b >= r - 6) & near & (yy > 0.25 * h)
both = main | foam
m = Image.fromarray((both * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
m = m.filter(ImageFilter.GaussianBlur(2.5)).resize((w // 2, h // 2), Image.LANCZOS)
m.save(out, optimize=True)
print('coverage', round(float(np.asarray(m).mean() / 255), 3))
