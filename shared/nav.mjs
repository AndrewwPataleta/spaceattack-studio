// Navigation + line-of-sight for SERVER-SIDE bot AI (no physics/rapier server-side). A map is a small
// PLATFORMER NAVMESH: walkable SURFACES (horizontal spans) linked by PORTALS (ramp / jump-up / drop-down).
// Bots exist ONLY on a surface (clamped to its span) and leave it only through an authored portal — so they
// never clip through walls and they actually climb. LOS via segBlocked (cover crates + platform slabs).
// Single source of truth: imported by both the live server (server/index.mjs) and the bot SIM (botsim.mjs).
// Pure data + math, no framework imports.
// COSMOS nav is LOADED from a JSON file that #studio's «Сделать главной картой» overwrites (together with
// defaultArena.json) → publish once, server + client both pick up the new map on reload. tools/navgen.ts regenerates it.
import cosmosNav from "./cosmos-nav.json" with { type: "json" };

export const STAND = 0.92;   // grounded centre Y = surfaceTopY + STAND (from Fighter.tsx)
export const JUMP_V = 12, GRAV = 30, RUN = 6; // mirrored from Fighter.tsx (apex ≈ 2.4m)
export const CLIMB = 3.4;    // ladder climb speed m/s (mirrors CLIMB_SPEED in src/arena/ladders.ts)
const stand = (topY) => topY + STAND;
// RAMP = walk both ways. JUMP = jump up / drop down (offset tiers). DROP = one-way fall. LADDER = VERTICAL climb
// both ways (same x) — reaches perches TALLER than a jump can (apex 2.4m), the way a sniper gets to a high nest.
export const RAMP = "ramp", JUMP = "jump", DROP = "drop", LADDER = "ladder";

// COSMOS arena — GENERATED from the hand-authored 4v4 layout (genNav(defaultDoc) → buildLayout in layout.ts) so
// the bot navmesh ALWAYS matches the geometry that actually renders. The old hand-authored surfaces had DRIFTED to
// a different (compact) arena → bots sat on Y values that don't exist in the wide map and appeared to clip through
// the floor/props. Absolute stand-Y is baked in (worldTop(platY)+STAND). Regenerate via the genNav harness if
// layout.ts changes. (No solid decor in this layout → no blockers/cover; roam nodes are auto-seeded.)
const COSMOS = cosmosNav;

// CONVOY = flat lane (one surface, no portals → no climbing) but now DRESSED with tall LOS-blocking crates so it's
// a real playground: cover points to hide/peek (snipers hold behind them), sight lines that smoke/flash/push
// actually matter on. Crates are full-height (y1 > eye ≈1.27) so they BREAK line-of-sight, not just chest cover.
const CONVOY = {
  surfaces: [{ id: 0, x0: -19, x1: 19, y: stand(0), cover: [-11.8, -4.8, 4.8, 11.8] }], // stand just off each crate
  portals: [],
  // blockers = LOS occluders; obstacles = SOLID things on the walkable lane a bot must JUMP over to pass (top =
  // world-Y of the top; crates 1.75 are jumpable — apex reaches ~2.4). Bots hop these instead of pinning on them.
  blockers: [
    { x0: -11.7, x1: -10.3, y0: -0.1, y1: 1.75 }, { x0: -4.7, x1: -3.3, y0: -0.1, y1: 1.75 },
    { x0: 3.3, x1: 4.7, y0: -0.1, y1: 1.75 }, { x0: 10.3, x1: 11.7, y0: -0.1, y1: 1.75 },
  ],
  obstacles: [
    { x0: -11.7, x1: -10.3, top: 1.75 }, { x0: -4.7, x1: -3.3, top: 1.75 },
    { x0: 3.3, x1: 4.7, top: 1.75 }, { x0: 10.3, x1: 11.7, top: 1.75 },
  ],
};

