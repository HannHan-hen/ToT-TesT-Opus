// Shared game state, persisted to localStorage. Everything that survives a
// map change or a reload lives here: the day clock, the wallet, seed and
// harvest inventories, the farm's crops, and Jay's affection. Maps and the
// core loop both import from here; maps never import the core, so there's
// no import cycle.

export const W = 1280, H = 960;

// Crop catalogue. `days` is grow time, `seed` the buy price at Marigold's.
// `stageW` is the draw width per growth stage (0..3), matching the turnip
// art's footprint. Sell prices live in GOODS below.
export const CROPS = {
  radish: { name: "radish", days: 2, seed: 4, stageW: [30, 60, 64, 62] },
  turnip: { name: "turnip", days: 3, seed: 5, stageW: [34, 73, 75, 73] },
  carrot: { name: "carrot", days: 4, seed: 9, stageW: [30, 62, 68, 74] },
};
export const SEED_ORDER = ["radish", "turnip", "carrot"]; // number-key order

// Everything sellable at the farm's shipping crate — crops plus the goods
// foraged in the forest and caught at the lake.
export const GOODS = {
  radish: { name: "radish", price: 6 },
  turnip: { name: "turnip", price: 8 },
  carrot: { name: "carrot", price: 13 },
  berry: { name: "berry", price: 5 },
  fish: { name: "fish", price: 9 },
};

const SAVE_KEY = "tale-of-three-turnips-v2";

export const state = {
  day: 4,
  time: 0,
  coins: 0,
  // start with the concept's 12 turnip seeds
  seeds: { radish: 0, turnip: 12, carrot: 0 },
  inv: { radish: 0, turnip: 0, carrot: 0, berry: 0, fish: 0 }, // sold at the crate
  selectedSeed: "turnip",
  // the concept-art arrangement, immediately playable (all turnips)
  crops: [3, 2, 3, 1, 3, 2, 3, 0, 3].map((s) => ({ type: "turnip", planted: 4 - s })),
  bushPicked: [], // forest berry bushes: day each was last foraged
  jayAffection: 0,
  jayTalkedDay: 0,
  phase: null,  // day transition: {name:"out"|"hold"|"in", t}
  mapId: "farm",
};

// transient feedback, drawn by the core HUD; any module may push to it
export const floats = [];
export function float(x, y, text) { floats.push({ x, y, text, age: 0 }); }

// a single active overlay (shop or dialogue), read by the core to render
// and by key handling to drive. null when the world is interactive.
export const ui = { menu: null };

// Crops grow over their own number of days but always render across the
// same four visual stages (sprout → leaves → budding → mature). Maturity is
// the only state that shows the root, and it lands exactly on the last day.
export const ageOf = (crop) => state.day - crop.planted;
export const isMature = (crop) => ageOf(crop) >= CROPS[crop.type].days;
export const stageOf = (crop) => {
  const a = ageOf(crop), d = CROPS[crop.type].days;
  return a >= d ? 3 : Math.min(2, Math.round((a / d) * 3));
};

export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: 2, day: state.day, coins: state.coins, seeds: state.seeds,
      inv: state.inv, selectedSeed: state.selectedSeed, crops: state.crops,
      bushPicked: state.bushPicked,
      jayAffection: state.jayAffection, jayTalkedDay: state.jayTalkedDay,
    }));
  } catch { /* storage unavailable — play on */ }
}

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.v === 2) {
      // merge inventories onto the defaults so saves from before a new
      // good (berry, fish, …) existed don't leave undefined counts
      Object.assign(state, {
        day: s.day, coins: s.coins, selectedSeed: s.selectedSeed, crops: s.crops,
        seeds: { ...state.seeds, ...s.seeds },
        inv: { ...state.inv, ...s.inv },
        bushPicked: s.bushPicked ?? [],
        jayAffection: s.jayAffection ?? 0, jayTalkedDay: s.jayTalkedDay ?? 0,
      });
    }
  } catch { /* fresh farm */ }
}
