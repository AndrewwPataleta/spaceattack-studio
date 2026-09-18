// LevelDoc — the single SERIALIZABLE document that describes a whole level. Everything (3D generator, editor,
// validator, playtest, save/share) reads from THIS, instead of the static consts in layout.ts. The static layout
// is now just the DEFAULT document (defaultDoc), so the existing arenas keep rendering exactly as before.
import { buildLayout, SPAWNS, edges, worldTop, THICK, BEAM, type Plat, type Link } from "./layout";
import { testMapDoc } from "./testMap"; // TEST: the studio "Default" map, used by every mode for playtesting
import { mainMapDoc } from "./mainMapClient"; // BACKEND-published #studio map (preferred over the baked default)

export type StyleId = "station" | "mine" | "crystal" | "wreck";

// per-object skin: object id (plat id / `ramp:a-b` / `ladder:a-b`) -> a StyleId override (else the level's meta.style).
export type SkinMap = Record<string, StyleId>;

// a depth layer for the 2.5D parallax: FAR skybox / MID backdrop / FORE framing. src = dataURL (uploaded mock) or "".
// w/h override the plane size (stretch); ox/oy offset it.
export type ParallaxLayer = { id: string; name: string; kind: "far" | "mid" | "fore"; z: number; parallax: number; src: string; tint?: string; w?: number; h?: number; ox?: number; oy?: number };

// a decoration prop. `type` picks the rendered mesh: "box" (generic paletted MID box) or a KIT prop (crate / barrel /
// pipe / cable). ALL of them are movable (x/y/z) + editable in #studio — nothing is hard-coded/uneditable anymore.
// x,y = anchor (base for crate/barrel; centre for pipe/cable/box). w = size/length. solid = has a collider (cover).
export type DecorKind = "box" | "crate" | "barrel" | "pipe" | "cable" | "jumppad" | "teleport" | "lift" | "model";
export type DecorProp = {
  id: string; x: number; y: number; z: number; w: number; h: number; label: string; style?: StyleId;
  type?: DecorKind; r?: number; len?: number; count?: number; dir?: "h" | "v"; variant?: "signal" | "power"; solid?: boolean; explosive?: boolean; cryo?: boolean;
  // jumppad: `power` (launch vy). teleport: `pair` (partner id) + accent. lift: `rise` (travel height) + `speed`.
  power?: number; pair?: string; rise?: number; speed?: number;
  // model: a GLB landmark prop (e.g. a listening-post tower). src = glb path, scale = uniform size, ry = yaw.
  src?: string; scale?: number; ry?: number;
};

// DEFAULT scene decor as editable props (single source for both the seeded templates and the auto-fallback render):
// framing pipes, cables hanging under raised platforms, and crates/barrels on the decks. Returns plain data so it can
// seed a doc (then every piece is draggable in the editor).
export function defaultDecor(plats: Plat[]): DecorProp[] {
  const out: DecorProp[] = [];
  const ground = plats.find((p) => p.kind === "ground");
  const L = (ground ? ground.w / 2 : 30) - 1.5;
  const groundTop = worldTop(0);
  // framing pipes (vertical at both edges + one horizontal depth run)
  out.push({ id: "kit:pipeL", label: "труба", type: "pipe", dir: "v", x: -L, y: 1, z: 2.4, w: 12, h: 0.34, r: 0.17 });
  out.push({ id: "kit:pipeR", label: "труба", type: "pipe", dir: "v", x: L, y: 1, z: 2.4, w: 12, h: 0.34, r: 0.17 });
  out.push({ id: "kit:pipeD", label: "труба", type: "pipe", dir: "h", x: 0, y: 6, z: -3.5, w: L * 1.4, h: 0.4, r: 0.2 });
  // cables hang from the UNDERSIDE of raised platforms
  const raised = plats.filter((p) => p.kind !== "ground" && !p.z);
  raised.forEach((p, i) => {
    const by = worldTop(p.y) - (THICK[p.kind ?? "mid"] ?? BEAM) - 0.02;
    const len = Math.max(0.8, Math.min(2.4, by - groundTop - 0.5));
    out.push({ id: `kit:cable:${p.id}`, label: "кабели", type: "cable", x: edges(p).L + 0.8, y: by, z: 0.7, w: 0.4, h: len, len, count: 4, variant: i % 2 ? "power" : "signal" });
  });
  // crates + barrels on the ground (a mix of solid cover and pure decor)
  out.push({ id: "kit:crateA", label: "ящик", type: "crate", x: -L * 0.7, y: groundTop, z: 0.2, w: 1.05, h: 1.05, solid: true });
  out.push({ id: "kit:crateB", label: "ящик", type: "crate", x: -L * 0.7 + 1.1, y: groundTop, z: 0.2, w: 0.85, h: 0.85 });
  out.push({ id: "kit:barrelA", label: "бочка", type: "barrel", x: -L * 0.55, y: groundTop, z: 0.2, w: 0.96, h: 1.1, r: 0.48, solid: true });
  out.push({ id: "kit:barrelB", label: "бочка", type: "barrel", x: L * 0.66, y: groundTop, z: 0.2, w: 0.96, h: 1.1, r: 0.48 });
  out.push({ id: "kit:crateC", label: "ящик", type: "crate", x: L * 0.72, y: groundTop, z: 0.2, w: 1.05, h: 1.05, solid: true });
  return out;
}

