# Asset prompt packs

> **Status:** Packs 1–5 received and integrated. The village, forest, lake
> and ruins (Packs 6–8) currently run on **procedural placeholders** —
> prompts below — and the shops temporarily reuse the cottage art. Remaining
> procedural-only art: radish/carrot crops, the four villagers, shop
> buildings, the berry bush, the ruin enemies/bosses, the dungeon door and
> stonework; plus the water, smoke, fog, light, hearts and slash (painted in
> code by design).

How this works: copy a prompt below into the image generator, attach the
reference image noted, paste the result into the chat. I (Claude) run it
through `tools/process_asset.py`, check coherence, and either slot it into
the scene or ask for a re-roll. Expect ~1.5–2 generations per final asset —
that's normal.

## Golden rules (apply to every prompt)

- Background must be **solid magenta (#FF00FF)** — no gradients, no shadows
  cast onto the background.
- Always **attach the spring cottage** (or another already-accepted asset)
  as a style reference.
- One consistent camera: **3/4 top-down view**, like the cottage — front
  face visible, top surface tilted toward the viewer.
- Light always comes from the **upper left**, soft and warm.

The shared style suffix used in every prompt:

> cozy storybook pixel-art hybrid, painterly shading, warm golden palette,
> thick soft outlines, 3/4 top-down view, soft light from the upper left,
> solid magenta background #FF00FF, no drop shadow on the background

---

## Pack 1 — the world frame

### 1a. Pine trees (one image, 2x2 grid)
> A 2x2 sprite sheet grid of four cute pine trees for a farming game, same
> style as the attached cottage: one tall pine, one medium pine, one short
> plump pine, one slightly leaning pine. Dark warm green needles with
> golden light catching the left side. Each tree centered in its grid cell.
> [style suffix]

### 1b. Round leafy trees (one image, 2x2 grid)
> A 2x2 sprite sheet grid of four cute round deciduous trees, same style as
> the attached cottage: fluffy blob-shaped canopies in two sizes, one with
> tiny white blossoms, one with a slightly darker canopy. [style suffix]

### 1c. Rocks and bushes (one image, 3x2 grid)
> A 3x2 sprite sheet grid: three mossy rounded boulders of different sizes
> on the top row, three small leafy bushes on the bottom row — one plain,
> one with tiny pink flowers, one with white flowers. Same style as the
> attached cottage. [style suffix]

## Pack 2 — the farm

### 2a. Turnip growth stages (one image, 4 in a row)

> **v2 — plants only, no soil.** The field is now one continuous dirt patch
> rendered separately, so crops must come without ground attached.

> A 1x4 sprite sheet, left to right: turnip plant growth stages on a plain
> magenta background with NO soil, NO dirt, NO ground — just the plant,
> as if pulled out for a sticker sheet. Stage 1: two tiny sprout leaves.
> Stage 2: a small leafy rosette. Stage 3: a lush leaf rosette with a small
> round purple-white turnip bulb at its base, bulb bottom flat. Stage 4: a
> plump round white turnip with a purple crown and a big lush leaf rosette,
> bulb bottom flat so it can sit in a furrow. [style suffix]

### 2b. Tilled soil tile (single)
> A single square tile of dark tilled farm soil with three soft horizontal
> furrow ridges, slightly rounded corners, a few small stones, seen from
> the same 3/4 top-down angle as the attached cottage. [style suffix]

### 2c. Wooden signs (one image, 2x2 grid)
> A 2x2 sprite sheet grid of four small wooden signposts, same wood tones
> as the attached cottage door: each a single plank board on a short post,
> with a carved icon — a fish, a watering can, a chicken, a leaf.
> [style suffix]

## Pack 3 — the residents

### 3a. Farmer girl (single)
> A cute small farmer girl standing facing the viewer, seen from the same
> high 3/4 angle as the attached cottage: strawberry-blonde hair, simple
> brown work dress over a cream shirt, small boots, gentle smile, chibi
> proportions (large head, small body), about as tall as the cottage door.
> [style suffix]

### 3b. Chicken (single)
> A cute plump white chicken with a red comb and orange beak, standing,
> seen from the same high 3/4 angle as the attached cottage, slightly
> turned to the right. [style suffix]

### 3c. Log pile in a wooden crate (re-roll, 2x2 grid)

> **v2.** The empty crates read oddly in-scene; filled and lower works
> better at this camera angle.

> A 2x2 sprite sheet grid of low rustic wooden storage, warm brown wood
> matching the attached cottage, seen from the same high 3/4 angle: a low
> open crate filled with stacked firewood logs showing their round cut
> ends; a crate overflowing with turnips; a low woven basket of vegetables;
> a small stack of wooden barrels. [style suffix]

## Pack 4 — the ground

### 4a. Grass texture (single, full-bleed — no magenta this time)
> A square seamless texture of soft meadow grass seen straight from above,
> for a cozy storybook farming game: muted warm yellow-green, gentle
> painterly blade clusters and subtle tonal patches, completely uniform
> soft lighting, no shadows, no vignette, no objects, no border, the
> pattern continues evenly to all four edges. Painterly pixel-art hybrid
> matching the attached cottage's palette.

### 4b. Ground decals (one image, 3x2 grid, magenta background)
> A 3x2 sprite sheet grid of tiny ground decorations, same style as the
> attached cottage: a small grass tuft, a larger leaning grass tuft, a
> cluster of three tiny white daisies, a cluster of small yellow flowers,
> three little grey pebbles, a patch of tiny clover leaves. [style suffix]

## Pack 5 — the mossy fence

> Replaces the bush/rock ring as the main boundary; bushes and rocks stay
> as accents in front of it. Segments repeat along the boundary with posts
> hiding the joints, so the segment ends should terminate AT a post.

### 5a. Fence kit (one image, 3x2 grid)
> A 3x2 sprite sheet grid of pieces of a cute overgrown mossy wooden farm
> fence, old warm brown wood with green moss patches, same style as the
> attached cottage, seen from the same high 3/4 angle. Top row: a
> horizontal fence segment with two rough log rails between two posts,
> moss on the rails; a second horizontal segment variant with more moss
> and tiny white flowers; a fence segment running vertically up the
> screen (receding away from the viewer) with two posts. Bottom row: a
> corner fence piece turning from horizontal to vertical; a single short
> mossy fence post; a small closed wooden gate between two posts with a
> tiny moss-covered arch. [style suffix]

## Pack 6 — the village

> The village reuses the cottage art for shops for now and draws the
> townsfolk procedurally. These prompts replace those placeholders. Keep the
> villagers the same chibi proportions and 3/4 angle as the farmer (3a).

### 6a. Radish growth stages (one image, 4 in a row)
> A 1x4 sprite sheet, left to right, plant-only on a plain magenta
> background with NO soil or ground, matching the turnip growth sheet:
> radish stages. Stage 1: two tiny sprout leaves. Stage 2: a small leafy
> rosette. Stage 3: a leafy rosette with a small round scarlet radish bulb
> peeking at its base. Stage 4: a plump round bright-red radish with a pale
> tip and a lush leaf rosette, bulb bottom flat so it can sit in a furrow.
> [style suffix]

### 6b. Carrot growth stages (one image, 4 in a row)
> A 1x4 sprite sheet, left to right, plant-only on a plain magenta
> background with NO soil or ground, matching the turnip growth sheet:
> carrot stages with feathery green tops. Stage 1: two tiny sprout leaves.
> Stage 2: a small feathery tuft. Stage 3: a fuller feathery top with an
> orange carrot shoulder just showing. Stage 4: a bright orange carrot
> tapering to a point with a big feathery green top, sitting flat so it can
> rest in a furrow. [style suffix]

### 6c. The four villagers (one image, 2x2 grid)
> A 2x2 sprite sheet grid of four cute chibi villagers, same proportions and
> high 3/4 angle as the attached farmer girl, each facing the viewer with a
> gentle expression, full body, standing. Top-left: Marigold, a kindly older
> seed-seller with grey hair in a bun, a lavender dress and a cream apron.
> Top-right: Bramble, a broad cheerful blacksmith with a dark beard, sleeves
> rolled, a heavy leather-and-steel apron. Bottom-left: Old Pip, a small
> elderly man with a wide straw hat, white hair and a moss-green tunic,
> leaning on a stick. Bottom-right: Jay, a shy slender young man, pale skin,
> straight black hair, grey eyes, a soft blue-grey tunic. [style suffix]

### 6d. Village shop buildings (one image, 2 side by side)
> Two cute storybook shop buildings side by side on a plain magenta
> background, same style and high 3/4 angle as the attached cottage. Left: a
> seed-and-produce shop with a green awning, baskets of vegetables by the
> door, and flower boxes. Right: a blacksmith's workshop with a stone
> chimney, an anvil out front, and warm forge-light in the window.
> [style suffix]

## Pack 7 — forest & lake

### 7a. Berry bushes (one image, 2 states side by side)
> Two cute round leafy berry bushes side by side on a plain magenta
> background, same style and high 3/4 angle as the attached cottage. Left:
> the bush laden with clusters of glossy red berries. Right: the same bush
> picked bare, just leaves. Warm golden light from the upper left.
> [style suffix]

### 7b. Lake props (one image, 2x2 grid)
> A 2x2 sprite sheet grid of cute lakeside props, same style as the attached
> cottage, high 3/4 angle: a clump of tall green reeds, a flat green lily pad
> with a tiny white flower, a mossy stepping stone, a little wooden fishing
> stake with a bobber. [style suffix]

> The water itself is painted in code (like the smoke and fog), so it needs
> no sprite — these are just the dressing along the shore.

## Pack 8 — the ruins

> Cute-but-spooky to match the storybook tone — menacing yet adorable, not
> grim. Same warm upper-left light and thick soft outlines as the cottage.

### 8a. Ruin critters (one image, 2x2 grid)
> A 2x2 sprite sheet grid of four small cute-spooky dungeon monsters for a
> storybook game, same style as the attached cottage: rounded gelatinous
> blobs in dusky blue-purple stone tones with big glowing amber eyes, each a
> little different (one round, one lumpy, one with little stubby legs, one
> with a chipped-stone shell). Adorable but a touch menacing. [style suffix]

### 8b. Ruin bosses (one image, 3 across)
> Three larger cute-spooky dungeon bosses side by side on a plain magenta
> background, same style as the attached cottage, seen from the same high 3/4
> angle: the Ruin Warden (a stout armoured stone golem with glowing red
> eyes), the Ruin Colossus (a huge mossy boulder-beast with heavy fists), and
> the Ruin Sentinel (a tall floating cracked-statue knight). Menacing but
> storybook-cute. [style suffix]

### 8c. The Ruin Heart (single)
> A single dramatic final-boss creature on a plain magenta background, same
> style as the attached cottage: a large floating crystalline dark-violet
> heart wrapped in cracked stone, pulsing with an inner red-gold glow, small
> jagged shards orbiting it. Awe-inspiring but still storybook-cute.
> [style suffix]

### 8d. Dungeon kit (one image, 2x2 grid)
> A 2x2 sprite sheet grid of cute dungeon set-pieces, same style as the
> attached cottage, high 3/4 angle: a heavy stone archway door with an iron
> portcullis (closed), the same archway open onto darkness, a cracked broken
> pillar, a mossy rubble pile. Dusky grey stone with warm torch-light on the
> left. [style suffix]

---

## Processing cheatsheet (my side)

```bash
# grids
python3 tools/process_asset.py raw/pines.png --grid 2x2 \
  --names pine_tall,pine_mid,pine_short,pine_lean -o assets/sprites --size 256

# singles
python3 tools/process_asset.py raw/chicken.png -o assets/sprites/chicken.png --size 128
```

Then add the new keys to `assets/manifest.json` — the scene picks them up
automatically and stops using the procedural placeholder.
