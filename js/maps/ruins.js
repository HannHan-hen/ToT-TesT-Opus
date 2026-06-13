// The ruins: a stone dungeon of escalating rooms reached through the farm's
// top gate (a sword is required). Real-time combat — mash Space to swing,
// dodge the contact damage. Clearing a room opens the north door to the next;
// rooms 2/4/6 hold bosses, and the final chamber holds the Ruin Heart.
// Room progress (ruinCleared) persists; a delve always starts at full hearts.
import { makeRng, offscreen } from "../util.js";
import { W, H, state, float, save, world, maxHearts } from "../state.js";

// stone room interior the player can walk in
const WALK = { x1: 252, y1: 244, x2: 1028, y2: 792 };
const FLOOR = { x1: 220, y1: 210, x2: 1060, y2: 822 };
const TOP_DOOR = { x1: 596, y1: 244, x2: 700, y2: 286 };
const BOT_DOOR = { x1: 596, y1: 752, x2: 700, y2: 792 };
const SEAL = { x1: 590, y1: 244, x2: 706, y2: 312 }; // blocks the north door until cleared
const ENTRY = { x: 648, y: 712 };
const PLAYER_R = 26;
const DAMAGE = 1;

const ROOMS = [
  { name: "Mossy Hall", spawn: [["critter", 2]] },
  { name: "Warden's Vault", boss: "Ruin Warden", spawn: [["warden", 1]] },
  { name: "Collapsed Gallery", spawn: [["critter", 3]] },
  { name: "Colossus Pit", boss: "Ruin Colossus", spawn: [["colossus", 1]] },
  { name: "Shattered Crossing", spawn: [["critter", 4]] },
  { name: "Sentinel's Rest", boss: "Ruin Sentinel", spawn: [["sentinel", 1]] },
  { name: "Heart of the Ruin", boss: "Ruin Heart", final: true, spawn: [["heart", 1]] },
];
const STATS = {
  critter: { hp: 2, speed: 58, r: 22, gold: 3, h: 52 },
  warden: { hp: 7, speed: 46, r: 40, gold: 22, h: 98 },
  colossus: { hp: 11, speed: 40, r: 48, gold: 36, h: 116 },
  sentinel: { hp: 15, speed: 66, r: 40, gold: 52, h: 98 },
  heart: { hp: 22, speed: 40, r: 58, gold: 120, h: 142 },
};

let room = 0;
let enemies = [];
let attackCd = 0, hurtCd = 0, slash = 0;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const inRect = (p, r) => p.x > r.x1 && p.x < r.x2 && p.y > r.y1 && p.y < r.y2;
const roomCleared = (r) => r < state.ruinCleared;

function makeEnemies(cfg) {
  const types = [];
  for (const [t, n] of cfg.spawn) for (let i = 0; i < n; i++) types.push(t);
  return types.map((t, i) => {
    const s = STATS[t];
    const n = types.length;
    const x = n === 1 ? 640 : 360 + (i / (n - 1)) * 560;
    const y = t === "critter" ? 350 + (i % 2) * 70 : 400;
    return { t, x, y, hp: s.hp, max: s.hp, speed: s.speed, r: s.r, gold: s.gold, h: s.h, boss: t !== "critter" };
  });
}

function spawnRoom(player) {
  player.x = ENTRY.x; player.y = ENTRY.y; player.target = null;
  enemies = roomCleared(room) ? [] : makeEnemies(ROOMS[room]);
  attackCd = hurtCd = slash = 0;
}

function goToRoom(n, player) { room = n; spawnRoom(player); }

function clearRoom() {
  state.ruinCleared = Math.max(state.ruinCleared, room + 1);
  const cfg = ROOMS[room];
  if (cfg.final) { state.won = true; float(W / 2, 320, "✦ The Ruin Heart shatters! ✦"); }
  else if (cfg.boss) float(W / 2, 320, `${cfg.boss} falls — the way deepens`);
  else float(W / 2, 320, "the room falls silent");
  save();
}

function defeat(player) {
  state.hearts = maxHearts();
  enemies = [];
  float(player.x, player.y - 70, "you retreat, wounded…");
  world.travel("farm", { x: 460, y: 210 });
}

function buildGround() {
  const c = offscreen(W, H);
  const ctx = c.getContext("2d");
  const rng = makeRng(7);

  ctx.fillStyle = "#14111b"; // void beyond the walls
  ctx.fillRect(0, 0, W, H);

  // flagstone floor
  ctx.fillStyle = "#3a3442";
  ctx.beginPath();
  ctx.roundRect(FLOOR.x1, FLOOR.y1, FLOOR.x2 - FLOOR.x1, FLOOR.y2 - FLOOR.y1, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(20,16,26,0.6)";
  ctx.lineWidth = 2;
  for (let x = FLOOR.x1 + 80; x < FLOOR.x2; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, FLOOR.y1); ctx.lineTo(x, FLOOR.y2); ctx.stroke();
  }
  for (let y = FLOOR.y1 + 70; y < FLOOR.y2; y += 70) {
    ctx.beginPath(); ctx.moveTo(FLOOR.x1, y); ctx.lineTo(FLOOR.x2, y); ctx.stroke();
  }
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = rng() < 0.5 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.06)";
    ctx.fillRect(rng.range(FLOOR.x1, FLOOR.x2), rng.range(FLOOR.y1, FLOOR.y2), rng.range(1, 3), rng.range(1, 3));
  }

  // thick stone wall ring
  ctx.strokeStyle = "#564f5e";
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.roundRect(FLOOR.x1, FLOOR.y1, FLOOR.x2 - FLOOR.x1, FLOOR.y2 - FLOOR.y1, 18);
  ctx.stroke();
  ctx.strokeStyle = "rgba(120,110,135,0.5)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // warm torch pools in the corners
  for (const [cx, cy] of [[FLOOR.x1 + 60, FLOOR.y1 + 60], [FLOOR.x2 - 60, FLOOR.y1 + 60], [FLOOR.x1 + 60, FLOOR.y2 - 60], [FLOOR.x2 - 60, FLOOR.y2 - 60]]) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 260);
    g.addColorStop(0, "rgba(255,180,90,0.16)");
    g.addColorStop(1, "rgba(255,180,90,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  return c;
}

