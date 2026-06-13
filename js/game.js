// Core loop glue: the player, the day clock, travel between maps, the HUD,
// and the shop/dialogue overlays. Map-specific scenery and interactions live
// in js/maps/*; this module just drives them and owns everything shared.
import { drawSprite } from "./assets.js";
import { W, H, CROPS, SEED_ORDER, state, floats, ui, save, load } from "./state.js";
import { farm } from "./maps/farm.js";
import { village } from "./maps/village.js";
import { forest } from "./maps/forest.js";
import { lake } from "./maps/lake.js";

const DAY_LENGTH = 60; // seconds
const MAPS = { farm, village, forest, lake };
const currentMap = () => MAPS[state.mapId];

const player = { x: farm.spawn.x, y: farm.spawn.y, speed: 175, facing: 1, moving: false, target: null };
const keys = new Set();
let justArrived = false;

const groundCache = {};
const staticsCache = {};
const groundFor = (id) => (groundCache[id] ??= MAPS[id].buildGround());
const staticsFor = (id) => (staticsCache[id] ??= MAPS[id].buildStatics());

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function initGame() {
  window.__tot = state; // debug handle
  load();
  const sp = currentMap().spawn;
  player.x = sp.x; player.y = sp.y;

  addEventListener("keydown", onKeyDown);
  addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
}

function onKeyDown(e) {
  if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
  const k = e.key.toLowerCase();
  keys.add(k);
  if (e.repeat) return;

  if (ui.menu) { menuKey(e.key, k); return; }

  const seedIdx = "123".indexOf(e.key);
  if (seedIdx >= 0 && seedIdx < SEED_ORDER.length) state.selectedSeed = SEED_ORDER[seedIdx];
  if (k === " " || k === "e") interact();
}

function menuKey(key, k) {
  const m = ui.menu;
  if (key === "Escape" || k === "q") { ui.menu = null; return; }
  if (m.type === "shop") {
    const d = "123456789".indexOf(key);
    if (d >= 0 && d < m.items.length) buySeed(m, m.items[d]);
    return;
  }
  if (m.type === "dialogue") {
    if (k === " " || k === "e" || key === "Enter") {
      m.page++;
      if (m.page >= m.lines.length) ui.menu = null;
    }
  }
}

function buySeed(menu, item) {
  if (state.coins >= item.price) {
    state.coins -= item.price;
    state.seeds[item.seed]++;
    menu.bought = `bought 1 ${item.seed}`;
    save();
  } else {
    menu.bought = "not enough gold";
  }
}

function interact() {
  if (state.phase) return;
  currentMap().interact(player);
}

export function pointerTarget(x, y) {
  if (ui.menu || state.phase) return;
  const w = currentMap().walk;
  player.target = { x: clamp(x, w.x1, w.x2), y: clamp(y, w.y1, w.y2), interact: true };
}

function blocked(x, y) {
  const map = currentMap();
  const w = map.walk;
  if (x < w.x1 || x > w.x2 || y < w.y1 || y > w.y2) return true;
  return map.blockers.some((b) => x > b.x1 && x < b.x2 && y > b.y1 && y < b.y2);
}

const inRect = (x, y, r) => x > r.x1 && x < r.x2 && y > r.y1 && y < r.y2;

function travel(exit) {
  state.mapId = exit.to;
  player.x = exit.spawn.x; player.y = exit.spawn.y;
  player.target = null;
  justArrived = true;
  save();
}