// a bot ROAM NODE placed on a walkable surface. Searching bots pick these at RANDOM to wander the whole map (never a
// fixed loop). Auto-seeded by genWaypoints() from the geometry, then hand-editable in #studio's route mode. tag is
// cosmetic (colour/intent hint). Absent/empty → the nav generator seeds a fresh set from the surfaces.
export type Waypoint = { id: string; x: number; y: number; tag: "cover" | "centre" | "edge" | "perch" };

export type LevelDoc = {
  meta: { name: string; style: StyleId; version: number };
  plats: Plat[];
  links: Link[];
  spawns: string[];
  skins: SkinMap;
  layers: ParallaxLayer[];
  decor: DecorProp[];
  hidden: string[]; // ids of generated parts hidden by the user (e.g. `sup:ground` support columns)
  waypoints?: Waypoint[]; // bot roam nodes (optional; genNav seeds them when absent)
};

export const DOC_VERSION = 1;
export const LS_KEY = "studio_doc";

export type LayoutData = { plats: Plat[]; links: Link[] };
export const layoutOf = (d: LevelDoc): LayoutData => ({ plats: d.plats, links: d.links });

// The DEFAULT document = the canonical hand-authored 4v4 arena from layout.ts. Used by every arena that doesn't
// load a custom doc, so nothing regresses.
export function defaultDoc(): LevelDoc {
  // SINGLE SOURCE: «в бой» / online DM plays the #studio-authored level. It now prefers the BACKEND-published main
  // map (mainMapDoc(), fetched via preloadMainMap during matchmaking) so what you build in #studio — on ANY origin —
  // is what you play, live, without a code deploy. Falls back to the baked defaultArena.json (offline / backend-down).
  return mainMapDoc() ?? testMapDoc();
  // FALLBACK (dead) — the old hand-authored Cosmos 4v4. Re-enable by removing the return above.
  // eslint-disable-next-line no-unreachable
  const { plats, links } = buildLayout();
  return {
    meta: { name: "Cosmos 4v4", style: "station", version: DOC_VERSION },
    plats: plats.map((p) => ({ ...p })),
    links: links.map((l) => ({ ...l })),
    spawns: [...SPAWNS],
    skins: {},
    // generated world backdrop as a FAR parallax layer (sky + fortress-canyon, no foreground platforms)
    layers: [{ id: "worldbg", name: "far", kind: "far", z: -58, parallax: 0.03, src: "/cosmos/bg-canyon.webp", w: 200, h: 100, oy: 22 }],
    // GLB landmark: the "Celestial Listening Post" tower, set BEHIND the play plane (z negative) as scenery. Editable
    // in #studio (drag / scale / yaw). Non-colliding — it's a backdrop prop, not gameplay cover.
    decor: [{ id: "model:listenpost", label: "вышка-антенна", type: "model", src: "/cosmos/world/tower.glb", x: -13, y: worldTop(0) - 3, z: -34, w: 4, h: 8, scale: 8, ry: 0.5 }],
    hidden: [],
  };
}

