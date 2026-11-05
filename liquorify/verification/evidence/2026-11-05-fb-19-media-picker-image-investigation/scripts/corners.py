import sys
from PIL import Image
import numpy as np
ref = np.array(Image.open(sys.argv[1]).convert("RGBA")).astype(int)
# tiles in the light reference: x ranges of four tiles, y 171..329
tiles = {"olive": (689, 822), "clay": (835, 965), "slate": (979, 1110), "banner": (1123, 1255)}
for path in sys.argv[2:]:
    img = np.array(Image.open(path).convert("RGBA")).astype(int)
    d = np.abs(img - ref).max(axis=2)
    ys, xs = np.nonzero(d)
    summary = []
    for name, (x0, x1) in tiles.items():
        for corner, (cx, cy) in {"TL": (x0, 171), "TR": (x1, 171), "BL": (x0, 329), "BR": (x1, 329)}.items():
            m = (np.abs(xs - cx) <= 8) & (np.abs(ys - cy) <= 8)
            if m.any():
                summary.append(f"{name}.{corner}:{m.sum()}/{d[ys[m], xs[m]].max()}")
    inside = 0
    other = []
    for y, x in zip(ys, xs):
        near = any(abs(x - cx) <= 8 and abs(y - cy) <= 8 for (x0, x1) in tiles.values() for cx in (x0, x1) for cy in (171, 329))
        if not near:
            other.append((x, y, d[y, x]))
    print(path.split("/")[-3], len(ys), "max", d.max() if len(ys) else 0, " ".join(summary), "| elsewhere:", len(other), other[:6])
