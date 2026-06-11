#!/usr/bin/env python3
"""Build a continuous tilled-field patch from a single generated soil tile.

9-slice: the tile's corners are kept, its edges are tiled along the border,
and the center texture is tiled to fill — so one generated tile becomes a
seamless plot of any grid size.

Usage:
  python3 tools/make_plot.py raws/2b.png assets/sprites/plot.png --cells 3x4 --out-height 1024
"""
import argparse
import sys

sys.path.insert(0, "tools")
from process_asset import chroma_key, trim, hex_color

from PIL import Image


def build_plot(tile: Image.Image, cols: int, rows: int) -> Image.Image:
    tw, th = tile.size
    cs_x, cs_y = int(tw * 0.22), int(th * 0.22)  # corner size
    # target: middles expand so the patch reads as cols x rows tiles
    mid_w = (tw - 2 * cs_x)
    mid_h = (th - 2 * cs_y)
    out_w = cs_x * 2 + mid_w * cols
    out_h = cs_y * 2 + mid_h * rows
    out = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))

    c_tl = tile.crop((0, 0, cs_x, cs_y))
    c_tr = tile.crop((tw - cs_x, 0, tw, cs_y))
    c_bl = tile.crop((0, th - cs_y, cs_x, th))
    c_br = tile.crop((tw - cs_x, th - cs_y, tw, th))
    e_top = tile.crop((cs_x, 0, tw - cs_x, cs_y))
    e_bot = tile.crop((cs_x, th - cs_y, tw - cs_x, th))
    e_left = tile.crop((0, cs_y, cs_x, th - cs_y))
    e_right = tile.crop((tw - cs_x, cs_y, tw, th - cs_y))
    center = tile.crop((cs_x, cs_y, tw - cs_x, th - cs_y))

    for i in range(cols):
        out.alpha_composite(e_top, (cs_x + i * mid_w, 0))
        out.alpha_composite(e_bot, (cs_x + i * mid_w, out_h - cs_y))
    for j in range(rows):
        out.alpha_composite(e_left, (0, cs_y + j * mid_h))
        out.alpha_composite(e_right, (out_w - cs_x, cs_y + j * mid_h))
    for i in range(cols):
        for j in range(rows):
            # mirror alternating center tiles so the repetition is less obvious
            c = center.transpose(Image.FLIP_LEFT_RIGHT) if (i + j) % 2 else center
            out.alpha_composite(c, (cs_x + i * mid_w, cs_y + j * mid_h))
    out.alpha_composite(c_tl, (0, 0))
    out.alpha_composite(c_tr, (out_w - cs_x, 0))
    out.alpha_composite(c_bl, (0, out_h - cs_y))
    out.alpha_composite(c_br, (out_w - cs_x, out_h - cs_y))
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--cells", default="3x4", help="COLSxROWS")
    p.add_argument("--key", default="FF00FF")
    p.add_argument("--out-height", type=int, default=1024)
    args = p.parse_args()

    cols, rows = (int(v) for v in args.cells.lower().split("x"))
    tile = trim(chroma_key(Image.open(args.input).convert("RGBA"), hex_color(args.key)))
    plot = build_plot(tile, cols, rows)
    scale = args.out_height / plot.height
    plot = plot.resize((round(plot.width * scale), args.out_height), Image.LANCZOS)
    plot.save(args.output)
    print(f"wrote {args.output}  {plot.size}")


if __name__ == "__main__":
    main()
