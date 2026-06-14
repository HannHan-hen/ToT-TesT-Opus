import { loadAssets, drawSprite } from "./assets.js";
import { W, H } from "./state.js";
import { drawAtmosphere, updateSmoke } from "./atmosphere.js";
import { initGame, updateGame, frameData, drawHud, pointerTarget } from "./game.js";

const canvas = document.getElementById("game");
// Render into a backbuffer smaller than the logical 1280x960 and let the browser
// scale it up to the on-screen size. The game keeps thinking in W x H, so every
// map layout and coordinate is untouched; only the device pixel count drops,
// which makes all per-pixel work (sprite fills, the atmosphere blends) cheaper.
// Lower this for more speed / softer image; raise it toward 1 for more detail.
const RENDER_SCALE = 0.75;
canvas.width = Math.round(W * RENDER_SCALE);
canvas.height = Math.round(H * RENDER_SCALE);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingQuality = "high";

function fit() {
  const scale = Math.min(innerWidth / W, innerHeight / H);
  canvas.style.width = `${Math.floor(W * scale)}px`;
  canvas.style.height = `${Math.floor(H * scale)}px`;
}
addEventListener("resize", fit);
fit();

await loadAssets();
initGame();
document.getElementById("loading").remove();

canvas.addEventListener("pointerdown", (e) => {
  const r = canvas.getBoundingClientRect();
  pointerTarget((e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height));
});

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  const t = now / 1000;

  updateGame(dt, t);

  // map the 1280x960 logical space onto the smaller backbuffer for this frame
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);

  const { ground, entities, chimneys } = frameData(t);
  ctx.drawImage(ground, 0, 0);
  entities.sort((a, b) => a.y - b.y);
  for (const e of entities) drawSprite(ctx, e.key, e.x, e.y, e.opts);

  updateSmoke(dt, chimneys);
  drawAtmosphere(ctx, t);
  drawHud(ctx);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
