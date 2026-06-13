// The village: Marigold's seed shop, Bramble's blacksmith, Old Pip's hints,
// and shy Jay by the gate. The shop buildings reuse the cottage art so the
// place feels of a piece with the farm; the townsfolk are procedural chibis
// until real portraits arrive. A gap in the left fence leads home.
import { makeRng, offscreen } from "../util.js";
import { drawSprite, getImage, hasRealArt } from "../assets.js";
import { painters } from "../placeholders.js";
import { W, H, CROPS, SEED_ORDER, state, float, ui, save } from "../state.js";

const RING = { x: 88, y: 78, w: 1104, h: 804, r: 72 };
const WALK = { x1: 118, y1: 172, x2: 1162, y2: 840 };

const SEED_SHOP = { x: 360, y: 384, w: 276 };
const SMITH = { x: 884, y: 384, w: 276 };
const BLOCKERS = [
  { x1: SEED_SHOP.x - 120, y1: 250, x2: SEED_SHOP.x + 120, y2: 372 },
  { x1: SMITH.x - 120, y1: 250, x2: SMITH.x + 120, y2: 372 },
];

const chimney = (b) => ({ x: b.x + b.w * 0.1, y: b.y - b.w * 0.9 });

// The townsfolk. `paint` is forwarded to the villager placeholder painter.
const NPCS = [
  { name: "Marigold", x: 360, y: 512, kind: "shop", phase: 0.0,
    paint: { hair: "#b9b2a6", dress: "#7a5d8a", apron: "#ece2cf", longHair: true } },
  { name: "Bramble", x: 884, y: 512, kind: "smith", phase: 1.7,
    paint: { hair: "#33271b", dress: "#5a4a3a", apron: "#4a4d56", skin: "#e0a87a" } },
  { name: "Old Pip", x: 648, y: 624, kind: "pip", phase: 3.1,
    paint: { hair: "#cfc8ba", dress: "#6e7d52", hat: "#7a6240" } },
  { name: "Jay", x: 252, y: 612, kind: "jay", phase: 4.6,
    paint: { skin: "#f0ddcf", hair: "#1b1b22", eyes: "#6a6f78", dress: "#46566f", longHair: true } },
];

