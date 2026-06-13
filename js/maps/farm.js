// The home farm: the original scene (grass, mossy fence, trees, cottage,
// tilled plot) plus its gameplay — plant / grow / harvest crops and ship
// produce at the log crate. A gap in the right-hand fence leads to the
// village.
import { makeRng, offscreen, alongRoundedRect } from "../util.js";
import { drawSprite, getImage, hasRealArt } from "../assets.js";
import { painters } from "../placeholders.js";
import { W, H, CROPS, GOODS, state, float, stageOf, isMature, save } from "../state.js";

// fence ring geometry (the field boundary)
const RING = { x: 88, y: 78, w: 1104, h: 804, r: 72 };
const CHIMNEY = { x: 330, y: 88 };

// --- gameplay geometry ---
const PLOT = [];
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) PLOT.push({ x: 265 + col * 96, y: 559 + row * 96 });
}
const WALK = { x1: 118, y1: 132, x2: 1162, y2: 854 };
const BLOCKERS = [
  { x1: 150, y1: 240, x2: 452, y2: 376 },   // cottage footprint
  { x1: 962, y1: 196, x2: 1058, y2: 258 },  // shipping bin
  { x1: 1040, y1: 250, x2: 1125, y2: 302 }, // barrels
];
const BIN = { x: 1010, y: 250 };

const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// chicken: aimless pottering near its patch (lives with the farm)
const chicken = { x: 640, y: 320, vx: 0, vy: 0, timer: 0, flip: false };

function buildGround() {
  const c = offscreen(W, H);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const rng = makeRng(4242);

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
    let lg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1500);
    lg.addColorStop(0, "rgba(255,235,170,0.14)");
    lg.addColorStop(1, "rgba(255,235,170,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);
    lg = ctx.createRadialGradient(W, H, 0, W, H, 1500);
    lg.addColorStop(0, "rgba(40,52,26,0.18)");
    lg.addColorStop(1, "rgba(40,52,26,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#97a851");
    g.addColorStop(0.5, "#869c49");
    g.addColorStop(1, "#71883e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 420; i++) {
      const x = rng.range(0, W), y = rng.range(0, H);
      const r = rng.range(18, 85);
      const dark = rng() < 0.55;
      ctx.fillStyle = dark
        ? `rgba(86,112,52,${rng.range(0.05, 0.13)})`
        : `rgba(168,190,104,${rng.range(0.05, 0.11)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * rng.range(0.5, 0.8), rng.range(0, 3), 0, 7);
      ctx.fill();
    }
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 900; i++) {
      const x = rng.range(0, W), y = rng.range(0, H);
      const s = rng.range(3, 7);
      ctx.strokeStyle = rng() < 0.5
        ? `rgba(70,95,42,${rng.range(0.15, 0.3)})`
        : `rgba(150,175,90,${rng.range(0.12, 0.25)})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + rng.range(-2, 2), y - s * 0.7, x + rng.range(-3, 3), y - s);
      ctx.stroke();
    }
    for (let i = 0; i < 5200; i++) {
      const dark = rng() < 0.55;
      ctx.fillStyle = dark
        ? `rgba(60,82,38,${rng.range(0.04, 0.09)})`
        : `rgba(190,205,120,${rng.range(0.04, 0.08)})`;
      ctx.fillRect(rng.range(0, W), rng.range(0, H), rng.range(1, 2.4), rng.range(1, 2.4));
    }
  }

  for (let i = 0; i < 22; i++) {
    const x = rng.range(0, W), y = rng.range(0, H);
    const r = rng.range(70, 190);
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
    g2.addColorStop(0, `rgba(205,220,130,${rng.range(0.04, 0.08)})`);
    g2.addColorStop(1, "rgba(205,220,130,0)");
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
  }

  if (hasRealArt("tuft_small")) {
    const decals = [
      ["tuft_small", 17], ["tuft_small", 17], ["tuft_large", 26],
      ["daisies", 21], ["buttercups", 19], ["pebbles", 17], ["clover", 19],
    ];
    for (let i = 0; i < 120; i++) {
      const [key, base] = rng.pick(decals);
      drawSprite(ctx, key, rng.range(30, W - 30), rng.range(36, H - 16),
        { h: base * rng.range(0.8, 1.3), fallback: "tuft" });
    }
  } else {
    for (let i = 0; i < 70; i++) {
      const x = rng.range(60, W - 60), y = rng.range(60, H - 60);
      painters.flower(ctx, x, y, { h: rng.range(5, 8), color: rng.pick(["#f3ecd2", "#f0d98a", "#e9c8d4"]) });
    }
    for (let i = 0; i < 120; i++) {
      painters.tuft(ctx, rng.range(40, W - 40), rng.range(40, H - 40), { h: rng.range(8, 14) });
    }
  }

  for (let i = 0; i < 3; i++) {
    const inset = i * 26;
    ctx.fillStyle = "rgba(255,238,170,0.055)";
    ctx.beginPath();
    ctx.roundRect(RING.x + inset, RING.y + inset, RING.w - inset * 2, RING.h - inset * 2, RING.r - inset * 0.5);
    ctx.fill();
  }

  drawSprite(ctx, "plot", 361, 777, { w: 303, fallback: "soilpatch" });
  return c;
}

