// Procedural stand-in painters. Every sprite key the scene uses has a painter
// here; real generated PNGs (see assets/manifest.json) override them one by
// one as they arrive. All painters draw bottom-center anchored at (x, y).
import { blob, shadow, makeRng } from "./util.js";

const GREENS_DARK = ["#2f4a2a", "#35522e", "#2b4527"];
const GREENS_MID = ["#456b35", "#4d753a", "#3f6231"];
const GREENS_LIGHT = ["#6b934b", "#759c52"];

export const painters = {
  pine(ctx, x, y, opts = {}) {
    const h = opts.h ?? 130;
    const w = h * 0.62;
    const rng = makeRng(opts.seed ?? 1);
    shadow(ctx, x, y - 2, w * 0.55, w * 0.22);
    ctx.fillStyle = "#5a4226";
    ctx.fillRect(x - w * 0.05, y - h * 0.14, w * 0.1, h * 0.14);
    const layers = 4;
    for (let i = layers - 1; i >= 0; i--) {
      const ly = y - h * 0.08 - (h * 0.86 * i) / layers;
      const lw = w * (1 - i / (layers + 0.6));
      const lh = h * 0.34;
      // body
      ctx.fillStyle = rng.pick(GREENS_DARK);
      ctx.beginPath();
      ctx.moveTo(x, ly - lh);
      ctx.quadraticCurveTo(x + lw * 0.7, ly - lh * 0.35, x + lw * 0.5, ly);
      ctx.quadraticCurveTo(x, ly + lh * 0.12, x - lw * 0.5, ly);
      ctx.quadraticCurveTo(x - lw * 0.7, ly - lh * 0.35, x, ly - lh);
      ctx.fill();
      // lit left edge
      ctx.fillStyle = "rgba(140,180,95,0.30)";
      ctx.beginPath();
      ctx.moveTo(x - lw * 0.04, ly - lh);
      ctx.quadraticCurveTo(x - lw * 0.55, ly - lh * 0.35, x - lw * 0.42, ly - lh * 0.06);
      ctx.quadraticCurveTo(x - lw * 0.2, ly - lh * 0.45, x - lw * 0.04, ly - lh);
      ctx.fill();
    }
  },

  tree(ctx, x, y, opts = {}) {
    const h = opts.h ?? 120;
    const rng = makeRng(opts.seed ?? 1);
    const r = h * 0.34;
    shadow(ctx, x, y - 2, r * 1.5, r * 0.55);
    ctx.fillStyle = "#5a4226";
    ctx.fillRect(x - h * 0.035, y - h * 0.3, h * 0.07, h * 0.3);
    const cy = y - h * 0.62;
    for (let i = 0; i < 6; i++) {
      blob(ctx, x + rng.range(-r * 0.7, r * 0.7), cy + rng.range(-r * 0.5, r * 0.45),
        r * rng.range(0.5, 0.75), rng.pick(GREENS_MID), rng, 0.12);
    }
    blob(ctx, x, cy - r * 0.15, r * 0.8, rng.pick(GREENS_MID), rng, 0.1);
    for (let i = 0; i < 4; i++) {
      blob(ctx, x - r * 0.3 + rng.range(-r * 0.4, r * 0.3), cy - r * 0.3 + rng.range(-r * 0.3, r * 0.2),
        r * rng.range(0.2, 0.34), rng.pick(GREENS_LIGHT), rng, 0.15);
    }
  },

  bush(ctx, x, y, opts = {}) {
    const s = opts.h ?? 34;
    const rng = makeRng(opts.seed ?? 1);
    shadow(ctx, x, y - 1, s * 0.8, s * 0.3, 0.18);
    for (let i = 0; i < 4; i++) {
      blob(ctx, x + rng.range(-s * 0.45, s * 0.45), y - s * 0.4 + rng.range(-s * 0.18, s * 0.12),
        s * rng.range(0.3, 0.45), rng.pick(GREENS_MID), rng, 0.14);
    }
    blob(ctx, x - s * 0.2, y - s * 0.55, s * 0.28, rng.pick(GREENS_LIGHT), rng, 0.15);
    if (opts.flowers) {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = rng.pick(["#f3e7c8", "#e9b8c8", "#f0d98a"]);
        ctx.beginPath();
        ctx.arc(x + rng.range(-s * 0.5, s * 0.5), y - s * 0.45 + rng.range(-s * 0.25, s * 0.2), s * 0.07, 0, 7);
        ctx.fill();
      }
    }
    if (opts.berries) {
      for (let i = 0; i < 6; i++) {
        const bx = x + rng.range(-s * 0.5, s * 0.5);
        const by = y - s * 0.42 + rng.range(-s * 0.28, s * 0.22);
        ctx.fillStyle = "#b3243a";
        ctx.beginPath();
        ctx.arc(bx, by, s * 0.085, 0, 7);
        ctx.fill();
        ctx.fillStyle = "rgba(255,200,200,0.7)";
        ctx.beginPath();
        ctx.arc(bx - s * 0.03, by - s * 0.03, s * 0.03, 0, 7);
        ctx.fill();
      }
    }
  },

  rock(ctx, x, y, opts = {}) {
    const s = opts.h ?? 26;
    const rng = makeRng(opts.seed ?? 1);
    shadow(ctx, x, y - 1, s * 0.9, s * 0.32, 0.18);
    blob(ctx, x, y - s * 0.4, s * 0.55, "#7d7868", rng, 0.2);
    blob(ctx, x - s * 0.15, y - s * 0.52, s * 0.3, "#9b9685", rng, 0.2);
  },

  soil(ctx, x, y, opts = {}) {
    const s = opts.h ?? 78;
    ctx.fillStyle = "#4a3520";
    roundedFill(ctx, x - s / 2, y - s, s, s, 10);
    ctx.fillStyle = "#5d4429";
    roundedFill(ctx, x - s / 2 + 3, y - s + 3, s - 6, s - 6, 8);
    ctx.strokeStyle = "rgba(58,40,22,0.8)";
    ctx.lineWidth = 3;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - s / 2 + 8, y - s + (s * i) / 4);
      ctx.lineTo(x + s / 2 - 8, y - s + (s * i) / 4);
      ctx.stroke();
    }
  },

  turnip(ctx, x, y, opts = {}) {
    const stage = opts.stage ?? 3;
    const s = opts.h ?? 46;
    const rng = makeRng(opts.seed ?? 1);
    if (stage >= 3) {
      const r = s * 0.36;
      const by = y - r * 0.85;
      // bulb: pale lavender-white with violet crown and shaded base
      ctx.fillStyle = "#cfaede";
      ctx.beginPath();
      ctx.ellipse(x, by, r, r * 0.95, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#efe8f2";
      ctx.beginPath();
      ctx.ellipse(x - r * 0.08, by - r * 0.12, r * 0.82, r * 0.74, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#8f64ad";
      ctx.beginPath();
      ctx.ellipse(x, by - r * 0.62, r * 0.66, r * 0.36, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.beginPath();
      ctx.ellipse(x - r * 0.34, by - r * 0.1, r * 0.18, r * 0.28, -0.4, 0, 7);
      ctx.fill();
      // root tip
      ctx.strokeStyle = "#cfaede";
      ctx.lineWidth = Math.max(2, r * 0.16);
      ctx.beginPath();
      ctx.moveTo(x, by + r * 0.85);
      ctx.quadraticCurveTo(x + r * 0.15, y + 2, x, y + 4);
      ctx.stroke();
    }
    const leaves = stage === 0 ? 2 : stage === 1 ? 4 : 5;
    const lh = s * (0.18 + stage * 0.09);
    const top = stage >= 3 ? y - s * 0.82 : y - 2;
    for (let i = 0; i < leaves; i++) {
      const a = -Math.PI / 2 + (i - (leaves - 1) / 2) * 0.42 + rng.range(-0.07, 0.07);
      const ex = x + Math.cos(a) * lh, ey = top + Math.sin(a) * lh;
      ctx.strokeStyle = "#33592b";
      ctx.lineWidth = Math.max(2, s * 0.06);
      ctx.beginPath();
      ctx.moveTo(x, top + 2);
      ctx.quadraticCurveTo(x + Math.cos(a) * lh * 0.55, top + Math.sin(a) * lh * 0.85, ex, ey);
      ctx.stroke();
      // leaf: dark ellipse with lighter heart
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = "#3c6a31";
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.05, s * 0.07 + stage * 0.8, s * 0.11 + stage * 1.2, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#558a3f";
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.05, s * 0.035 + stage * 0.45, s * 0.07 + stage * 0.8, 0, 0, 7);
      ctx.fill();
      ctx.restore();
    }
  },

  radish(ctx, x, y, opts = {}) {
    const stage = opts.stage ?? 3;
    const s = opts.h ?? 46;
    const rng = makeRng(opts.seed ?? 1);
    if (stage >= 3) {
      const r = s * 0.32;
      const by = y - r * 0.8;
      // round scarlet root with a pale tip and a soft highlight
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.ellipse(x, by, r, r * 0.98, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#e0584a";
      ctx.beginPath();
      ctx.ellipse(x - r * 0.12, by - r * 0.14, r * 0.7, r * 0.66, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.ellipse(x - r * 0.34, by - r * 0.08, r * 0.16, r * 0.26, -0.4, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#f0e9dd"; // pale root tip
      ctx.lineWidth = Math.max(2, r * 0.16);
      ctx.beginPath();
      ctx.moveTo(x, by + r * 0.8);
      ctx.quadraticCurveTo(x + r * 0.12, y + 2, x, y + 4);
      ctx.stroke();
    }
    leafRosette(ctx, x, y, s, stage, rng, "#3c6a31", "#5e9442");
  },

  carrot(ctx, x, y, opts = {}) {
    const stage = opts.stage ?? 3;
    const s = opts.h ?? 46;
    const rng = makeRng(opts.seed ?? 1);
    if (stage >= 3) {
      // an orange shoulder poking from the furrow, tapering down
      const w = s * 0.34, top = y - s * 0.5;
      ctx.fillStyle = "#e07b2e";
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, top);
      ctx.quadraticCurveTo(x - w * 0.55, y - s * 0.12, x, y + 4);
      ctx.quadraticCurveTo(x + w * 0.55, y - s * 0.12, x + w * 0.5, top);
      ctx.quadraticCurveTo(x, top - s * 0.12, x - w * 0.5, top);
      ctx.fill();
      ctx.fillStyle = "#f2974a";
      ctx.beginPath();
      ctx.moveTo(x - w * 0.28, top);
      ctx.quadraticCurveTo(x - w * 0.2, y - s * 0.2, x, y - 2);
      ctx.quadraticCurveTo(x + w * 0.1, y - s * 0.3, x + w * 0.18, top);
      ctx.fill();
      ctx.strokeStyle = "rgba(150,80,28,0.5)"; // furrow rings
      ctx.lineWidth = 1.4;
      for (let i = 1; i <= 3; i++) {
        const ry = top + (y - top) * (i / 4);
        ctx.beginPath();
        ctx.moveTo(x - w * 0.42 * (1 - i * 0.18), ry);
        ctx.lineTo(x + w * 0.42 * (1 - i * 0.18), ry);
        ctx.stroke();
      }
    }
    // feathery carrot tops: more leaves, finer, brighter
    leafRosette(ctx, x, y, s, stage, rng, "#3f7a34", "#73ad4c", stage >= 2 ? 7 : 4);
  },

  soilpatch(ctx, x, y, opts = {}) {
    const w = opts.w ?? 300, h = w * 1.25;
    ctx.fillStyle = "#4a3520";
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h, w, h, 16);
    ctx.fill();
    ctx.fillStyle = "#5d4429";
    ctx.beginPath();
    ctx.roundRect(x - w / 2 + 5, y - h + 5, w - 10, h - 10, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(58,40,22,0.8)";
    ctx.lineWidth = 4;
    for (let i = 1; i <= 7; i++) {
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + 12, y - h + (h * i) / 8);
      ctx.lineTo(x + w / 2 - 12, y - h + (h * i) / 8);
      ctx.stroke();
    }
  },

  crop(ctx, x, y, opts = {}) {
    const s = opts.h ?? 90;
    painters.soil(ctx, x, y, { h: s * 0.8 });
    painters.turnip(ctx, x, y - s * 0.14, { stage: opts.stage ?? 3, h: s * 0.55, seed: opts.seed ?? 1 });
  },

  cottage(ctx, x, y, opts = {}) {
    // crude fallback; the real generated asset replaces this
    const w = opts.w ?? 280, h = w * 0.85;
    shadow(ctx, x, y - 4, w * 0.55, w * 0.16, 0.25);
    ctx.fillStyle = "#e8d9b8";
    ctx.fillRect(x - w * 0.32, y - h * 0.5, w * 0.64, h * 0.5);
    ctx.fillStyle = "#9c6a3c";
    ctx.beginPath();
    ctx.moveTo(x - w * 0.45, y - h * 0.48);
    ctx.lineTo(x, y - h * 0.95);
    ctx.lineTo(x + w * 0.45, y - h * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6b4a2e";
    ctx.fillRect(x - w * 0.08, y - h * 0.28, w * 0.16, h * 0.28);
  },

  character(ctx, x, y, opts = {}) {
    const h = opts.h ?? 64;
    shadow(ctx, x, y - 1, h * 0.28, h * 0.1, 0.25);
    // dress
    ctx.fillStyle = "#8a6b4a";
    ctx.beginPath();
    ctx.moveTo(x - h * 0.16, y);
    ctx.quadraticCurveTo(x - h * 0.18, y - h * 0.42, x, y - h * 0.48);
    ctx.quadraticCurveTo(x + h * 0.18, y - h * 0.42, x + h * 0.16, y);
    ctx.closePath();
    ctx.fill();
    // head
    ctx.fillStyle = "#f2c79a";
    ctx.beginPath();
    ctx.arc(x, y - h * 0.62, h * 0.17, 0, 7);
    ctx.fill();
    // hair
    ctx.fillStyle = "#d9924e";
    ctx.beginPath();
    ctx.arc(x, y - h * 0.66, h * 0.18, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
    ctx.fillRect(x - h * 0.18, y - h * 0.66, h * 0.07, h * 0.3);
    ctx.fillRect(x + h * 0.11, y - h * 0.66, h * 0.07, h * 0.3);
    // eyes
    ctx.fillStyle = "#3a2a1a";
    ctx.beginPath();
    ctx.arc(x - h * 0.06, y - h * 0.61, h * 0.018, 0, 7);
    ctx.arc(x + h * 0.06, y - h * 0.61, h * 0.018, 0, 7);
    ctx.fill();
  },

  villager(ctx, x, y, opts = {}) {
    // chibi townsfolk, recoloured per NPC; same proportions as the farmer
    const h = opts.h ?? 90;
    const skin = opts.skin ?? "#f2c79a";
    const hair = opts.hair ?? "#5a3a22";
    const dress = opts.dress ?? "#8a6b4a";
    shadow(ctx, x, y - 1, h * 0.26, h * 0.09, 0.25);
    // body
    ctx.fillStyle = dress;
    ctx.beginPath();
    ctx.moveTo(x - h * 0.17, y);
    ctx.quadraticCurveTo(x - h * 0.19, y - h * 0.4, x, y - h * 0.46);
    ctx.quadraticCurveTo(x + h * 0.19, y - h * 0.4, x + h * 0.17, y);
    ctx.closePath();
    ctx.fill();
    if (opts.apron) {
      ctx.fillStyle = opts.apron;
      ctx.beginPath();
      ctx.moveTo(x - h * 0.1, y);
      ctx.lineTo(x - h * 0.12, y - h * 0.34);
      ctx.lineTo(x + h * 0.12, y - h * 0.34);
      ctx.lineTo(x + h * 0.1, y);
      ctx.closePath();
      ctx.fill();
    }
    // head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(x, y - h * 0.6, h * 0.16, 0, 7);
    ctx.fill();
    // hair cap
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.arc(x, y - h * 0.64, h * 0.17, Math.PI * 0.92, Math.PI * 2.08);
    ctx.fill();
    if (opts.longHair) {
      ctx.fillRect(x - h * 0.17, y - h * 0.64, h * 0.06, h * 0.26);
      ctx.fillRect(x + h * 0.11, y - h * 0.64, h * 0.06, h * 0.26);
    }
    if (opts.hat) {
      ctx.fillStyle = opts.hat;
      ctx.beginPath();
      ctx.ellipse(x, y - h * 0.72, h * 0.26, h * 0.07, 0, 0, 7); // brim
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - h * 0.78, h * 0.13, Math.PI, 0); // crown
      ctx.fill();
    }
    // eyes
    ctx.fillStyle = opts.eyes ?? "#3a2a1a";
    ctx.beginPath();
    ctx.arc(x - h * 0.055, y - h * 0.59, h * 0.017, 0, 7);
    ctx.arc(x + h * 0.055, y - h * 0.59, h * 0.017, 0, 7);
    ctx.fill();
  },

  shop(ctx, x, y, opts = {}) {
    // fallback only; the village reuses the real cottage art for shops
    painters.cottage(ctx, x, y, opts);
  },

  chicken(ctx, x, y, opts = {}) {
    const s = opts.h ?? 34;
    shadow(ctx, x, y - 1, s * 0.5, s * 0.18, 0.2);
    ctx.fillStyle = "#f5f0e6";
    ctx.beginPath();
    ctx.ellipse(x, y - s * 0.38, s * 0.42, s * 0.34, 0, 0, 7);
    ctx.fill();
    ctx.beginPath(); // head
    ctx.arc(x + s * 0.3, y - s * 0.68, s * 0.2, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#d8d2c4"; // wing
    ctx.beginPath();
    ctx.ellipse(x - s * 0.08, y - s * 0.4, s * 0.2, s * 0.14, 0.2, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#c8442e"; // comb
    ctx.beginPath();
    ctx.arc(x + s * 0.3, y - s * 0.88, s * 0.08, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#e09a3e"; // beak
    ctx.beginPath();
    ctx.moveTo(x + s * 0.48, y - s * 0.68);
    ctx.lineTo(x + s * 0.62, y - s * 0.63);
    ctx.lineTo(x + s * 0.48, y - s * 0.58);
    ctx.fill();
    ctx.fillStyle = "#3a2a1a";
    ctx.beginPath();
    ctx.arc(x + s * 0.34, y - s * 0.7, s * 0.035, 0, 7);
    ctx.fill();
  },

  sign(ctx, x, y, opts = {}) {
    const s = opts.h ?? 64;
    shadow(ctx, x, y - 1, s * 0.4, s * 0.13, 0.2);
    ctx.fillStyle = "#6b4e30";
    ctx.fillRect(x - s * 0.05, y - s * 0.55, s * 0.1, s * 0.55);
    ctx.fillStyle = "#8a6a42";
    roundedFill(ctx, x - s * 0.38, y - s * 1.0, s * 0.76, s * 0.52, 6);
    ctx.strokeStyle = "#5d4226";
    ctx.lineWidth = 3;
    roundedStroke(ctx, x - s * 0.38, y - s * 1.0, s * 0.76, s * 0.52, 6);
    drawIcon(ctx, opts.icon ?? "leaf", x, y - s * 0.74, s * 0.22);
  },

  logpile(ctx, x, y, opts = {}) {
    const s = opts.h ?? 70;
    shadow(ctx, x, y - 2, s * 0.7, s * 0.2, 0.22);
    ctx.fillStyle = "#6b4e30";
    roundedFill(ctx, x - s * 0.6, y - s * 0.55, s * 1.2, s * 0.55, 6);
    const logs = [[-0.33, -0.32], [0, -0.32], [0.33, -0.32], [-0.17, -0.58], [0.17, -0.58]];
    for (const [lx, ly] of logs) {
      ctx.fillStyle = "#b08050";
      ctx.beginPath();
      ctx.arc(x + lx * s, y + ly * s, s * 0.16, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#8a6038";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + lx * s, y + ly * s, s * 0.09, 0, 7);
      ctx.stroke();
    }
  },

  tuft(ctx, x, y, opts = {}) {
    const s = opts.h ?? 12;
    ctx.strokeStyle = "rgba(80,115,55,0.85)";
    ctx.lineWidth = 1.6;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 2.4, y);
      ctx.quadraticCurveTo(x + i * 4, y - s * 0.7, x + i * 5.5, y - s);
      ctx.stroke();
    }
  },

  flower(ctx, x, y, opts = {}) {
    const s = opts.h ?? 7;
    const color = opts.color ?? "#f3ecd2";
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * s * 0.4, y - s + Math.sin(a) * s * 0.4, s * 0.3, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "#e8b94a";
    ctx.beginPath();
    ctx.arc(x, y - s, s * 0.25, 0, 7);
    ctx.fill();
  },
};

// Shared leaf rosette used by every root crop: a fan of stemmed leaves
// rising from the furrow, dark blades with a lighter heart.
function leafRosette(ctx, x, y, s, stage, rng, dark, light, count) {
  const leaves = count ?? (stage === 0 ? 2 : stage === 1 ? 4 : 5);
  const lh = s * (0.18 + stage * 0.09);
  const top = stage >= 3 ? y - s * 0.78 : y - 2;
  for (let i = 0; i < leaves; i++) {
    const a = -Math.PI / 2 + (i - (leaves - 1) / 2) * 0.4 + rng.range(-0.07, 0.07);
    const ex = x + Math.cos(a) * lh, ey = top + Math.sin(a) * lh;
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(2, s * 0.055);
    ctx.beginPath();
    ctx.moveTo(x, top + 2);
    ctx.quadraticCurveTo(x + Math.cos(a) * lh * 0.55, top + Math.sin(a) * lh * 0.85, ex, ey);
    ctx.stroke();
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.05, s * 0.07 + stage * 0.7, s * 0.11 + stage * 1.1, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.05, s * 0.035 + stage * 0.4, s * 0.07 + stage * 0.7, 0, 0, 7);
    ctx.fill();
    ctx.restore();
  }
}

function roundedFill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function roundedStroke(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}

function drawIcon(ctx, kind, x, y, s) {
  ctx.fillStyle = "#4a3320";
  ctx.strokeStyle = "#4a3320";
  ctx.lineWidth = Math.max(2, s * 0.18);
  if (kind === "fish") {
    ctx.beginPath();
    ctx.ellipse(x - s * 0.15, y, s * 0.55, s * 0.3, 0, 0, 7);
    ctx.moveTo(x + s * 0.35, y);
    ctx.lineTo(x + s * 0.75, y - s * 0.3);
    ctx.lineTo(x + s * 0.75, y + s * 0.3);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "tool") {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.5, y + s * 0.5);
    ctx.lineTo(x + s * 0.4, y - s * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + s * 0.45, y - s * 0.45, s * 0.22, 0, 7);
    ctx.fill();
  } else if (kind === "bird") {
    ctx.beginPath();
    ctx.arc(x - s * 0.2, y, s * 0.3, 0, 7);
    ctx.arc(x + s * 0.25, y - s * 0.25, s * 0.2, 0, 7);
    ctx.fill();
  } else { // leaf
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.28, s * 0.55, 0.6, 0, 7);
    ctx.fill();
  }
}
