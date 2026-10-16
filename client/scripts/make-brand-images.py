"""
Makes the link-preview image, favicon and app icons in client/public from the PANS badge.

    pip install pillow
    python client/scripts/make-brand-images.py client/src/assets/pans-badge.png client/public

The badge in the repository is 200 px, so the 512 px icons and the preview image are scaled up.
When the Media Committee supplies a larger badge (at least 512 px, transparent background),
run this again with it to make sharper versions. Colours: pale green #e1e8db (README → Brand).
"""
from PIL import Image, ImageFilter
import sys, os
src = Image.open(sys.argv[1]).convert('RGBA')
out = sys.argv[2]
os.makedirs(out, exist_ok=True)
PALE = (0xe1, 0xe8, 0xdb, 255)
WHITE = (255, 255, 255, 255)

def badge(size):
    # Lanczos, then a light unsharp mask so the upscaled lettering stays crisp.
    im = src.resize((size, size), Image.LANCZOS)
    if size > src.width:
        rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
        rgb.putalpha(im.getchannel('A'))
        im = rgb
    return im

def on(bg, w, h, size):
    canvas = Image.new('RGBA', (w, h), bg)
    b = badge(size)
    canvas.alpha_composite(b, ((w - size) // 2, (h - size) // 2))
    return canvas

# Open Graph / link previews: badge on pale green, centred so a square crop keeps it.
on(PALE, 1200, 630, 400).convert('RGB').save(f'{out}/og-default.png', optimize=True)
# Home-screen icons: transparent; maskable versions keep the badge inside the 80% safe zone.
badge(192).save(f'{out}/icon-192.png', optimize=True)
badge(512).save(f'{out}/icon-512.png', optimize=True)
on(PALE, 512, 512, 400).convert('RGB').save(f'{out}/icon-maskable-512.png', optimize=True)
# iOS fills transparency with black, so the touch icon sits on white.
on(WHITE, 180, 180, 164).convert('RGB').save(f'{out}/apple-touch-icon.png', optimize=True)
# favicon.ico with 16, 32 and 48 px images.
badge(48).save(f'{out}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