const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const nearestNpc = (player) => {
  let best = null, bd = 92;
  for (const n of NPCS) {
    const d = dist(player.x, player.y, n.x, n.y - 30);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
};

function buildGround() {
  const c = offscreen(W, H);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const rng = makeRng(2025);

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
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#97a851");
    g.addColorStop(1, "#71883e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // a dirt plaza with paths reaching the gate and each shop door
  const plaza = { x: 640, y: 600 };
  const path = (x1, y1, x2, y2, width) => {
    ctx.lineCap = "round";
    ctx.strokeStyle = "#9c7a4e";
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = "#b39466";
    ctx.lineWidth = width * 0.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(plaza.x, plaza.y, 190, 120, 0, 0, 7);
  ctx.fillStyle = "#9c7a4e"; ctx.fill();
  ctx.beginPath();
  ctx.ellipse(plaza.x, plaza.y, 176, 108, 0, 0, 7);
  ctx.fillStyle = "#b39466"; ctx.fill();
  ctx.restore();
  path(140, 478, plaza.x, plaza.y, 78);          // gate → plaza
  path(plaza.x, plaza.y, SEED_SHOP.x, 392, 70);   // plaza → seed shop
  path(plaza.x, plaza.y, SMITH.x, 392, 70);       // plaza → blacksmith

  // speckle the dirt so it isn't flat
  for (let i = 0; i < 600; i++) {
    const a = rng.range(0, 7), r = rng.range(0, 180);
    const x = plaza.x + Math.cos(a) * r, y = plaza.y + Math.sin(a) * r * 0.62;
    ctx.fillStyle = rng() < 0.5 ? "rgba(120,92,56,0.4)" : "rgba(190,165,120,0.35)";
    ctx.fillRect(x, y, rng.range(1, 3), rng.range(1, 3));
  }

  for (let i = 0; i < 22; i++) {
    const x = rng.range(0, W), y = rng.range(0, H);
    const r = rng.range(70, 190);
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
    g2.addColorStop(0, `rgba(205,220,130,${rng.range(0.04, 0.08)})`);
    g2.addColorStop(1, "rgba(205,220,130,0)");
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }

  if (hasRealArt("tuft_small")) {
    const decals = [["tuft_small", 17], ["tuft_large", 26], ["daisies", 21], ["buttercups", 19], ["clover", 19]];
    for (let i = 0; i < 90; i++) {
      const x = rng.range(30, W - 30), y = rng.range(36, H - 16);
      if (dist(x, y, plaza.x, plaza.y) < 170) continue; // keep the plaza swept
      const [key, base] = rng.pick(decals);
      drawSprite(ctx, key, x, y, { h: base * rng.range(0.8, 1.3), fallback: "tuft" });
    }
  }
  return c;
}

function buildStatics() {
  const ents = [];
  const add = (key, x, y, opts = {}) => ents.push({ key, x, y, opts });

  // a frame of trees, denser than the farm's, fading into the fog
  const treeRng = makeRng(515);
  for (let i = 0; i < 60; i++) {
    const edge = treeRng.int(0, 3);
    let x, y;
    if (edge === 0) { x = treeRng.range(-20, W + 20); y = treeRng.range(40, 150); }
    else if (edge === 1) { x = treeRng.range(-20, W + 20); y = treeRng.range(H - 60, H + 30); }
    else if (edge === 2) { x = treeRng.range(0, 110); y = treeRng.range(120, H - 40); }
    else { x = treeRng.range(W - 110, W); y = treeRng.range(120, H - 40); }
    if (edge === 2 && Math.abs(y - 478) < 110) continue; // keep the gate clear
    if (treeRng() < 0.6) add("pine", x, y, { h: treeRng.range(110, 180), seed: treeRng.int(1, 9999) });
    else add("tree", x, y, { h: treeRng.range(95, 150), seed: treeRng.int(1, 9999) });
  }

  // shop buildings (real cottage art, distinct seasons for variety)
  add("cottage_summer", SEED_SHOP.x, SEED_SHOP.y, { w: SEED_SHOP.w, fallback: "shop" });
  add("cottage_autumn", SMITH.x, SMITH.y, { w: SMITH.w, fallback: "shop" });

  // shop signs beside the doors
  add("sign_hops", SEED_SHOP.x + 150, SEED_SHOP.y + 8, { h: 74, fallback: "sign", icon: "leaf" });
  add("sign_anvil", SMITH.x - 150, SMITH.y + 8, { h: 74, fallback: "sign", icon: "bird" });

  // market dressing
  add("basket", SEED_SHOP.x - 120, SEED_SHOP.y + 30, { h: 50, fallback: "bush" });
  add("crate", SMITH.x + 120, SMITH.y + 24, { h: 70, fallback: "logpile" });
  add("barrels", 660, 470, { h: 70, fallback: "logpile" });

  // a hint signpost by the gate home
  add("sign_fish", 150, 560, { h: 70, fallback: "sign", icon: "leaf" });

  // scattered flora
  const r = makeRng(88);
  for (let i = 0; i < 10; i++) {
    add("bush", r.range(120, W - 120), r.range(720, 830), { h: r.range(30, 46), seed: r.int(1, 9999), flowers: r() < 0.6 });
  }
  return ents;
}

export const village = {
  id: "village",
  walk: WALK,
  blockers: BLOCKERS,
  chimneys: [chimney(SEED_SHOP), chimney(SMITH)],
  spawn: { x: 200, y: 470 },
  exits: [
    { rect: { x1: 118, y1: 404, x2: 162, y2: 536 }, to: "farm",
      spawn: { x: 1090, y: 460 }, label: "the farm" },
  ],
  buildGround,
  buildStatics,

  update() {},

  entities(t) {
    return NPCS.map((n) => ({
      key: `npc_${n.kind}`, x: n.x, y: n.y - Math.abs(Math.sin(t * 1.4 + n.phase)) * 2,
      opts: { h: 96, fallback: "villager", ...n.paint },
    }));
  },

  interact(player) {
    const n = nearestNpc(player);
    if (!n) return;
    if (n.kind === "shop") {
      ui.menu = {
        type: "shop", title: "Marigold's Seeds",
        items: SEED_ORDER.map((s) => ({ seed: s, label: `${CROPS[s].name} (${CROPS[s].days}-day)`, price: CROPS[s].seed })),
        note: "number to buy · Esc to leave",
      };
      return;
    }
    if (n.kind === "smith") {
      ui.menu = { type: "dialogue", name: "Bramble", page: 0, lines: [
        "Bramble looks up from the forge.",
        "\"Swords and armour for the ruins? Aye — once you've coin to spend. My wares aren't ready just yet.\"",
      ] };
      return;
    }
    if (n.kind === "pip") {
      ui.menu = { type: "dialogue", name: "Old Pip", page: 0, lines: [
        "\"Plant seeds in the tilled soil, then ship the harvest at the log crate for gold.\"",
        "\"Marigold there sells radish, turnip and carrot — quicker crops, slower crops, each pays different.\"",
        "\"Press the number keys to pick which seed you'll sow.\"",
      ] };
      return;
    }
    if (n.kind === "jay") {
      jayTalk();
      return;
    }
  },

  hint(player) {
    const n = nearestNpc(player);
    if (!n) return null;
    if (n.kind === "shop") return "Space — browse Marigold's seeds";
    return `Space — talk to ${n.name}`;
  },
};

function jayTalk() {
  const tier = state.jayAffection;
  let line;
  if (state.jayTalkedDay >= state.day) {
    line = "\"We've spoken today already… but I don't mind the company.\"";
  } else {
    state.jayTalkedDay = state.day;
    state.jayAffection = Math.min(99, state.jayAffection + 1);
    if (tier <= 0) line = "Jay glances away shyly. \"Oh — hello. You're the new farmer, aren't you?\"";
    else if (tier < 3) line = "\"Back again? I, um… I like hearing about the farm.\"";
    else if (tier < 6) line = "\"You really fight monsters AND grow turnips? That's… kind of amazing.\"";
    else line = "Jay smiles, no longer looking away. \"I'm always glad when it's you at the gate.\"";
    save();
  }
  ui.menu = { type: "dialogue", name: "Jay", page: 0, lines: [line] };
}
