#!/usr/bin/env python3
"""Extract plant-only sprites from crop cells that include a soil patch.

Keeps green foliage, pale turnip bulb and purple crown pixels (plus a
dilated rim for the dark outlines); drops the brown dirt. Used until we
have purpose-generated plant-only art.

Usage:
  python3 tools/extract_plants.py raws/2a.png --grid 1x4 \
      --names plant_turnip_0,plant_turnip_1,plant_turnip_2,plant_turnip_3 \
      -o assets/sprites --size 256
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from process_asset import chroma_key, trim, fit_square, hex_color


def rgb_to_hsv(arr):
    arr = arr / 255.0
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    mx = arr.max(-1); mn = arr.min(-1)
    diff = mx - mn + 1e-9
    h = np.zeros_like(mx)
    m = mx == r
    h[m] = ((g - b)[m] / diff[m]) % 6
    m = mx == g
    h[m] = (b - r)[m] / diff[m] + 2
    m = mx == b
    h[m] = (r - g)[m] / diff[m] + 4
    h *= 60
    s = np.where(mx > 0, diff / (mx + 1e-9), 0)
    return h, s, mx


def plant_mask(img: Image.Image) -> Image.Image:
    a = np.asarray(img).astype(np.float64)
    alpha = a[..., 3]
    h, s, v = rgb_to_hsv(a[..., :3])
    green = (h > 45) & (h < 170) & (s > 0.18) & (v > 0.15)
    tan = (h > 15) & (h < 75) & (s > 0.12)  # dirt highlights are pale tan
    pale_bulb = (v > 0.72) & (s < 0.45) & ~tan
    purple = (h > 250) & (h < 340) & (s > 0.15) & (v > 0.3)
    mask = (green | pale_bulb | purple) & (alpha > 40)

    mask = drop_small_islands(mask, min_frac=0.002)
    m = Image.fromarray((mask * 255).astype(np.uint8))
    # close small gaps, then dilate to keep the dark outline ring
    m = m.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
    m = m.filter(ImageFilter.MaxFilter(3))
    m = m.filter(ImageFilter.GaussianBlur(1.2))
    return m


def drop_small_islands(mask: np.ndarray, min_frac: float) -> np.ndarray:
    """Remove connected components smaller than min_frac of the image."""
    h, w = mask.shape
    min_px = int(h * w * min_frac)
    seen = np.zeros_like(mask, dtype=bool)
    out = np.zeros_like(mask, dtype=bool)
    for sy, sx in zip(*np.where(mask & ~seen)):
        if seen[sy, sx]:
            continue
        stack = [(sy, sx)]
        seen[sy, sx] = True
        comp = []
        while stack:
            y, x = stack.pop()
            comp.append((y, x))
            for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(comp) >= min_px:
            for y, x in comp:
                out[y, x] = True
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("-o", "--out", required=True)
    p.add_argument("--grid", required=True)
    p.add_argument("--names", required=True)
    p.add_argument("--key", default="FF00FF")
    p.add_argument("--size", type=int, default=256)
    args = p.parse_args()

    src = Image.open(args.input).convert("RGBA")
    key = hex_color(args.key)
    rows, cols = (int(v) for v in args.grid.lower().split("x"))
    names = args.names.split(",")
    cw, ch = src.width // cols, src.height // rows
    os.makedirs(args.out, exist_ok=True)
    for r in range(rows):
        for c in range(cols):
            cell = chroma_key(src.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)), key)
            mask = plant_mask(cell)
            arr = np.asarray(cell).copy()
            arr[..., 3] = (arr[..., 3].astype(np.float64) * (np.asarray(mask) / 255.0)).astype(np.uint8)
            out = trim(Image.fromarray(arr))
            out = fit_square(out, args.size)
            path = os.path.join(args.out, names[r * cols + c] + ".png")
            out.save(path)
            print(f"wrote {path}  {out.size}")


if __name__ == "__main__":
    main()
