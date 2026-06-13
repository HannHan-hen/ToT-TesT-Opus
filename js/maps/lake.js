// The lake: a still blue pool ringed by reeds, with a few spots along the
// shore where you can cast a line for fish. Reached through the gap in the
// farm's left fence; the way back is on the right shore.
import { makeRng, offscreen } from "../util.js";
import { drawSprite, getImage, hasRealArt } from "../assets.js";
import { W, H, state, float, save } from "../state.js";

const WALK = { x1: 118, y1: 150, x2: 1162, y2: 860 };
const WATER = { cx: 480, cy: 500, rx: 300, ry: 220 };
// the open water you can't walk into (a rect inset within the ellipse)
const BLOCKERS = [{ x1: 200, y1: 320, x2: 760, y2: 690 }];
// shore spots you can fish from
const FISH_SPOTS = [{ x: 840, y: 480 }, { x: 700, y: 720 }, { x: 520, y: 760 }];

const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const nearestSpot = (player) => {
  let best = -1, bd = 108;
  FISH_SPOTS.forEach((s, i) => {
    const d = dist(player.x, player.y, s.x, s.y);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
};

function buildGround() {
  const c = offscreen(W, H);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const rng = makeRng(909);

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
    ctx.fillStyle = "#86a04a";
    ctx.fillRect(0, 0, W, H);
  }

  const { cx, cy, rx, ry } = WATER;
  // damp sandy shore ring
  ctx.save();
  ctx.fillStyle = "#9c8a5a";
  ctx.beginPath(); ctx.ellipse(cx, cy, rx + 26, ry + 22, 0, 0, 7); ctx.fill();
  // water body, deeper toward the middle
  const wg = ctx.createRadialGradient(cx - 60, cy - 50, 20, cx, cy, rx);
  wg.addColorStop(0, "#6fb4c8");
  wg.addColorStop(0.6, "#4f93b4");
  wg.addColorStop(1, "#3c6f99");
  ctx.fillStyle = wg;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill();
  // sun glint on the upper-left, matching the world light
  ctx.fillStyle = "rgba(255,250,230,0.22)";
  ctx.beginPath(); ctx.ellipse(cx - rx * 0.4, cy - ry * 0.45, rx * 0.32, ry * 0.18, -0.3, 0, 7); ctx.fill();
  // concentric ripples
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * (i / 5), ry * (i / 5), 0, 0, 7);
    ctx.stroke();
  }
  // lily pads (on the water, always behind the shore-bound player)
  ctx.clip(); // keep pads inside the water
  for (let i = 0; i < 7; i++) {
    const a = rng.range(0, 7), r = rng.range(0, rx * 0.8);
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * (ry / rx);
    ctx.fillStyle = "#4e7a3a";
    ctx.beginPath(); ctx.ellipse(px, py, 16, 11, rng.range(0, 3), 0, 7); ctx.fill();
    ctx.fillStyle = "#5f8f46";
    ctx.beginPath(); ctx.ellipse(px, py, 10, 7, 0, 0, 7); ctx.fill();
  }
  ctx.restore();

  if (hasRealArt("tuft_small")) {
    const decals = [["tuft_small", 17], ["tuft_large", 28], ["daisies", 20], ["pebbles", 16]];
    for (let i = 0; i < 90; i++) {
      const x = rng.range(30, W - 30), y = rng.range(40, H - 16);
      if (dist(x, y, cx, cy) < rx + 30) continue; // keep the water clear
      const [key, base] = rng.pick(decals);
      drawSprite(ctx, key, x, y, { h: base * rng.range(0.8, 1.3), fallback: "tuft" });
    }
  }
  return c;
}

function buildStatics() {
  const ents = [];
  const add = (key, x, y, opts = {}) => ents.push({ key, x, y, opts });
  const rng = makeRng(4040);
  const { cx, cy, rx, ry } = WATER;

  // trees framing the top and far sides
  for (let i = 0; i < 64; i++) {
    const edge = rng.int(0, 3);
    let x, y;
    if (edge === 0) { x = rng.range(-20, W + 20); y = rng.range(30, 150); }
    else if (edge === 1) { x = rng.range(-20, W + 20); y = rng.range(H - 70, H + 30); }
    else if (edge === 2) { x = rng.range(0, 120); y = rng.range(120, H - 30); }
    else { x = rng.range(W - 120, W); y = rng.range(120, H - 30); }
    if (edge === 3 && Math.abs(y - 470) < 110) continue; // keep the gate home clear
    if (rng() < 0.55) add("pine", x, y, { h: rng.range(115, 185), seed: rng.int(1, 9999) });
    else add("tree", x, y, { h: rng.range(100, 155), seed: rng.int(1, 9999) });
  }

  // reeds (tufts) and stones around the water's edge
  for (let i = 0; i < 40; i++) {
    const a = rng.range(0, 7);
    const ex = cx + Math.cos(a) * (rx + 30), ey = cy + Math.sin(a) * (ry + 26);
    if (FISH_SPOTS.some((s) => dist(ex, ey, s.x, s.y) < 50)) continue;
    if (rng() < 0.6) add("tuft", ex, ey, { h: rng.range(16, 30) });
    else add("rock", ex, ey, { h: rng.range(18, 34), seed: rng.int(1, 9999) });
  }

  // a tuft of reeds marks each fishing spot
  for (const s of FISH_SPOTS) add("bush", s.x + 26, s.y + 6, { h: 30, seed: 11, flowers: false });
  return ents;
}

export const lake = {
  id: "lake",
  walk: WALK,
  blockers: BLOCKERS,
  chimneys: [],
  spawn: { x: 1080, y: 470 },
  exits: [
    { rect: { x1: 1118, y1: 392, x2: 1162, y2: 508 }, to: "farm",
      spawn: { x: 200, y: 470 }, label: "the farm" },
  ],
  buildGround,
  buildStatics,

  update() {},

  entities() { return []; },

  interact(player) {
    const i = nearestSpot(player);
    if (i < 0) return;
    const s = FISH_SPOTS[i];
    if (Math.random() < 0.72) {
      state.inv.fish++;
      float(s.x, s.y - 30, "+1 fish!");
      save();
    } else {
      float(s.x, s.y - 30, "nothing's biting…");
    }
  },

  hint(player) {
    return nearestSpot(player) >= 0 ? "Space — cast your line" : null;
  },
};
