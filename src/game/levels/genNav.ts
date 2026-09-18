// genNav — build the bot NAVIGATION GRAPH (route map) straight from a LevelDoc, so the routes ALWAYS match the
// geometry you actually see (no hand-authored shared/nav.mjs to drift out of sync). Platforms → walkable SURFACES,
// links (ramp/ladder) → PORTALS, solid decor → cover points + LOS blockers + jumpable obstacles. Then genWaypoints
// scatters ROAM NODES on those surfaces (cover / centre / edges / high perches) — the points a searching bot picks
// RANDOMLY so it wanders the whole map instead of looping one path. #studio's route editor reads/edits these.
import { worldTop, platThick, isWalkable, type Plat } from "./layout";
import type { LevelDoc, DecorProp, Waypoint } from "./levelDoc";
// STAND = grounded centre offset above a surface top; portal kinds — from the shared navmesh core (single source).
import { STAND, RAMP, LADDER, finalizeNav } from "../../../shared/nav.mjs";

export type NavSurface = { id: string; x0: number; x1: number; y: number; cover?: number[]; high?: boolean };
export type NavPortal = { a: string; ax: number; b: string; bx: number; kind: string };
export type NavBlocker = { x0: number; x1: number; y0: number; y1: number };
export type NavObstacle = { x0: number; x1: number; top: number };
export type { Waypoint };
export type GenNav = {
  surfaces: NavSurface[]; portals: NavPortal[]; blockers: NavBlocker[]; obstacles: NavObstacle[];
  waypoints: Waypoint[]; byId?: Record<string, NavSurface>; adj?: Record<string, unknown[]>;
  spawns?: { blue: { x: number; y: number }[]; red: { x: number; y: number }[] };
};

const surfaceTopY = (p: Plat) => worldTop(p.y);          // 3D Y of the walk surface
const standY = (p: Plat) => worldTop(p.y) + STAND;       // grounded centre Y a bot sits at on this surface
const spanOf = (p: Plat) => ({ x0: p.x - p.w / 2, x1: p.x + p.w / 2 });
// a decor prop is a real, standable/solid piece of geometry on the PLAY PLANE (z≈0, solid collider).
const isSolidDecor = (d: DecorProp) => !!d.solid && !d.z && (d.type === "crate" || d.type === "barrel" || d.type === "box" || d.type == null);

// which walkable surface does a solid decor prop rest ON? (its base Y near the surface top, its x within the span)
function decorSurface(d: DecorProp, walk: Plat[]): Plat | null {
  let best: Plat | null = null, bd = Infinity;
  for (const p of walk) {
    const { x0, x1 } = spanOf(p);
    if (d.x < x0 - 0.4 || d.x > x1 + 0.4) continue;
    const dy = Math.abs(d.y - surfaceTopY(p));
    if (dy < 0.7 && dy < bd) { bd = dy; best = p; }
  }
  return best;
}

