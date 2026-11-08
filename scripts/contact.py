# usage: python3 scripts/contact.py <dir with s_<frame>.jpg> <frame,frame,...>  -> <dir>/contact.jpg
import sys
from PIL import Image
d, fs = sys.argv[1], [int(x) for x in sys.argv[2].split(",")]
W, H, C = 216, 384, 7
rows = (len(fs) + C - 1) // C
s = Image.new("RGB", (W * C, H * rows), "white")
for i, n in enumerate(fs):
    s.paste(Image.open(f"{d}/s_{n}.jpg").resize((W, H)), ((i % C) * W, (i // C) * H))
s.save(f"{d}/contact.jpg", quality=85)
print(f"{d}/contact.jpg")
