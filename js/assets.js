// Sprite registry: real generated PNGs (declared in assets/manifest.json)
// take priority; anything not yet generated falls back to its procedural
// placeholder painter. Real images draw bottom-center anchored, same as
// painters, so swapping art never moves the layout.
import { painters } from "./placeholders.js";
import { offscreen } from "./util.js";

const images = new Map();
const variants = new Map(); // logical key -> [loaded sprite keys]

export async function loadAssets() {
  let manifest = {};
  try {
    manifest = await (await fetch("assets/manifest.json")).json();
  } catch { /* no manifest yet — all placeholders */ }
  await Promise.all(Object.entries(manifest).map(([key, meta]) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { images.set(key, { img, meta }); resolve(); };
      img.onerror = () => resolve(); // missing file -> placeholder
      img.src = meta.src;
    })
  ));
  for (const [key, { meta }] of images) {
    if (meta.variantOf) {
      if (!variants.has(meta.variantOf)) variants.set(meta.variantOf, []);
      variants.get(meta.variantOf).push(key);
    }
  }
  for (const list of variants.values()) list.sort();
}

export function hasRealArt(key) {
  return images.has(key) || variants.has(key);
}

export function getImage(key) {
  return images.get(key)?.img ?? null;
}

export function drawSprite(ctx, key, x, y, opts = {}) {
  let entry = images.get(key);
  if (!entry && variants.has(key)) {
    const list = variants.get(key);
    entry = images.get(list[(opts.seed ?? 0) % list.length]);
  }
  if (entry) {
    const { img, meta } = entry;
    const w = opts.w ?? opts.h ?? img.width;
    const h = w * (img.height / img.width);
    if (opts.snap) {
      // Pin moving sprites (the player, and future animated actors) to the
      // backbuffer pixel grid. A sprite that moves sits at a fresh sub-pixel
      // offset every frame, so the render-scale downsample + image smoothing
      // re-interpolate it into a soft shimmer; static props only look crisp
      // because their offset never changes. We snap in *device* space using
      // the live transform — snapping logical coords would leave a fraction
      // after the 0.75 scale — so the offset stays constant: stable and sharp.
      const m = ctx.getTransform();
      x = (Math.round(x * m.a + m.e) - m.e) / m.a;
      y = (Math.round(y * m.d + m.f) - m.f) / m.d;
    }
    if (meta.shadow !== false) {
      softShadow(ctx, x, y, w * (meta.shadowScale ?? 0.42), meta.shadowAlpha ?? 0.34);
    }
    if (opts.flipX) {
      ctx.save();
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -w / 2, y - h, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(img, x - w / 2, y - h, w, h);
    }
    return;
  }
  const painter = painters[opts.fallback ?? key];
  if (painter) painter(ctx, x, y, opts);
}

// Contact-shadow puff, baked once. The falloff (1 → 0.55 → 0) matches the old
// per-sprite gradient; we draw it scaled and alpha-modulated instead of
// rebuilding a radial gradient for every sprite on every frame.
const SHADOW_PUFF = (() => {
  const s = 128;
  const c = offscreen(s, s);
  const cx = c.getContext("2d");
  const g = cx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(28,38,16,1)");
  g.addColorStop(0.55, "rgba(28,38,16,0.55)");
  g.addColorStop(1, "rgba(28,38,16,0)");
  cx.fillStyle = g;
  cx.fillRect(0, 0, s, s);
  return c;
})();

function softShadow(ctx, x, y, rx, alpha) {
  // contact shadow: offset slightly down-right to agree with the
  // top-left sun, denser at the core than the old wash
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingQuality = "low"; // a blurry puff needs no fancy filtering
  ctx.translate(x + rx * 0.14, y - 3);
  ctx.scale(1, 0.34);
  ctx.drawImage(SHADOW_PUFF, -rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}