// COMPACT 1v1 DUEL arena, rebuilt from scratch on our patterns (mirror-symmetric, validated reach): ground + a
// central jump-up island (ladder), two side tiers per side linked by ramps, spawns on the outer perches. Cover
// crates/pipes/cables are auto-placed by the generator (SceneDecor). Backdrop = our world.
const WORLD_BG: ParallaxLayer = { id: "worldbg", name: "far", kind: "far", z: -58, parallax: 0.03, src: "/cosmos/bg-canyon.webp", w: 200, h: 100, oy: 22 };

// EMPTY STARTER for a brand-new studio user: just the ground floor + a spawn + the world backdrop, nothing else.
// So everyone builds their OWN level from scratch (земля → платформы → высота → лестницы) instead of inheriting
// the demo arena. loadDoc() returns this when there's no saved level yet.
export function starterDoc(): LevelDoc {
  return {
    meta: { name: "Мой уровень", style: "station", version: DOC_VERSION },
    plats: [{ id: "ground", x: 0, y: 0, w: 30, kind: "ground" }],
    links: [],
    spawns: ["ground"],
    skins: {},
    layers: [{ ...WORLD_BG }],
    decor: [],
    hidden: [],
  };
}

export function duelDoc(): LevelDoc {
  return testMapDoc(); // TEST OVERRIDE: duel plays the studio "Default" map. Revert to restore the compact duel arena.
  const CENTER: Plat[] = [
    { id: "ground", x: 0, y: 0, w: 42, kind: "ground" },
    { id: "island", x: 0, y: 2.0, w: 6, kind: "island" },
  ];
  const HALF: Plat[] = [
    { id: "lowR", x: 10, y: 1.8, w: 9, kind: "low", team: "red" },
    { id: "highR", x: 18, y: 3.8, w: 7, kind: "high", team: "red" },
  ];
  const CLINK: Link[] = [{ a: "ground", b: "island", kind: "ladder", x: 0 }];
  const HLINK: Link[] = [{ a: "ground", b: "lowR", kind: "ramp" }, { a: "lowR", b: "highR", kind: "ramp" }];
  const mp = (p: Plat): Plat => ({ ...p, id: p.id.replace(/R$/, "L"), x: -p.x, team: p.team === "red" ? "blue" : p.team });
  const ml = (l: Link): Link => ({ a: l.a.replace(/R$/, "L"), b: l.b.replace(/R$/, "L"), kind: l.kind, x: l.x != null ? -l.x : undefined });
  const plats = [...CENTER, ...HALF, ...HALF.map(mp)];
  return {
    meta: { name: "Дуэль-арена", style: "station", version: DOC_VERSION },
    plats,
    links: [...CLINK, ...HLINK, ...HLINK.map(ml)],
    spawns: ["highR", "highL"], skins: {}, layers: [{ ...WORLD_BG }], decor: defaultDecor(plats), hidden: [],
  };
}
// ЦИТАДЕЛЬ — the cohesive, hand-decorated 4v4 battle map (playable vs bots at #battle). Geometry = the canonical
// buildLayout() arena (wide floor, ramp climb per side to the high spawn perches, central jump-up island + high
// bridge). Its bot NAV lives in shared/nav.mjs as "citadel" (surfaces/portals match this geometry). The decor below
// (cover crates on the floor/tiers/perches + scattered barrels, framing pipes & hanging cables) is placed so the
// rendered cover lines up with the nav blockers → bots take the same cover the player sees. Lots of props = dynamics.
export function citadelDoc(): LevelDoc {
  return testMapDoc(); // TEST OVERRIDE
  // 3-STOREY, FULL-HEIGHT. Floors are spaced 2.8m apart → 2.0m clearance under each (≥1.95 WALK_CLEAR): you STAND
  // everywhere, never crouch, never clip. Tiers step OUTWARD (abut, no overhang) so ramps don't pinch. Each step is
  // climbed by a RAMP (bots + you) AND a LADDER at the same step (you, a fast vertical shortcut). Mirror-symmetric.
  // Every node verified by the #analyze physics agent; ladders climb because CosmosArena now feeds live zones.
  const F2 = 1.8, F3 = 3.6;  // 2nd/3rd-floor step heights (v2-proven 1.8m steps: the Fighter cleanly crests these
                             // ramps; taller/longer ramps it couldn't). Tiers step OUTWARD with a GAP the ramp
                             // bridges (open-sky, no overhang → you STAND everywhere, never crouch/clip).
  const F4 = 5.4; // sniper-nest roof reached by a LADDER off the 3rd floor
  const R: Plat[] = [
    { id: "f2R", x: 20, y: F2, w: 8, kind: "low", team: "red" },    // 16..24  2nd floor (gap 3 from the floor edge)
    { id: "f3R", x: 31, y: F3, w: 8, kind: "high", team: "red" },   // 27..35  3rd floor SPAWN (gap 3 from f2R)
    { id: "nestR", x: 38, y: F4, w: 6, kind: "high", team: "red" }, // 35..41  sniper nest — ABUTS f3R at 35 (no overhang)
  ];
  const C: Plat[] = [
    { id: "floor", x: 0, y: 0, w: 26, kind: "ground" },             // -13..13 1st-floor battleground
  ];
  // JUMP-UP + MANTLE test platforms (standalone — no ramp/ladder, reached by JUMPING / MANTLING). Placed clear of the
  // ramp feet (≈x±12.9), jump-pads (x±10.5), teleporters (x±13) and the lift (x0, footprint ±2).
  const T: Plat[] = [
    { id: "jumpA", x: -7, y: 1.7, w: 3, kind: "low" },        // simple JUMP-UP step (dy 1.7 < apex 2.4 → land on it)
    { id: "ledgeM", x: 7, y: 3.0, w: 3.5, kind: "low" },      // MANTLE ledge — just ABOVE jump reach → grab the lip + climb
    { id: "liftLedge", x: 4.5, y: 2.8, w: 3, kind: "low" },   // beside the lift TOP → ride up, hop across / mantle onto it
  ];
  // RAMPS bridge the gapped tiers (walkable — bots + you). The LADDER climbs the abutting nest step (f3→nest share the
  // x=35 column, so the ladder has floor below + nest above and NO overhang → you climb it up/down, no crouch).
  const RL: Link[] = [
    { a: "floor", b: "f2R", kind: "ramp" },
    { a: "f2R", b: "f3R", kind: "ramp" },
    { a: "f3R", b: "nestR", kind: "ladder", x: 35 },
  ];
  const mp = (p: Plat): Plat => ({ ...p, id: p.id.replace(/R$/, "L"), x: -p.x, team: p.team === "red" ? "blue" : p.team });
  const ml = (l: Link): Link => ({ a: l.a.replace(/R$/, "L"), b: l.b.replace(/R$/, "L"), kind: l.kind, x: l.x != null ? -l.x : undefined });
  const plats = [...C, ...T, ...R, ...R.map(mp)];
  const links = [...RL, ...RL.map(ml)];

  const gy = worldTop(0);
  const D: DecorProp[] = [];
  const crate = (id: string, x: number, y: number, s: number, solid?: boolean): DecorProp => ({ id, label: "ящик", type: "crate", x, y, z: 0, w: s, h: s, solid });
  const barrel = (id: string, x: number, y: number, solid?: boolean): DecorProp => ({ id, label: "бочка", type: "barrel", x, y, z: 0, w: 0.96, h: 1.1, r: 0.48, solid });
  // SOLID cover (bump-into) — kept in the CENTRE of each deck, CLEAR of the ramp feet (floor ramp foot ≈ x12.9,
  // f2 deck 16..24, f3 27..35) so you never land off a ramp straight into a solid prop and wedge ("run into texture").
  D.push(crate("kit:crfR", 4, gy, 1.0, true), crate("kit:crfL", -4, gy, 1.0, true));                     // floor centre cover
  D.push(crate("kit:cr2R", 18, worldTop(F2), 0.9, true), crate("kit:cr2L", -18, worldTop(F2), 0.9, true)); // 2nd-floor cover (deck middle)
  D.push(crate("kit:cr3R", 31, worldTop(F3), 0.9, true), crate("kit:cr3L", -31, worldTop(F3), 0.9, true)); // 3rd-floor spawn cover
  // scattered DECOR barrels (NON-solid = no collider → never block): lived-in look
  D.push(barrel("kit:brR", 2.5, gy), barrel("kit:brL", -2.5, gy));
  // HAZARD barrels — shoot them. RED (frag) = damage blast; BLUE (cryo) = freeze/slow blast. Kept OFF the ramp feet.
  const xbar = (id: string, x: number, y: number, cryo?: boolean): DecorProp => ({ id, label: "бочка", type: "barrel", x, y, z: 0, w: 0.96, h: 1.1, r: 0.5, solid: true, explosive: !cryo, cryo });
  D.push(xbar("kit:xbarR", 8, gy), xbar("kit:xbarL", -8, gy));              // floor frag (red)
  D.push(xbar("kit:cryoR", 6, gy, true), xbar("kit:cryoL", -6, gy, true));   // floor cryo (blue)
  D.push(xbar("kit:xbar2R", 20, worldTop(F2)), xbar("kit:xbar2L", -20, worldTop(F2))); // 2nd-floor frag
  D.push(crate("kit:crStkR", 6, gy + 1.0, 0.8), crate("kit:crStkL", -6, gy + 1.0, 0.8)); // stacked look on the floor crate (non-solid)
  // ── MAP MOVERS ──────────────────────────────────────────────────────────────────────────────────────────────
  // JUMP-PADS on the floor near each tower base → launch up to skip the ramp (power = launch vy).
  D.push({ id: "kit:padR", label: "батут", type: "jumppad", x: 10.5, y: gy, z: 0, w: 2.2, h: 0.2, r: 1.1, power: 15 });
  D.push({ id: "kit:padL", label: "батут", type: "jumppad", x: -10.5, y: gy, z: 0, w: 2.2, h: 0.2, r: 1.1, power: 15 });
  // TELEPORTERS — a floor pair for fast flanks across the open floor (exit coords stored in r=tx, len=ty world).
  D.push({ id: "kit:tpA", label: "телепорт", type: "teleport", x: -13, y: gy, z: 0, w: 1.8, h: 2, pair: "kit:tpB", r: 13, len: gy });
  D.push({ id: "kit:tpB", label: "телепорт", type: "teleport", x: 13, y: gy, z: 0, w: 1.8, h: 2, pair: "kit:tpA", r: -13, len: gy });
  // LIFT — central moving platform, floor ↔ ~3rd-floor height (a vertical route through the middle).
  D.push({ id: "kit:lift", label: "лифт", type: "lift", x: 0, y: 0, z: 0, w: 4, h: 0.5, rise: 3.4, speed: 0.6 });
  // framing pipes (vertical at the far edges + one deep horizontal run high up)
  D.push({ id: "kit:pipeR", label: "труба", type: "pipe", dir: "v", x: 30, y: 3, z: 2.4, w: 12, h: 0.34, r: 0.17 });
  D.push({ id: "kit:pipeL", label: "труба", type: "pipe", dir: "v", x: -30, y: 3, z: 2.4, w: 12, h: 0.34, r: 0.17 });
  D.push({ id: "kit:pipeTop", label: "труба", type: "pipe", dir: "h", x: 0, y: 8, z: -3.5, w: 44, h: 0.4, r: 0.2 });
  // cables hanging under the raised decks
  for (const p of plats.filter((pp) => pp.kind !== "ground" && !pp.z)) {
    const by = worldTop(p.y) - BEAM - 0.02, len = Math.max(0.9, Math.min(2.0, by - gy - 0.6));
    D.push({ id: `kit:cbl:${p.id}`, label: "кабели", type: "cable", x: edges(p).L + 0.9, y: by, z: 0.7, w: 0.4, h: len, len, count: p.kind === "low" ? 4 : 3, variant: p.kind === "high" ? "power" : "signal" });
  }
  return {
    meta: { name: "Цитадель 4×4", style: "station", version: DOC_VERSION },
    plats, links, spawns: ["f3R", "f3L"], skins: {}, layers: [{ ...WORLD_BG }], decor: D, hidden: [],
  };
}