// CITADEL — the playable 4v4 arena, matching src/game/levels/layout.ts buildLayout() EXACTLY (nav surface top-Y =
// layoutY + 0.47; x spans = platform edges). Wide floor, a ramp climb per side (floor→low→mid→high SPAWN) and a
// central jump-up island. Bots fight floor / tiers / island; the high central bridge is a player-only ladder perch
// (not navved). Cover crates at the positions placed in citadelDoc() so LOS/cover lines up with what's rendered.
const CIT = (topY) => stand(topY - 0.45);          // layout height → nav surface Y (matches worldTop+STAND)
const CITADEL = {
  surfaces: [
    { id: 0, x0: -13, x1: 13, y: CIT(0), cover: [-6, 6] },                // open floor (1st, battleground)
    { id: 1, x0: -24, x1: -16, y: CIT(1.8), cover: [-20] },               // 2nd floor L
    { id: 2, x0: 16, x1: 24, y: CIT(1.8), cover: [20] },                  // 2nd floor R
    { id: 3, x0: -35, x1: -27, y: CIT(3.6), cover: [-31], high: true },   // 3rd floor L (SPAWN)
    { id: 4, x0: 27, x1: 35, y: CIT(3.6), cover: [31], high: true },      // 3rd floor R (SPAWN)
  ],
  // vertical links are RAMPS (walkable — bots + players), bridging the gap between offset tiers.
  portals: [
    { a: 0, ax: 13, b: 2, bx: 16, kind: RAMP },     // floor ⇄ 2nd R
    { a: 0, ax: -13, b: 1, bx: -16, kind: RAMP },   // floor ⇄ 2nd L
    { a: 2, ax: 24, b: 4, bx: 27, kind: RAMP },     // 2nd ⇄ 3rd R (up to spawn)
    { a: 1, ax: -24, b: 3, bx: -27, kind: RAMP },   // 2nd ⇄ 3rd L
  ],
  // LOS blockers = tier fronts + cover crates.
  blockers: [
    { x0: 16, x1: 24, y0: 0.55, y1: 1.35 }, { x0: -24, x1: -16, y0: 0.55, y1: 1.35 }, // 2nd-floor fronts
    { x0: 27, x1: 35, y0: 2.35, y1: 3.15 }, { x0: -35, x1: -27, y0: 2.35, y1: 3.15 }, // 3rd-floor fronts
    { x0: -6.5, x1: -5.5, y0: -0.45, y1: 0.55 }, { x0: 5.5, x1: 6.5, y0: -0.45, y1: 0.55 },     // floor crates
    { x0: 19.5, x1: 20.5, y0: 1.35, y1: 2.25 }, { x0: -20.5, x1: -19.5, y0: 1.35, y1: 2.25 },   // 2nd-floor crates
    { x0: 30.5, x1: 31.5, y0: 3.15, y1: 4.05 }, { x0: -31.5, x1: -30.5, y0: 3.15, y1: 4.05 },   // 3rd-floor crates
  ],
};