function buildStatics() {
  const ents = [];
  const add = (key, x, y, opts = {}) => ents.push({ key, x, y, opts });
  // wall torches
  for (const x of [FLOOR.x1 + 70, FLOOR.x2 - 70]) {
    add("torch", x, FLOOR.y1 + 30, { h: 58 });
    add("torch", x, FLOOR.y2 - 6, { h: 58 });
  }
  // rubble in the corners
  const rng = makeRng(22);
  for (let i = 0; i < 6; i++) {
    add("rock", rng.pick([FLOOR.x1 + 70, FLOOR.x2 - 70]) + rng.range(-24, 24),
      rng.range(FLOOR.y1 + 120, FLOOR.y2 - 120), { h: rng.range(22, 40), seed: rng.int(1, 999) });
  }
  return ents;
}

export const ruins = {
  id: "ruins",
  walk: WALK,
  get blockers() { return roomCleared(room) ? [] : [SEAL]; },
  chimneys: [],
  spawn: ENTRY,
  exits: [], // navigation is handled internally (doors + the way home)
  buildGround,
  buildStatics,

  enter(player) {
    room = Math.min(state.ruinCleared, ROOMS.length - 1);
    state.hearts = maxHearts(); // arrive rested
    spawnRoom(player);
  },

  update(dt, t, player) {
    attackCd -= dt; hurtCd -= dt; if (slash > 0) slash -= dt;

    for (const e of enemies) {
      const dx = player.x - e.x, dy = player.y - e.y, d = Math.hypot(dx, dy) || 1;
      e.x = clamp(e.x + (dx / d) * e.speed * dt, WALK.x1, WALK.x2);
      e.y = clamp(e.y + (dy / d) * e.speed * dt, WALK.y1, WALK.y2);
      if (d < PLAYER_R + e.r && hurtCd <= 0) {
        state.hearts--; hurtCd = 1.15;
        player.x = clamp(player.x - (dx / d) * 48, WALK.x1, WALK.x2);
        player.y = clamp(player.y - (dy / d) * 48, WALK.y1, WALK.y2);
        float(player.x, player.y - 72, "-1 ♥");
        if (state.hearts <= 0) { defeat(player); return; }
      }
    }

    if (!roomCleared(room) && enemies.length === 0) clearRoom();

    // door transitions (player is set well clear of both doors on arrival)
    if (roomCleared(room) && room < ROOMS.length - 1 && inRect(player, TOP_DOOR)) goToRoom(room + 1, player);
    else if (inRect(player, BOT_DOOR)) {
      if (room > 0) goToRoom(room - 1, player);
      else world.travel("farm", { x: 460, y: 210 });
    }
  },

  // Space / E swings the sword: a radial slash that hits everything close.
  interact(player) {
    if (attackCd > 0) return;
    attackCd = 0.24; slash = 0.18;
    let gold = 0;
    enemies = enemies.filter((e) => {
      if (dist(player.x, player.y, e.x, e.y) <= PLAYER_R + e.r + 26) {
        e.hp -= DAMAGE;
        if (e.hp <= 0) { gold += e.gold; return false; }
      }
      return true;
    });
    if (gold > 0) {
      state.coins += gold;
      float(player.x, player.y - 70, `+${gold}g`);
      save();
    }
  },

  entities() {
    const ents = [];
    ents.push({ key: "ruindoor", x: 648, y: 300, opts: { w: 150, open: roomCleared(room) } });
    ents.push({ key: "ruindoor", x: 648, y: 820, opts: { w: 150, open: true } });
    for (const e of enemies) {
      ents.push({ key: "enemy", x: e.x, y: e.y + e.r, opts: { h: e.h, boss: e.boss, seed: Math.round(e.x) } });
    }
    return ents;
  },

  // the slash is drawn relative to the live player position by the core,
  // so expose it rather than baking a stale position into entities()
  effect(player) {
    return slash > 0 ? { key: "slash", x: player.x, y: player.y - 30, opts: { r: PLAYER_R + 42, k: slash / 0.18 } } : null;
  },

  hud(player) {
    const cleared = roomCleared(room);
    const bossName = (!cleared && ROOMS[room].boss) ? ROOMS[room].boss : null;
    const bossE = bossName ? enemies[0] : null;
    return {
      hearts: state.hearts, max: maxHearts(),
      room: room + 1, total: ROOMS.length, name: ROOMS[room].name,
      boss: bossName, bossHp: bossE ? bossE.hp / bossE.max : 0,
      won: state.won && cleared && ROOMS[room].final,
    };
  },

  hint(player) {
    if (inRect(player, BOT_DOOR)) return room > 0 ? "▼ back a room" : "▼ leave the ruins";
    if (enemies.length > 0) return "Space — swing your sword";
    if (roomCleared(room) && room < ROOMS.length - 1) return "cleared — the north door is open ▲";
    if (state.won) return "the Ruin Heart is no more — you are victorious";
    return "cleared";
  },
};