export function updateGame(dt, t) {
  for (let i = floats.length - 1; i >= 0; i--) {
    floats[i].age += dt;
    if (floats[i].age > 1.4) floats.splice(i, 1);
  }

  if (ui.menu) return; // the world holds still while a panel is open

  if (state.phase) {
    const p = state.phase;
    const DUR = { out: 0.8, hold: 0.9, in: 0.8 };
    p.t += dt;
    if (p.t >= DUR[p.name]) {
      if (p.name === "out") {
        state.day++;
        state.time = 0;
        save();
        state.phase = { name: "hold", t: 0 };
      } else if (p.name === "hold") {
        state.phase = { name: "in", t: 0 };
      } else {
        state.phase = null;
      }
    }
    return;
  }

  // movement: keys win over a click target
  let dx = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
  let dy = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
  if (dx || dy) player.target = null;
  else if (player.target) {
    const tdx = player.target.x - player.x, tdy = player.target.y - player.y;
    const d = Math.hypot(tdx, tdy);
    if (d < 6) {
      if (player.target.interact) interact();
      player.target = null;
    } else { dx = tdx / d; dy = tdy / d; }
  }
  player.moving = !!(dx || dy);
  if (player.moving) {
    const len = Math.hypot(dx, dy);
    const nx = player.x + (dx / len) * player.speed * dt;
    const ny = player.y + (dy / len) * player.speed * dt;
    if (!blocked(nx, player.y)) player.x = nx;
    if (!blocked(player.x, ny)) player.y = ny;
    if (dx) player.facing = Math.sign(dx);
  }

  // map travel through fence openings
  const exits = currentMap().exits;
  const onExit = exits.find((ex) => inRect(player.x, player.y, ex.rect));
  if (onExit && !justArrived) travel(onExit);
  else if (!onExit) justArrived = false;

  currentMap().update(dt, t);

  state.time += dt;
  if (state.time >= DAY_LENGTH) state.phase = { name: "out", t: 0 };
}

// Everything the renderer needs for this frame: the ground bitmap, the full
// y-sortable entity list (scenery + actors + player), and smoke origins.
export function frameData(t) {
  const map = currentMap();
  const ents = staticsFor(map.id).concat(map.entities(t));
  const bob = player.moving ? Math.abs(Math.sin(t * 11)) * 3 : 0;
  ents.push({ key: "farmer", x: player.x, y: player.y - bob,
    opts: { h: 122, flipX: player.facing < 0, fallback: "character" } });
  return { ground: groundFor(map.id), entities: ents, chimneys: map.chimneys };
}