// BUILD the nav graph from a level document. Deterministic (no RNG) so it's stable across rebuilds/saves.
export function genNav(doc: LevelDoc): GenNav {
  const walk = doc.plats.filter(isWalkable);
  const heights = walk.map((p) => p.y);
  const hiCut = heights.length ? Math.max(...heights) * 0.6 : 99; // "high" ground = top ~40% of the level

  // 1) SURFACES from platforms
  const surfaces: NavSurface[] = walk.map((p) => {
    const { x0, x1 } = spanOf(p);
    return { id: p.id, x0, x1, y: standY(p), high: p.y >= hiCut && p.y > 0 };
  });
  const byId = new Map(surfaces.map((s) => [s.id, s]));

  // 2) COVER points + LOS blockers + jumpable obstacles from SOLID decor
  const blockers: NavBlocker[] = [];
  const obstacles: NavObstacle[] = [];
  for (const d of doc.decor) {
    if (!isSolidDecor(d)) continue;
    const hw = (d.type === "barrel" ? (d.r ?? d.w / 2) : d.w / 2), h = d.h;
    const x0 = d.x - hw, x1 = d.x + hw, y0 = d.y, y1 = d.y + h;
    blockers.push({ x0, x1, y0, y1 });                                  // full-body AABB = LOS occluder + cover
    obstacles.push({ x0, x1, top: y1 });                                // solid on the lane → hop over it
    const surf = decorSurface(d, walk);
    if (surf) { const s = byId.get(surf.id)!; (s.cover ||= []).push(+d.x.toFixed(2)); }
  }
  // 3) RAISED-PLATFORM BODIES as LOS slabs (a deck blocks sight between the levels above/below it)
  for (const p of walk) {
    if (p.y <= 0) continue; // ground doesn't occlude
    const { x0, x1 } = spanOf(p);
    const top = surfaceTopY(p);
    blockers.push({ x0, x1, y0: top - platThick(p), y1: top });
  }

  // 4) PORTALS from links (ramp/ladder). Height order is normalised in finalizeNav; here we just pick the transition x
  // on each side: a ramp meets the two platforms at their NEAREST edges; a ladder is a vertical column at link.x.
  const platById = new Map(doc.plats.map((p) => [p.id, p]));
  const portals: NavPortal[] = [];
  for (const l of doc.links) {
    const pa = platById.get(l.a), pb = platById.get(l.b);
    if (!pa || !pb || !byId.has(pa.id) || !byId.has(pb.id)) continue;
    if (l.kind === "ladder") {
      const x = l.x ?? (pa.x + pb.x) / 2;
      portals.push({ a: pa.id, ax: x, b: pb.id, bx: x, kind: LADDER });
    } else {
      const rightward = pb.x >= pa.x;
      const ax = rightward ? pa.x + pa.w / 2 : pa.x - pa.w / 2;
      const bx = rightward ? pb.x - pb.w / 2 : pb.x + pb.w / 2;
      portals.push({ a: pa.id, ax, b: pb.id, bx, kind: RAMP });
    }
  }

  // 5) SEAM walk-links: platforms at the SAME height whose spans touch/overlap read as ONE continuous floor to a
  // player, but the nav only connects authored ramps/ladders — so a bot couldn't walk across a floor built from
  // several abutting plats (it would take the long ladder route, or an unlinked plat like the centre ground would be
  // unreachable). Auto-add a RAMP (walkable both ways) at the shared edge of every abutting same-height pair.
  for (let i = 0; i < surfaces.length; i++) for (let j = i + 1; j < surfaces.length; j++) {
    const a = surfaces[i], b = surfaces[j];
    if (Math.abs(a.y - b.y) > 0.3) continue;            // different tier → not a seam
    const loX = Math.max(a.x0, b.x0), hiX = Math.min(a.x1, b.x1);
    if (loX - hiX > 0.6) continue;                      // spans don't touch/overlap → real gap, not a seam
    const seam = (loX + hiX) / 2;                       // shared-edge x
    portals.push({ a: a.id, ax: seam, b: b.id, bx: seam, kind: RAMP });
  }

  const nav: GenNav = { surfaces, portals, blockers, obstacles, waypoints: [] };
  nav.waypoints = doc.waypoints && doc.waypoints.length ? doc.waypoints.map((w) => ({ ...w })) : genWaypoints(surfaces);

  // 6) SPAWN LANES from the doc's spawn surfaces (spawns[0] = blue side, [1] = red side). Every point lands ON real
  //    geometry (the server used to carry hardcoded x-lanes that drifted off the #studio level → bots dropped into a
  //    void). Two rules so a match starts fair:
  //      • WITHIN a team — a guaranteed gap between the 4 slots (≤2m, tighter only on a small surface) so nobody
  //        stacks one-on-one.
  //      • BETWEEN teams — each team's lane hugs the OUTER edge of its surface (the edge AWAY from the enemy), so the
  //        two sides start as far apart as the surfaces allow and face inward across the map. Enemies never spawn
  //        right next to each other. Same surface for both → split it left/right.
  const laneEdge = (s: NavSurface, outerLeft: boolean, x0 = s.x0, x1 = s.x1) => {
    const lo = x0 + 0.8, hi = x1 - 0.8, w = Math.max(0.2, hi - lo);
    const n = 4, gap = Math.min(2, w / (n - 1));
    const start = outerLeft ? lo : hi - gap * (n - 1);   // anchor at the team's OUTER edge
    return Array.from({ length: n }, (_, i) => ({ x: +(start + gap * i).toFixed(2), y: +s.y.toFixed(2) }));
  };
  const spIds = (doc.spawns && doc.spawns.length ? doc.spawns : [surfaces[0]?.id]).filter(Boolean) as string[];
  const bs = byId.get(spIds[0]) || surfaces[0];
  const rs = byId.get(spIds[1] || spIds[spIds.length - 1]) || surfaces[surfaces.length - 1] || bs;
  if (bs && rs && bs.id === rs.id) {                     // both teams on ONE surface → split halves, each hugs its end
    const m = (bs.x0 + bs.x1) / 2;
    nav.spawns = { blue: laneEdge(bs, true, bs.x0, m - 0.4), red: laneEdge(bs, false, m + 0.4, bs.x1) };
  } else if (bs && rs) {
    const blueLeft = (bs.x0 + bs.x1) / 2 <= (rs.x0 + rs.x1) / 2; // whichever team is on the left hugs its left edge
    nav.spawns = { blue: laneEdge(bs, blueLeft), red: laneEdge(rs, !blueLeft) };
  } else nav.spawns = { blue: bs ? laneEdge(bs, true) : [], red: [] };

  finalizeNav(nav); // attach byId + adjacency (BFS-ready)
  return nav;
}

// EDITOR helper: (re)build the roam nodes for a doc from scratch (the #studio «авто-построить» button) — genNav on
// the doc with its authored nodes ignored, so we always get a fresh geometry-derived set the user can then tweak.
export function autoWaypoints(doc: LevelDoc): Waypoint[] {
  return genNav({ ...doc, waypoints: [] }).waypoints;
}

// AUTO-SCATTER roam nodes on the surfaces: every cover point (tactical), each surface centre, a node inset from each
// edge (so bots visit the flanks), and a dedicated node on every HIGH perch (snipers climb to it). These are what a
// searching bot picks at RANDOM — more nodes spread across more surfaces = more visibly varied wandering.
export function genWaypoints(surfaces: NavSurface[]): Waypoint[] {
  const out: Waypoint[] = [];
  let n = 0;
  const add = (x: number, y: number, tag: Waypoint["tag"]) => out.push({ id: `wp${n++}`, x: +x.toFixed(2), y: +y.toFixed(2), tag });
  for (const s of surfaces) {
    const cx = (s.x0 + s.x1) / 2, wide = s.x1 - s.x0;
    if (s.cover) for (const c of s.cover) add(c, s.y, "cover");
    add(cx, s.y, s.high ? "perch" : "centre");
    if (wide > 5) { add(s.x0 + 1.2, s.y, "edge"); add(s.x1 - 1.2, s.y, "edge"); }
    else if (wide > 2.5 && !s.cover) { add(s.x0 + 0.8, s.y, "edge"); add(s.x1 - 0.8, s.y, "edge"); }
  }
  return out;
}