// ЯРУСЫ — a two-level ladder sandbox (wide floor + two high side decks + a small central bridge reached by a player
// LIFT). It USED to be a bespoke component (tiers.tsx) with its own hardcoded ladder array + inline beams — the last
// map that bypassed the doc pipeline. Now it's a normal LevelDoc so EVERY map flows the same way: CosmosArena renders
// it and genLadderZones publishes its climb zones. Ladders: two per side deck (inner x±8 + outer x±16 = a loop, no
// dead end); the centre is the LIFT, not a ladder. Nav (shared/nav.mjs TIERS) already uses these same x's.
export function tiersDoc(): LevelDoc {
  return testMapDoc(); // TEST OVERRIDE
  const DECK = 3.0;
  const plats: Plat[] = [
    { id: "ground", x: 0, y: 0, w: 38, kind: "ground" },
    { id: "deckL", x: -12.5, y: DECK, w: 11, kind: "high", team: "blue" },  // spans -18..-7
    { id: "deckR", x: 12.5, y: DECK, w: 11, kind: "high", team: "red" },    // spans 7..18
    { id: "bridge", x: 0, y: DECK, w: 7, kind: "bridge" },                   // exposed high-ground, reached by the lift
  ];
  const links: Link[] = [ // distinct ids: two ladders share the SAME plat pair, so `ladder:a-b` alone would collide
    { a: "ground", b: "deckR", kind: "ladder", x: 8,  id: "ladder:RI" },
    { a: "ground", b: "deckR", kind: "ladder", x: 16, id: "ladder:RO" },
    { a: "ground", b: "deckL", kind: "ladder", x: -8,  id: "ladder:LI" },
    { a: "ground", b: "deckL", kind: "ladder", x: -16, id: "ladder:LO" },
  ];
  const fy = worldTop(0), dy = worldTop(DECK);
  const crate = (id: string, x: number, y: number, s = 1.0): DecorProp => ({ id, label: "ящик", type: "crate", x, y, z: 0, w: s, h: s, solid: true });
  const decor: DecorProp[] = [
    { id: "tiers-lift", label: "лифт", type: "lift", x: 0, y: -0.15, z: 0, w: 3.4, h: 0.5, rise: 3.0, speed: 1.0 }, // centre floor→bridge
    crate("cov:fL2", -5, fy), crate("cov:fR2", 5, fy), crate("cov:fL1", -11, fy), crate("cov:fR1", 11, fy),        // floor cover (~6m cadence)
    crate("cov:dL", -12, dy, 0.9), crate("cov:dR", 12, dy, 0.9),                                                   // deck cover
  ];
  return {
    meta: { name: "Ярусы", style: "station", version: DOC_VERSION },
    plats, links, spawns: ["deckL", "deckR"], skins: {}, layers: [{ ...WORLD_BG }], decor, hidden: [],
  };
}