// ---- HUD ----
export function drawHud(ctx) {
  ctx.save();

  // status panel
  ctx.fillStyle = "rgba(50,36,21,0.78)";
  ctx.strokeStyle = "rgba(243,230,200,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(16, 16, 318, 120, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f3e6c8";
  ctx.font = "20px Georgia, serif";
  ctx.fillText(`Day ${state.day}`, 34, 44);
  ctx.beginPath();
  ctx.fillStyle = "#e8c04a";
  ctx.arc(120, 37, 8, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#f3e6c8";
  ctx.font = "18px Georgia, serif";
  ctx.fillText(`${state.coins}g`, 134, 44);

  // seeds (selected highlighted), keyed 1·2·3
  ctx.font = "15px Georgia, serif";
  ctx.fillStyle = "rgba(243,230,200,0.7)";
  ctx.fillText("Seeds", 34, 72);
  SEED_ORDER.forEach((s, i) => {
    const x = 34 + i * 98;
    const on = state.selectedSeed === s;
    ctx.fillStyle = on ? "#ffe08a" : "rgba(243,230,200,0.85)";
    ctx.font = `${on ? "bold " : ""}15px Georgia, serif`;
    ctx.fillText(`${i + 1} ${s} ${state.seeds[s]}`, x, 94);
  });

  // goods on hand (crops, berries, fish, eggs — anything sellable)
  const carried = Object.keys(state.inv).filter((g) => state.inv[g] > 0).map((g) => `${g} ${state.inv[g]}`);
  ctx.font = "15px Georgia, serif";
  ctx.fillStyle = "rgba(243,230,200,0.7)";
  ctx.fillText("Goods", 34, 120);
  ctx.fillStyle = "rgba(243,230,200,0.9)";
  ctx.fillText(carried.length ? carried.join("  ") : "—", 100, 120);

  // context hint
  ctx.font = "16px Georgia, serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(30,20,10,0.8)";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "rgba(248,238,214,0.92)";
  ctx.fillText(hintText(), W / 2, H - 22);
  ctx.shadowBlur = 0;

  // floating feedback
  for (const f of floats) {
    const a = f.age < 0.2 ? f.age / 0.2 : 1 - (f.age - 0.2) / 1.2;
    ctx.globalAlpha = Math.max(0, a);
    ctx.font = "18px Georgia, serif";
    ctx.fillStyle = "#fdf6e3";
    ctx.shadowColor = "rgba(30,20,10,0.9)";
    ctx.shadowBlur = 5;
    ctx.fillText(f.text, f.x, f.y - f.age * 26);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = "left";

  if (ui.menu) drawMenu(ctx);
  drawNightFade(ctx);
  ctx.restore();
}

function hintText() {
  if (ui.menu) return ui.menu.type === "shop" ? "number — buy · Esc — leave" : "Space — continue";
  const map = currentMap();
  const h = map.hint(player);
  if (h) return h;
  for (const ex of map.exits) {
    const r = ex.rect;
    if (player.x > r.x1 - 70 && player.x < r.x2 + 70 && player.y > r.y1 - 70 && player.y < r.y2 + 70) {
      return `↦ walk through to ${ex.label}`;
    }
  }
  return "WASD / arrows — move · Space — interact · 1·2·3 — pick seed";
}

function drawMenu(ctx) {
  const m = ui.menu;
  const bw = 520, lines = m.type === "shop" ? m.items.length + 3 : wrap(ctx, m.lines[m.page] ?? "", bw - 60).length + 2;
  const bh = 56 + lines * 30;
  const bx = (W - bw) / 2, by = (H - bh) / 2;

  ctx.fillStyle = "rgba(38,27,15,0.92)";
  ctx.strokeStyle = "rgba(243,230,200,0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 16);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "left";
  if (m.type === "shop") {
    ctx.fillStyle = "#ffe7b0";
    ctx.font = "22px Georgia, serif";
    ctx.fillText(m.title, bx + 28, by + 44);
    ctx.font = "17px Georgia, serif";
    ctx.fillStyle = "rgba(243,230,200,0.55)";
    ctx.fillText(`${state.coins}g`, bx + bw - 80, by + 44);
    m.items.forEach((it, i) => {
      const y = by + 84 + i * 30;
      ctx.fillStyle = "#f3e6c8";
      ctx.font = "17px Georgia, serif";
      ctx.fillText(`[${i + 1}]  ${it.label}`, bx + 36, y);
      ctx.fillStyle = "#e8c04a";
      ctx.textAlign = "right";
      ctx.fillText(`${it.price}g`, bx + bw - 36, y);
      ctx.textAlign = "left";
    });
    ctx.fillStyle = "rgba(243,230,200,0.7)";
    ctx.font = "italic 15px Georgia, serif";
    ctx.fillText(m.bought ?? m.note, bx + 36, by + bh - 22);
  } else {
    ctx.fillStyle = "#ffe7b0";
    ctx.font = "20px Georgia, serif";
    ctx.fillText(m.name, bx + 28, by + 44);
    ctx.fillStyle = "#f3e6c8";
    ctx.font = "18px Georgia, serif";
    wrap(ctx, m.lines[m.page] ?? "", bw - 60).forEach((ln, i) => {
      ctx.fillText(ln, bx + 28, by + 80 + i * 28);
    });
    ctx.fillStyle = "rgba(243,230,200,0.55)";
    ctx.font = "italic 14px Georgia, serif";
    ctx.textAlign = "right";
    ctx.fillText(m.page < m.lines.length - 1 ? "Space ▸" : "Space — close", bx + bw - 28, by + bh - 20);
    ctx.textAlign = "left";
  }
}

function wrap(ctx, text, maxW) {
  ctx.font = "18px Georgia, serif";
  const words = text.split(" ");
  const out = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; }
    else line = test;
  }
  if (line) out.push(line);
  return out;
}

function drawNightFade(ctx) {
  if (!state.phase) return;
  const p = state.phase;
  const alpha = p.name === "out" ? p.t / 0.8 : p.name === "in" ? 1 - p.t / 0.8 : 1;
  ctx.fillStyle = `rgba(16,11,6,${Math.min(1, alpha) * 0.96})`;
  ctx.fillRect(0, 0, W, H);
  if (alpha > 0.65) {
    ctx.globalAlpha = (alpha - 0.65) / 0.35;
    ctx.fillStyle = "#f3e6c8";
    ctx.font = "46px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(`Day ${state.day}`, W / 2, H / 2 - 8);
    ctx.font = "18px Georgia, serif";
    ctx.fillStyle = "rgba(243,230,200,0.75)";
    ctx.fillText("the crops stretch toward the morning sun", W / 2, H / 2 + 28);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }
}