function buildStatics() {
  const ents = [];
  const add = (key, x, y, opts = {}) => ents.push({ key, x, y, opts });

  const treeRng = makeRng(1717);
  alongRoundedRect(RING.x - 26, RING.y - 26, RING.w + 52, RING.h + 52, RING.r, 42, (x, y) => {
    if (treeRng() < 0.38) return;
    const cx = W / 2, cy = H / 2;
    const dx = x - cx, dy = y - cy;
    const len = Math.hypot(dx, dy);
    const out = treeRng.range(10, 64);
    const tx = x + (dx / len) * out + treeRng.range(-22, 22);
    const ty = y + (dy / len) * out * 0.8 + treeRng.range(-16, 16);
    if (tx < -60 || tx > W + 60 || ty < 24 || ty > H + 70) return;
    const inFrontOfBottomFence = ty > RING.y + RING.h + 20;
    if (inFrontOfBottomFence && Math.abs(tx - W / 2) < 150) return;
    if (inFrontOfBottomFence && treeRng() < 0.4) return;
    if (treeRng() < 0.62) add("pine", tx, ty, { h: treeRng.range(100, 170), seed: treeRng.int(1, 9999) });
    else add("tree", tx, ty, { h: treeRng.range(90, 140), seed: treeRng.int(1, 9999) });
  });

  const F = RING;
  const ringRng = makeRng(31337);
  const yTop = F.y + 26, yBot = F.y + F.h + 26;
  const sideL = F.x + 6, sideR = F.x + F.w - 6;
  const signTopX = W / 2 - 180, signBotX = W / 2, signSideY = H / 2 - 40;
  if (hasRealArt("fence_h1")) {
    const SCALE = 110 / 341;
    const OPEN = { fence_h1_open: 253 * SCALE, fence_h2_open: 251 * SCALE };
    const chain = (y, x0, x1) => {
      let x = x0;
      while (x1 - x >= 40) {
        let key = ringRng() < 0.5 ? "fence_h1_open" : "fence_h2_open";
        if (OPEN[key] > x1 - x) key = "fence_h1_open";
        if (OPEN[key] > x1 - x) x = x1 - OPEN[key];
        const w = OPEN[key];
        add(key, x + w / 2, y, { w });
        x += w - 22;
      }
      add("fence_endpost", Math.min(x + 11, x1 - 6), y + 2, { w: 25 });
    };
    chain(yTop, sideL - 10, signTopX - 55);
    chain(yTop, signTopX + 55, sideR + 10);
    chain(yBot, sideL - 10, signBotX - 55);
    chain(yBot, signBotX + 55, sideR + 10);

    const vRun = (x, y0, y1) => {
      for (let y = y0; y < y1; y += 68) add("fence_v", x, y, { w: 56 });
    };
    for (const x of [sideL, sideR]) {
      vRun(x, yTop + 76, signSideY - 58);
      vRun(x, signSideY + 160, yBot - 46);
    }

    for (let i = 0; i < 34; i++) {
      const horizontal = ringRng() < 0.6;
      let ax, ay;
      if (horizontal) {
        ax = ringRng.range(F.x + 50, F.x + F.w - 50);
        const top = ringRng() < 0.5;
        ay = (top ? yTop : yBot) + ringRng.range(8, 18);
        const signX = top ? signTopX : signBotX;
        if (Math.abs(ax - signX) < 80) continue;
      } else {
        const left = ringRng() < 0.5;
        ax = left ? sideL + ringRng.range(16, 32) : sideR - ringRng.range(16, 32);
        ay = ringRng.range(F.y + 120, F.y + F.h - 10);
        if (Math.abs(ay - signSideY) < 70) continue;
      }
      if (ringRng() < 0.55) add("bush", ax, ay, { h: ringRng.range(34, 50), seed: ringRng.int(1, 9999), flowers: ringRng() < 0.5 });
      else add("rock", ax, ay, { h: ringRng.range(26, 44), seed: ringRng.int(1, 9999) });
    }

    add("pine", sideL + 4, yBot + 38, { h: 195, seed: 4242 });
    add("bush", sideL + 16, yTop + 30, { h: 58, seed: 777, flowers: true });
    add("rock", sideL + 44, yTop + 36, { h: 30, seed: 778 });
  } else {
    alongRoundedRect(RING.x, RING.y, RING.w, RING.h, RING.r, 30, (x, y) => {
      const jx = x + ringRng.range(-7, 7), jy = y + ringRng.range(-5, 5);
      const roll = ringRng();
      if (roll < 0.4) add("rock", jx, jy, { h: ringRng.range(34, 60), seed: ringRng.int(1, 9999) });
      else if (roll < 0.85) add("bush", jx, jy, { h: ringRng.range(42, 66), seed: ringRng.int(1, 9999), flowers: ringRng() < 0.5 });
      else add("tuft", jx, jy, { h: 13 });
    });
  }

  add("sign_sword", signTopX - 85, yTop + 10, { h: 78, fallback: "sign", icon: "tool" });
  add("sign_fish", sideL, signSideY - 48, { h: 74, fallback: "sign", icon: "fish" });
  add("sign_anvil", sideR, signSideY - 48, { h: 74, fallback: "sign", icon: "bird" });
  add("sign_hops", signBotX - 85, yBot + 10, { h: 78, fallback: "sign", icon: "leaf" });

  add("cottage", 300, 370, { w: 310 });
  add("crate", 1010, 250, { h: 78, fallback: "logpile" });
  add("barrels", 1085, 295, { h: 78, fallback: "logpile" });
  add("basket", 425, 398, { h: 54, fallback: "bush" });

  add("rock", 920, 700, { h: 20, seed: 5 });
  add("bush", 1040, 760, { h: 30, seed: 8, flowers: true });
  add("tuft", 520, 430, { h: 12 });
  add("tuft", 880, 380, { h: 12 });

  return ents;
}

