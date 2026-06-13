# Tale of Three Turnips 🌱

A small, cute browser farming game.

**Play:** https://hannhan-hen.github.io/ToT-TesT-Opus/

## How to play

- **WASD / arrow keys** to walk, **Space / E** to interact — or just
  **click/tap** where you want to go (interacts on arrival).
- Press **1 · 2 · 3** to pick which seed to sow: radish (2-day), turnip
  (3-day), or carrot (4-day). Stand at the tilled field to **plant** the
  selected seed in empty cells and **harvest** mature ones.
- Carry your produce to the **log crate** (top right) to ship it for gold —
  faster crops pay less, slower crops pay more.
- **Pet the hen** once a day for a fresh **egg** to sell.
- Each **gap in the fence** leads somewhere — walk through to travel:
  - **Right → the village:** buy seeds from Marigold, buy a **sword and
    armour** from Bramble's forge, hear tips from Old Pip, say hello to Jay.
  - **Bottom → the forest:** **gather berries** from the bushes; they regrow
    fresh each morning.
  - **Left → the lake:** **cast a line** at the reedy fishing spots to catch
    fish.
  - **Top → the ruins:** a stone dungeon (a **sword from Bramble** is
    required). Mash **Space** to swing at the ruin-critters, dodge their
    touch — each hit costs a **heart** (armour buys you more). Clear a room
    to open the north door; rooms 2, 4 and 6 hold **bosses**, and the final
    chamber holds the **Ruin Heart**. Progress is saved between visits.
  - Carry berries and fish home and ship them at the crate, same as crops.
- A day lasts about a minute; nights pass with a fade. Progress saves
  locally in your browser.

## Where it's headed

Playable today: the **farm** (multi-crop growing, the hen/egg chore,
shipping), the **village** (Marigold's seeds, Bramble's weapons & armour,
Old Pip, Jay), the **forest** (berry foraging), the **lake** (fishing), and
the **ruins** (real-time combat through six rooms, three bosses, and the
Ruin Heart finale). Still to come toward the full first version — the
**Starless Set** relics, **farm threat** and crop-nibbler raids, gifting Jay
and the relationship ending, and a proper **results / high-score screen** —
all mapped out in [concept/concept.md](concept/concept.md), with the look
guided by the concept art beside it. We're building toward that, keeping
every step as cute as the reference.

## How it's built

- Plain HTML5 canvas, no build step, no dependencies. `index.html` + `js/`.
- Each location is a self-contained module in `js/maps/` (the farm, the
  village, …). `js/game.js` is the shared core — player, day clock, travel
  between maps, HUD, shop/dialogue panels — and `js/state.js` holds the saved
  game state. Walking into a gap in the fence travels to the next map.
- The scene is composed from individual sprites, y-sorted, with the dreamy
  look painted on top in code (`js/atmosphere.js`): warm light grade, god
  rays, drifting edge fog, chimney smoke, vignette.
- Every sprite key has a **procedural placeholder** (`js/placeholders.js`).
  Real AI-generated art (cleaned via `tools/process_asset.py`, declared in
  `assets/manifest.json`) overrides placeholders one asset at a time, so
  the scene is always complete while art trickles in.

## Asset pipeline

1. Generate art on a solid magenta (#FF00FF) background — prompts live in
   [PROMPTS.md](PROMPTS.md).
2. `python3 tools/process_asset.py` chroma-keys, defringes, trims and
   normalizes sprites (needs `pip install pillow numpy`).
3. Add the sprite to `assets/manifest.json`.

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