// BLANK level — start from scratch: one ground floor, nothing else (no tiers/decor/backdrop). For building a level
// procedurally in #studio greybox, then adding props/textures later.
export function blankDoc(): LevelDoc {
  return {
    meta: { name: "Новый уровень", style: "station", version: DOC_VERSION },
    plats: [{ id: "ground", x: 0, y: 0, w: 40, kind: "ground" }],
    links: [], spawns: [], skins: {}, layers: [], decor: [], hidden: [], waypoints: [],
  };
}

const TPL: Record<string, () => LevelDoc> = { duel: duelDoc, arena: defaultDoc, citadel: citadelDoc, tiers: tiersDoc, blank: blankDoc };

export function cloneDoc(d: LevelDoc): LevelDoc {
  return JSON.parse(JSON.stringify(d));
}

export function serialize(d: LevelDoc): string {
  return JSON.stringify({ ...d, meta: { ...d.meta, version: DOC_VERSION } });
}

// tolerant load: fills any missing field so old/partial JSON still opens.
export function deserialize(json: string): LevelDoc {
  const raw = typeof json === "string" ? JSON.parse(json) : json;
  const base = defaultDoc();
  const d: LevelDoc = {
    meta: { name: raw?.meta?.name ?? base.meta.name, style: raw?.meta?.style ?? base.meta.style, version: DOC_VERSION },
    plats: Array.isArray(raw?.plats) && raw.plats.length ? raw.plats : base.plats,
    links: Array.isArray(raw?.links) ? raw.links : base.links,
    spawns: Array.isArray(raw?.spawns) && raw.spawns.length ? raw.spawns : base.spawns,
    skins: raw?.skins && typeof raw.skins === "object" ? raw.skins : {},
    layers: Array.isArray(raw?.layers) ? raw.layers : [],
    decor: Array.isArray(raw?.decor) ? raw.decor : [],
    hidden: Array.isArray(raw?.hidden) ? raw.hidden : [],
    waypoints: Array.isArray(raw?.waypoints) ? raw.waypoints : undefined,
  };
  return d;
}