// TIERS — a two-level LADDER arena (LD playbook docs/level-design.md). LOW floor battleground + two HIGH side decks.
// Vertical connections are LADDERS ONLY (no ramps): each deck has TWO ladders (inner + outer) = a LOOP, no dead end.
// The CENTRE is a player LIFT up to an exposed centre bridge (rendered in tiers.tsx; NOT a bot route — bots use the
// side ladders, so the map is fully bot-navigable while the lift stays a player power move). Cover crates give the
// LD cover cadence (every ~6m). Mirror-symmetric; nav + geometry authored from the SAME numbers so every ladder
// actually connects. Deck/bridge undersides 2.5 ≥ floor+1.9 → walk-under safe.
const TIERS = {
  surfaces: [
    { id: 0, x0: -18, x1: 18, y: stand(0),   cover: [-11, -5, 5, 11] }, // LOW floor — full width
    { id: 1, x0: -18, x1: -7, y: stand(3.0),  cover: [-12] },           // HIGH deck L
    { id: 2, x0: 7,   x1: 18, y: stand(3.0),  cover: [12] },            // HIGH deck R
  ],
  portals: [
    { a: 0, ax: -8,  b: 1, bx: -8,  kind: LADDER },   // floor ⇄ deck L : INNER ladder
    { a: 0, ax: -16, b: 1, bx: -16, kind: LADDER },   // floor ⇄ deck L : OUTER ladder  → 2 exits = a loop
    { a: 0, ax: 8,   b: 2, bx: 8,   kind: LADDER },   // floor ⇄ deck R : INNER ladder
    { a: 0, ax: 16,  b: 2, bx: 16,  kind: LADDER },   // floor ⇄ deck R : OUTER ladder
  ],
  // LOS occluders. (1) SOLID DECK + BRIDGE MASSES (match tiers.tsx thin decks top 3.0/h0.5 → y[2.5,3.0]). (2) chest-
  // high cover crates (peek cover — below eye, shoot over them) spaced ~6m for the LD cover cadence.
  blockers: [
    { x0: -18, x1: -7, y0: 2.5, y1: 3.0 }, { x0: 7, x1: 18, y0: 2.5, y1: 3.0 },             // side decks (solid)
    { x0: -3.5, x1: 3.5, y0: 2.5, y1: 3.0 },                                                 // centre bridge (solid)
    { x0: -5.6, x1: -4.4, y0: 0, y1: 1.0 }, { x0: 4.4, x1: 5.6, y0: 0, y1: 1.0 },            // floor crates (inner)
    { x0: -11.6, x1: -10.4, y0: 0, y1: 1.0 }, { x0: 10.4, x1: 11.6, y0: 0, y1: 1.0 },        // floor crates (outer)
    { x0: -12.6, x1: -11.4, y0: 3.0, y1: 4.0 }, { x0: 11.4, x1: 12.6, y0: 3.0, y1: 4.0 },    // deck crates
  ],
};

const MAPS = { cosmos: COSMOS, convoy: CONVOY, citadel: CITADEL, tiers: TIERS };

// FINALIZE a raw map ({surfaces, portals, [blockers], [obstacles], [waypoints]}) → attach byId + adjacency so it's
// usable by the pathfinder/mover. Called once for every static MAP below AND by genNav() for docs built in #studio,
// so a hand-authored map and a level-derived map behave IDENTICALLY. Idempotent-safe to call again.
export function finalizeNav(m) {
  m.byId = {}; m.surfaces.forEach((s) => (m.byId[s.id] = s));
  m.adj = {}; m.surfaces.forEach((s) => (m.adj[s.id] = []));
  for (const p of m.portals) {
    if (m.byId[p.a] == null || m.byId[p.b] == null) continue; // portal references a missing surface → skip (broken link)
    // DROP surfaces store a=lower target, b=higher source in this data → normalise by Y
    const ay = m.byId[p.a].y, by = m.byId[p.b].y;
    const lower = ay <= by ? p.a : p.b, higher = ay <= by ? p.b : p.a;
    const lowX = ay <= by ? p.ax : p.bx, highX = ay <= by ? p.bx : p.ax;
    if (p.kind === RAMP) { m.adj[lower].push({ to: higher, kind: RAMP, fromX: lowX, toX: highX }); m.adj[higher].push({ to: lower, kind: RAMP, fromX: highX, toX: lowX }); }
    else if (p.kind === LADDER) { m.adj[lower].push({ to: higher, kind: LADDER, fromX: lowX, toX: highX }); m.adj[higher].push({ to: lower, kind: LADDER, fromX: highX, toX: lowX }); } // vertical, both ways
    else if (p.kind === JUMP) { m.adj[lower].push({ to: higher, kind: JUMP, fromX: lowX, toX: highX }); m.adj[higher].push({ to: lower, kind: DROP, fromX: highX, toX: lowX }); }
    else if (p.kind === DROP) { m.adj[higher].push({ to: lower, kind: DROP, fromX: highX, toX: lowX }); } // one-way down
  }
  if (!m.waypoints || !m.waypoints.length) m.waypoints = seedWaypoints(m); // no authored roam nodes → derive a default set
  return m;
}
// AUTO roam nodes from a map's surfaces (+ their cover): a node on each cover spot (tactical), each surface centre
// (perch-tagged if it's high ground), and one inset from each edge on a wide surface (visit the flanks). Bots pick
// these at RANDOM while searching → they spread over the WHOLE map instead of looping one path. genNav (level docs)
// pre-sets m.waypoints from the editor; this covers every hand-authored map (cosmos/citadel/tiers/convoy) for free.
export function seedWaypoints(m) {
  const out = []; let n = 0;
  const add = (x, y, tag) => out.push({ id: `wp${n++}`, x: +x.toFixed(2), y: +y.toFixed(2), tag });
  for (const s of m.surfaces) {
    const cx = (s.x0 + s.x1) / 2, wide = s.x1 - s.x0;
    if (s.cover) for (const c of s.cover) add(c, s.y, "cover");
    add(cx, s.y, s.high ? "perch" : "centre");
    if (wide > 5) { add(s.x0 + 1.2, s.y, "edge"); add(s.x1 - 1.2, s.y, "edge"); }
  }
  return out;
}
// precompute adjacency once per static map (surface id -> list of usable portal moves)
for (const m of Object.values(MAPS)) finalizeNav(m);