function nearestCell(player) {
  let best = -1, bd = Infinity;
  PLOT.forEach((c, i) => {
    const d = dist(player.x, player.y, c.x, c.y);
    if (d < bd) { bd = d; best = i; }
  });
  return bd < 62 ? best : -1;
}
const nearBin = (player) => dist(player.x, player.y, BIN.x, BIN.y) < 115;
const nearChicken = (player) => dist(player.x, player.y, chicken.x, chicken.y) < 84;
const chickenPetted = () => state.chickenPetDay >= state.day;

export const farm = {
  id: "farm",
  walk: WALK,
  blockers: BLOCKERS,
  chimneys: [CHIMNEY],
  spawn: { x: 790, y: 520 },
  exits: [
    // gap in the right-hand fence, by the anvil sign → the village
    { rect: { x1: 1118, y1: 392, x2: 1162, y2: 508 }, to: "village",
      spawn: { x: 180, y: 470 }, label: "the village" },
    // left fence gap, by the fish sign → the lake
    { rect: { x1: 118, y1: 392, x2: 158, y2: 508 }, to: "lake",
      spawn: { x: 1080, y: 470 }, label: "the lake" },
    // bottom fence gap, by the leaf sign → the forest
    { rect: { x1: 560, y1: 816, x2: 720, y2: 854 }, to: "forest",
      spawn: { x: 640, y: 250 }, label: "the forest" },
    // top fence gap, by the sword sign → the ruins (a sword is required)
    { rect: { x1: 410, y1: 132, x2: 510, y2: 176 }, to: "ruins",
      spawn: { x: 648, y: 712 }, label: "the ruins",
      guard: () => state.equip.sword ? null : "the ruins are dangerous — buy a sword from Bramble first" },
  ],
  buildGround,
  buildStatics,

  update(dt) {
    chicken.timer -= dt;
    if (chicken.timer <= 0) {
      chicken.timer = 1.5 + Math.random() * 2.5;
      if (Math.random() < 0.4) {
        chicken.vx = chicken.vy = 0;
      } else {
        const a = Math.random() * Math.PI * 2;
        chicken.vx = Math.cos(a) * 26;
        chicken.vy = Math.sin(a) * 26;
      }
    }
    const cx = chicken.x + chicken.vx * dt, cy = chicken.y + chicken.vy * dt;
    if (dist(cx, cy, 660, 330) < 115) { chicken.x = cx; chicken.y = cy; }
    else chicken.timer = 0;
    if (chicken.vx) chicken.flip = chicken.vx < 0;
  },

  entities() {
    const ents = [];
    for (let i = 0; i < PLOT.length; i++) {
      const crop = state.crops[i];
      if (!crop) continue;
      const st = stageOf(crop);
      const w = CROPS[crop.type].stageW[st];
      ents.push({ key: `plant_${crop.type}_${st}`, x: PLOT[i].x, y: PLOT[i].y,
        opts: { h: w, fallback: crop.type, stage: st } });
    }
    ents.push({ key: "chicken", x: chicken.x, y: chicken.y, opts: { h: 68, flipX: chicken.flip } });
    return ents;
  },

  interact(player) {
    const i = nearestCell(player);
    if (i >= 0) {
      const crop = state.crops[i];
      const c = PLOT[i];
      if (!crop) {
        const seed = state.selectedSeed;
        if (state.seeds[seed] > 0) {
          state.seeds[seed]--;
          state.crops[i] = { type: seed, planted: state.day };
          float(c.x, c.y - 26, `planted ${seed}`);
        } else {
          float(c.x, c.y - 26, `no ${seed} seeds`);
        }
      } else if (isMature(crop)) {
        state.inv[crop.type]++;
        state.crops[i] = null;
        float(c.x, c.y - 44, `+1 ${crop.type}`);
      } else {
        float(c.x, c.y - 30, `day ${state.day - crop.planted + 1} of ${CROPS[crop.type].days}`);
      }
      save();
      return;
    }
    if (nearChicken(player)) {
      if (!chickenPetted()) {
        state.chickenPetDay = state.day;
        state.inv.egg++;
        float(chicken.x, chicken.y - 50, "+1 egg  ♥");
        save();
      } else {
        float(chicken.x, chicken.y - 50, "happily fed — come back tomorrow");
      }
      return;
    }
    if (nearBin(player)) {
      let gold = 0, count = 0;
      for (const t of Object.keys(state.inv)) {
        gold += state.inv[t] * GOODS[t].price;
        count += state.inv[t];
        state.inv[t] = 0;
      }
      if (count > 0) {
        state.coins += gold;
        float(BIN.x, BIN.y - 76, `+${gold}g`);
      } else {
        float(BIN.x, BIN.y - 76, "nothing to ship");
      }
      save();
    }
  },

  hint(player) {
    const i = nearestCell(player);
    if (i >= 0) {
      const crop = state.crops[i];
      if (!crop) return state.seeds[state.selectedSeed] > 0
        ? `Space — plant ${state.selectedSeed}`
        : `out of ${state.selectedSeed} seeds`;
      if (isMature(crop)) return "Space — harvest!";
      return `growing… day ${state.day - crop.planted + 1} of ${CROPS[crop.type].days}`;
    }
    if (nearChicken(player)) {
      return chickenPetted() ? "the hen is content for today" : "Space — pet the hen for an egg";
    }
    if (nearBin(player)) {
      const count = Object.values(state.inv).reduce((a, b) => a + b, 0);
      return count > 0 ? `Space — ship ${count} goods` : "the shipping crate — bring goods here";
    }
    return null;
  },
};