// ── SHARED CUSTOM MAP (play a #studio map with a friend). The whole level is packed into the URL (?doc=), so a
// link IS the map — no backend, no per-device localStorage. Both players open the same link → both render the
// same custom geometry; the server just relays positions + owns hp/score (works cleanly for a DUEL = no bots).
let SHARED_DOC: LevelDoc | null = null;
export function setSharedDoc(d: LevelDoc | null) { SHARED_DOC = d; }
export function getSharedDoc(): LevelDoc | null { return SHARED_DOC; }

// UTF-8-safe base64url of the serialized doc (compact enough for a URL for a normal hand-built map).
export function encodeDoc(d: LevelDoc): string {
  const b64 = btoa(unescape(encodeURIComponent(serialize(d))));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeDoc(s: string): LevelDoc | null {
  try { const b64 = s.replace(/-/g, "+").replace(/_/g, "/"); return deserialize(decodeURIComponent(escape(atob(b64)))); } catch { return null; }
}
// on boot: if ?doc=<encoded> is present, decode it into SHARED_DOC (rendered by ArenaLevel over any server map).
export function loadSharedDocFromUrl(): boolean {
  try { const q = new URLSearchParams(window.location.search).get("doc"); if (q) { const d = decodeDoc(q); if (d) { setSharedDoc(d); return true; } } } catch { /* ignore */ }
  return false;
}

// read the live editable doc from localStorage (what #studio saves); ?tpl=<id> deep-links a template; falls back
// to the default arena.
export function loadDoc(): LevelDoc {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.has("new")) return starterDoc();                       // ?new → force a fresh empty project (ignore saved)
    const tpl = q.get("tpl"); if (tpl && TPL[tpl]) return TPL[tpl]();
  } catch { /* ignore */ }
  // SINGLE SOURCE: #studio opens on the SAME arena the game plays (defaultArena.json via testMapDoc) on EVERY
  // origin — NOT a per-origin localStorage draft (that was the "везде разный экран" divergence) and NOT an empty
  // starter. The backend main map, when published, overrides this in StudioApp's mount fetch. ?new = blank canvas.
  // (localStorage autosave still runs for in-session crash recovery, but it's no longer the source of truth; save
  // WIP via «Сохранить в библиотеку» / publish via «★ главная карта».)
  return testMapDoc();
}

// module-cached default so generators don't rebuild it every React render. DEV skips the cache so edits to
// layout.ts (or this file) show up on Fast-Refresh WITHOUT a hard reload — the old cache pinned the first-built doc
// for the whole session, so a layout change looked like it "didn't apply" (you had to Cmd+Shift+R). buildLayout()
// is cheap (a few array maps over ~9 plats), so recomputing per mount in dev is free.
let DEF: LevelDoc | null = null;
export function getDefaultDoc(): LevelDoc {
  if ((import.meta as any).env?.DEV) return defaultDoc(); // live in dev — no stale layout after HMR
  return (DEF ??= defaultDoc());
}