export function navFor(map) { return MAPS[map] || COSMOS; }
export function surfaceById(nav, id) { return nav.byId[id]; }

// which surface is a point on/nearest to (prefers one whose span contains x, closest in Y)
export function surfaceAt(nav, x, y) {
  let bi = nav.surfaces[0], bd = Infinity;
  for (const s of nav.surfaces) {
    const inSpan = x >= s.x0 - 0.6 && x <= s.x1 + 0.6;
    const d = Math.abs(s.y - y) + (inSpan ? 0 : 6 + Math.min(Math.abs(x - s.x0), Math.abs(x - s.x1)));
    if (d < bd) { bd = d; bi = s; }
  }
  return bi.id;
}

// BFS shortest path of SURFACE ids from -> to over portal adjacency
export function pathSurfaces(nav, from, to) {
  if (from === to) return [from];
  const prev = new Map([[from, -1]]); const q = [from];
  while (q.length) {
    const cur = q.shift();
    for (const e of (nav.adj[cur] || [])) {
      if (prev.has(e.to)) continue;
      prev.set(e.to, cur);
      if (e.to === to) { const out = [to]; let c = cur; while (c !== -1) { out.unshift(c); c = prev.get(c); } return out; }
      q.push(e.to);
    }
  }
  return [from];
}
// the portal move connecting adjacent surfaces s1->s2 (fromX on s1, toX on s2, kind)
export function portalMove(nav, s1, s2) { for (const e of (nav.adj[s1] || [])) if (e.to === s2) return e; return null; }

// nearest SOLID obstacle just ahead of x in travel direction dir (±1), within `reach` metres → used to hop over
// crates (returns {x0,x1,top}) instead of grinding into them. gap slightly negative = already touching it.
export function obstacleAhead(nav, x, dir, reach = 1.2) {
  let best = null, bd = Infinity;
  for (const o of (nav.obstacles || [])) {
    const edge = dir > 0 ? o.x0 : o.x1;
    const gap = (edge - x) * dir;
    if (gap < -0.4 || gap > reach || gap >= bd) continue;
    bd = gap; best = o;
  }
  return best;
}

// segment (ax,ay)->(bx,by) blocked by any cover/slab AABB?
export function segBlocked(nav, ax, ay, bx, by) { for (const b of nav.blockers) if (segHitsAABB(ax, ay, bx, by, b)) return true; return false; }
function segHitsAABB(ax, ay, bx, by, r) {
  const dx = bx - ax, dy = by - ay; let t0 = 0, t1 = 1;
  const clip = (p, q) => { if (p === 0) return q >= 0; const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } return true; };
  if (!clip(-dx, ax - r.x0)) return false;
  if (!clip(dx, r.x1 - ax)) return false;
  if (!clip(-dy, ay - r.y0)) return false;
  if (!clip(dy, r.y1 - ay)) return false;
  return t0 <= t1;
}
