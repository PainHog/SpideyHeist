"""Render a PDF's pages into contact sheets for review.
   python3 book/tools/contact-sheet.py <pdf> <outPrefix> [dpi] [cols] [first-last]"""
import sys, math, pymupdf
from PIL import Image
pdf, out = sys.argv[1], sys.argv[2]
dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 36
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 6
d = pymupdf.open(pdf)
lo, hi = (1, len(d))
if len(sys.argv) > 5: lo, hi = map(int, sys.argv[5].split("-"))
ims = []
for i in range(lo - 1, min(hi, len(d))):
    pix = d[i].get_pixmap(dpi=dpi)
    ims.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
w, h = ims[0].size
rows = math.ceil(len(ims) / cols)
sheet = Image.new("RGB", (cols * w + (cols + 1) * 6, rows * h + (rows + 1) * 6), (60, 60, 60))
for k, im in enumerate(ims):
    sheet.paste(im, (6 + (k % cols) * (w + 6), 6 + (k // cols) * (h + 6)))
sheet.save(f"{out}.png")
print(f"{out}.png", sheet.size, f"pages {lo}-{lo+len(ims)-1}")
