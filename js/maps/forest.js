// The forest: a shaded clearing ringed and dotted with trees, where berry
// bushes can be foraged once a day and regrow by the next morning. Reached
// through the gap in the farm's bottom fence; the way back is at the top.
import { makeRng, offscreen } from "../util.js";
import { drawSprite, getImage, hasRealArt } from "../assets.js";
import { W, H, state, float, save, maybeStarlessDrop } from "../state.js";

const WALK = { x1: 118, y1: 150, x2: 1162, y2: 860 };

// foraging spots — each regrows berries every new day
const BERRY_BUSHES = [
  { x: 300, y: 430 }, { x: 540, y: 360 }, { x: 770, y: 408 }, { x: 990, y: 470 },
  { x: 360, y: 650 }, { x: 610, y: 712 }, { x: 860, y: 668 }, { x: 1040, y: 730 },
];

const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const available = (i) => (state.bushPicked[i] ?? 0) < state.day;
const nearestBush = (player) => {
  let best = -1, bd = 90;
  BERRY_BUSHES.forEach((b, i) => {
    const d = dist(player.x, player.y, b.x, b.y);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
};

function buildGround() {
  const c = offscreen(W, H);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const rng = makeRng(606);

  const grass = getImage("grass");
  if (grass) {
    const s = 0.7;
    const tw = grass.width * s, th = grass.height * s;
    for (let i = 0; i * tw < W; i++) {
      for (let j = 0; j * th < H; j++) {
        ctx.save();
        ctx.translate(i * tw, j * th);
        ctx.scale(i % 2 ? -1 : 1, j % 2 ? -1 : 1);
        ctx.drawImage(grass, i % 2 ? -tw : 0, j % 2 ? -th : 0, tw, th);
        ctx.restore();
      }
    }
  } else {
    ctx.fillStyle = "#6f8442";
    ctx.fillRect(0, 0, W, H);
  }

  // woodsy green shade, deepest toward the edges
  const g = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 760);
  g.addColorStop(0, "rgba(30,46,22,0)");
  g.addColorStop(1, "rgba(24,40,18,0.5)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // dappled light pools breaking through the canopy
  for (let i = 0; i < 30; i++) {
    const x = rng.range(0, W), y = rng.range(0, H);
    const r = rng.range(60, 170);
    const p = ctx.createRadialGradient(x, y, 0, x, y, r);
    p.addColorStop(0, `rgba(220,230,150,${rng.range(0.05, 0.1)})`);
    p.addColorStop(1, "rgba(220,230,150,0)");
    ctx.fillStyle = p;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }

  if (hasRealArt("tuft_small")) {
    const decals = [["tuft_small", 17], ["tuft_large", 28], ["clover", 20], ["pebbles", 16]];
    for (let i = 0; i < 130; i++) {
      const [key, base] = rng.pick(decals);
      drawSprite(ctx, key, rng.range(30, W - 30), rng.range(40, H - 16),
        { h: base * rng.range(0.8, 1.4), fallback: "tuft" });
    }
  }
  return c;
}

function buildStatics() {
  const ents = [];
  const add = (key, x, y, opts = {}) => ents.push({ key, x, y, opts });
  const rng = makeRng(1234);

  // a thick perimeter of trees, with a clear notch at the top for the path home
  for (let i = 0; i < 90; i++) {
    const edge = rng.int(0, 3);
    let x, y;
    if (edge === 0) { x = rng.range(-20, W + 20); y = rng.range(30, 150); }
    else if (edge === 1) { x = rng.range(-20, W + 20); y = rng.range(H - 70, H + 30); }
    else if (edge === 2) { x = rng.range(0, 130); y = rng.range(120, H - 30); }
    else { x = rng.range(W - 130, W); y = rng.range(120, H - 30); }
    if (edge === 0 && Math.abs(x - W / 2) < 110) continue; // keep the path home open
    if (rng() < 0.62) add("pine", x, y, { h: rng.range(120, 200), seed: rng.int(1, 9999) });
    else add("tree", x, y, { h: rng.range(100, 165), seed: rng.int(1, 9999) });
  }

  // scattered inner trees and undergrowth so the clearing reads as a forest
  for (let i = 0; i < 26; i++) {
    const x = rng.range(170, W - 170), y = rng.range(220, H - 120);
    // keep trees off the berry bushes and the entrance lane
    if (BERRY_BUSHES.some((b) => dist(x, y, b.x, b.y) < 110)) continue;
    if (Math.abs(x - W / 2) < 90 && y < 320) continue;
    if (rng() < 0.5) add("pine", x, y, { h: rng.range(95, 150), seed: rng.int(1, 9999) });
    else add("tree", x, y, { h: rng.range(90, 140), seed: rng.int(1, 9999) });
  }
  for (let i = 0; i < 16; i++) {
    const x = rng.range(150, W - 150), y = rng.range(220, H - 90);
    if (BERRY_BUSHES.some((b) => dist(x, y, b.x, b.y) < 80)) continue;
    if (rng() < 0.6) add("bush", x, y, { h: rng.range(28, 44), seed: rng.int(1, 9999), flowers: rng() < 0.4 });
    else add("rock", x, y, { h: rng.range(22, 40), seed: rng.int(1, 9999) });
  }
  return ents;
}

export const forest = {
  id: "forest",
  walk: WALK,
  blockers: [],
  chimneys: [],
  spawn: { x: 640, y: 260 },
  exits: [
    { rect: { x1: 560, y1: 150, x2: 720, y2: 196 }, to: "farm",
      spawn: { x: 640, y: 800 }, label: "the farm" },
  ],
  buildGround,
  buildStatics,

  update() {},

  entities() {
    return BERRY_BUSHES.map((b, i) => ({
      key: "bush_berry", x: b.x, y: b.y,
      opts: { h: 56, seed: i * 7 + 3, fallback: "bush", berries: available(i) },
    }));
  },

  interact(player) {
    const i = nearestBush(player);
    if (i < 0) return;
    const b = BERRY_BUSHES[i];
    if (available(i)) {
      state.inv.berry++;
      state.bushPicked[i] = state.day;
      float(b.x, b.y - 40, "+1 berry");
      if (maybeStarlessDrop("speed")) float(b.x, b.y - 66, "✦ Star-Stride! ✦");
      save();
    } else {
      float(b.x, b.y - 40, "picked clean today");
    }
  },

  hint(player) {
    const i = nearestBush(player);
    if (i < 0) return null;
    return available(i) ? "Space — gather berries" : "these berries will be back tomorrow";
  },
};
