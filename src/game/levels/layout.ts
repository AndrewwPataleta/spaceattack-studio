// SINGLE SOURCE OF TRUTH for the arena layout. The 2D design lab (#ld) validates reachability on THIS data, and
// the 3D level (cosmos.tsx) is GENERATED from THIS data — so what you validate in 2D is exactly what you play,
// with no impossible gaps by construction. Edit the layout here; both views update.
//
// Coordinates: x = center (m), y = TOP walk surface height above the ground floor (m, ground = 0), w = width (m).
// In 3D the ground walk surface sits at GROUND_TOP; worldTop(y) maps a layout height to a 3D top-surface Y.

// CALIBRATED from the REAL engine (Fighter.tsx + PlayBox <Physics gravity=-30>): jump impulse vy=JUMP_V, gravity
// GRAV, run speed RUN (assault role speed 1.0 × SPEED 6). Derived exactly, not assumed — this is the calibration.
export const JUMP_V = 12;   // Fighter: vy = JUMP on jump (SAME for all roles → step-up is role-independent)
export const GRAV = 30;     // Physics gravity magnitude
export const RUN = 6;       // base SPEED; the ROLE speed multiplier scales horizontal reach (below)
// ROLES share the 1.8m capsule + the same jump → clearances & max step-up are IDENTICAL for every role. Only the
// horizontal reach differs (SPEED × role.speed). Validate levels for the SLOWEST role so ALL roles can traverse.
export const ROLE_SPEED = { tank: 0.85, assault: 1.0, sniper: 0.95 };
export const ROLE_SPEED_MIN = 0.85; // tank — the constraint the map must satisfy
export const APEX = (JUMP_V * JUMP_V) / (2 * GRAV);   // 2.4m — center & feet rise at the top of the jump
export const STEP_UP = APEX;                          // 2.4m — measured max ledge you can LAND ON (= full apex, role-independent)
const AIR_SAFETY = 0.85;                              // calibrated to measured reality (4m gap clears as assault in #calib)
export const FLAT_REACH = RUN * (2 * JUMP_V / GRAV) * AIR_SAFETY; // ~4.1m same-level jump for ASSAULT (#calib reference)
export const GROUND_TOP = -0.45; // 3D Y of the ground walk surface (layout y = 0)
export const worldTop = (y: number) => y + GROUND_TOP;

// horizontal distance to LAND on a ledge whose top is `dyUp` above takeoff, for a role of `speedMul` (default assault).
// Correct physics: you land on the DESCENDING crossing → reach FURTHER going down, LESS going up.
export function jumpReachUp(dyUp: number, speedMul = 1): number {
  if (dyUp > STEP_UP) return 0;                       // too high to get feet over → not a jump (needs ramp/ladder)
  const disc = JUMP_V * JUMP_V - 2 * GRAV * dyUp;     // dyUp<0 → bigger → further reach downhill
  if (disc < 0) return 0;
  const t = (JUMP_V + Math.sqrt(disc)) / GRAV;        // time to descend through the ledge height
  return RUN * speedMul * t * AIR_SAFETY;
}

// CHARACTER CLEARANCES (capsule 1.8m standing; crouch shrinks it). CALIBRATED in #calib: crouch passes ~1.3m gaps.
export const CHAR_H = 1.8;      // standing height
export const CROUCH_H = 1.3;    // measured min overhead gap to pass CROUCHED (Fighter shrinks the collider)
export const WALK_CLEAR = 1.95; // min overhead gap to pass standing (char + margin)
export function clearanceKind(gap: number): "walk" | "crouch" | "blocked" {
  return gap >= WALK_CLEAR ? "walk" : gap >= CROUCH_H ? "crouch" : "blocked";
}

export type Kind = "ground" | "low" | "mid" | "high" | "island" | "bridge";
// ONE base beam height for ALL walkable platforms → the structure reads as a synchronized module, not random
// jumping thicknesses (visual-engineer rule). Ramps use the same BEAM so a ramp meeting a platform matches.
// Slab THICKNESS only (the deck TOP stays at worldTop(y) → standing height + all jump math unchanged); thinned from
// the original 0.8 so platforms read sleeker, less chunky (0.8 → 0.56 → 0.45).
export const BEAM = 0.45;
export const THICK: Record<Kind, number> = { ground: BEAM, low: BEAM, mid: BEAM, high: BEAM, island: BEAM, bridge: BEAM };
export const platThick = (p: { kind?: Kind }) => THICK[p.kind ?? "mid"] ?? BEAM;
// z (optional): DEPTH offset. z=0/undefined → WALKABLE play-plane platform (has a collider, counts for reachability).
// z≠0 → BACKGROUND depth-decor platform: pushed into/out of the scene, NO collider, not walkable (level law L2).
// depth (optional): how far the platform block extends BACK along Z (into the scene), default ≈2. Bigger = a chunky
// 3D volume receding into depth (textured sides), NOT a flat card. The walk COLLIDER stays a fixed front slab, so the
// back extension is visual-only (can't walk on it) and gameplay/jumps are unchanged.
// ry (optional): YAW rotation (radians) around the vertical axis — for angling BACKGROUND pieces into depth. A rotated
// piece is scenery, never walkable (a tilted collider would break the flat nav), so ry forces background like z does.
// deckTex / sideTex (optional): per-platform TEXTURE overrides (a kit path like "/cosmos/kit/plat_deck.webp" OR an
// uploaded data-URL). Absent → the default generated kit deck/side. Lets you restyle a platform's top and sides.
export type Plat = { id: string; x: number; y: number; w: number; kind?: Kind; team?: "blue" | "red"; z?: number; bh?: number; wall?: string; depth?: number; rx?: number; ry?: number; rz?: number; round?: boolean; deckTex?: string; sideTex?: string };
// a platform is part of the play plane (walkable + collides for nav/validation) only when it sits at z≈0 AND is
// axis-aligned. Any rotation (yaw ry OR tilt rx/rz) makes it structural scenery — nav/jump/reach math assumes flat
// axis-aligned rects, so a tilted block is excluded from those (it still renders + has a real tilted collider).
export const isWalkable = (p: Plat): boolean => !p.z && !p.rx && !p.ry && !p.rz;
// id (optional): stable ladder/ramp id. Auto-derived as `ladder:a-b` when absent, but two ladders between the SAME
// pair of platforms (e.g. tiers: floor→deck INNER + OUTER) need distinct ids — set it explicitly there.
export type Link = { a: string; b: string; kind: "ladder" | "ramp"; x?: number; id?: string };

// 4v4 ARENA (right half + center; left mirrored). Wide + multi-route so 4 players/team spread comfortably: a ground
// lane, a forward cover step, and a ramp→ladder→ramp climb to the command deck, plus a central island + a wide
// bridge that flanks over the middle. Mixed traversal (ramps + ladders + jumps + drop-downs). Every passage typed &
// validated in #ld. Vertical path per side: ground →(ramp)→ low →(ladder)→ mid →(ramp)→ high (SPAWN).
// TIERS are OFFSET OUTWARD (no x-overlap) so no tier crushes the one below and every junction is clean (a lower
// tier sticking out under an upper one = overlap; we abut them instead). All side transitions are ramps.
const HALF: Plat[] = [
  { id: "lowR", x: 10.5, y: 1.6, w: 11, kind: "low", team: "red" }, // spans 5..16
  { id: "midR", x: 22, y: 3.4, w: 6, kind: "mid", team: "red" },    // spans 19..25 (gap 3 to lowR = ramp run → ramp abuts both edges)
  { id: "highR", x: 31.5, y: 5.4, w: 6, kind: "high", team: "red" },// spans 28.5..34.5 (gap 3.5 to midR); SPAWN / command
];
const CENTER: Plat[] = [
  { id: "ground", x: 0, y: 0, w: 72, kind: "ground" },              // spans -36..36 (holds the outward tiers)
  { id: "island", x: 0, y: 1.8, w: 6, kind: "island" },             // center high-ground: jump-up from ground (dy1.8)
  { id: "bridge", x: 0, y: 5.2, w: 20, kind: "bridge" },            // HIGH central catwalk (spans -10..10), reached by an EDGE ladder off each side low tier (lands you on the bridge END, not dead-centre)
];
const HALF_LINKS: Link[] = [
  { a: "ground", b: "lowR", kind: "ramp" },
  { a: "lowR", b: "midR", kind: "ramp" },
  { a: "midR", b: "highR", kind: "ramp" },
  // BRIDGE access = a ladder up the side of the catwalk's END (x8 = 2m from the bridge's right edge, standing on lowR
  // 5..16 below). You climb up and step onto the FRONT of the bridge, ready to advance — NOT dead-centre like the old
  // central island→bridge ladder (which dumped you in the middle of the 20m span with nowhere to go).
  { a: "lowR", b: "bridge", kind: "ladder", x: 8 },
];
// island stays a central jump-up high-ground / cover piece (reached by jumping from the ground, dy1.8); its up-route
// to the bridge moved to the side EDGE ladders above so you never land stranded in the middle of the catwalk.
const CENTER_LINKS: Link[] = [];
export const SPAWNS = ["highR", "highL"];

const mirrorPlat = (p: Plat): Plat => ({ ...p, id: p.id.replace(/R$/, "L"), x: -p.x, team: p.team === "red" ? "blue" : p.team });
const mirrorLink = (l: Link): Link => ({ a: l.a.replace(/R$/, "L"), b: l.b.replace(/R$/, "L"), kind: l.kind, x: l.x != null ? -l.x : undefined });

export type LayoutData = { plats: Plat[]; links: Link[] };
export function buildLayout(): LayoutData {
  return {
    plats: [...CENTER, ...HALF, ...HALF.map(mirrorPlat)],
    links: [...CENTER_LINKS, ...HALF_LINKS, ...HALF_LINKS.map(mirrorLink)],
  };
}

export const edges = (p: Plat) => ({ L: p.x - p.w / 2, R: p.x + p.w / 2 });

export const RAMP_SLOPE = Math.PI / 6; // ~30° — gentle enough to read as a ramp, steep enough to keep the map compact
// SINGLE ramp geometry (layout coords). The ramp ABUTS both platform EDGES (bottom on the lower's OUTER edge, top
// on the higher's near edge) — exactly like the clean TOP junction — so the lower platform never sticks out under
// it. If the tiers are spaced ~= the ramp run the slope stays gentle; if closer, the bottom is CLAMPED to the
// lower edge (slightly steeper) rather than resting deep on the platform. Used by BOTH 2D lab and 3D generator.
export function rampGeom(a: Plat, b: Plat): { from: [number, number]; to: [number, number] } {
  const lo = a.y < b.y ? a : b, hi = a.y < b.y ? b : a;
  const hiNear = hi.x > lo.x ? edges(hi).L : edges(hi).R;  // higher platform's edge facing the lower
  if (lo.kind === "ground") {                             // ramp from the FLOOR: rest its bottom ON the floor (run-based)
    const dir = hi.x > lo.x ? -1 : 1;
    const run = (hi.y - lo.y) / Math.tan(RAMP_SLOPE);
    return { from: [hiNear + dir * run, lo.y], to: [hiNear, hi.y] };
  }
  // TIER→TIER: the ramp ABUTS BOTH edges EXACTLY (bottom on lower tier's near edge, top on higher's) — no gap, no
  // resting deep, no step. Slope = height/gap (gaps are laid ~= the ramp run so it stays ~30°).
  const loNear = hi.x > lo.x ? edges(lo).R : edges(lo).L;  // lower tier's edge facing the higher
  return { from: [loNear, lo.y], to: [hiNear, hi.y] };
}
export function gapX(a: Plat, b: Plat): number {
  const ea = edges(a), eb = edges(b);
  if (eb.L <= ea.R && ea.L <= eb.R) return 0;
  return Math.min(Math.abs(eb.L - ea.R), Math.abs(ea.L - eb.R));
}
// Horizontal jump distance FROM `from` to the nearest EXPOSED landing EDGE of `to`. Correct for the "directly above
// / wider" case: you can only land on `to`'s exposed corner, and you must take off from a point ON `from` — so the
// distance is |edge − clamp(edge, from.L, from.R)|. (gapX gave 0 for overlapping platforms → false "reachable".)
export function jumpGap(from: Plat, to: Plat): number {
  const tf = edges(from), tt = edges(to);
  let best = Infinity;
  for (const lx of [tt.L, tt.R]) {
    const tx = Math.max(tf.L, Math.min(tf.R, lx));      // nearest legal takeoff on `from`
    best = Math.min(best, Math.abs(lx - tx));
  }
  return best;
}
// DIRECTED: can you jump FROM `from` ONTO `to`? Validated for the SLOWEST role (tank) so every role can make it.
export function canJump(from: Plat, to: Plat): boolean {
  return jumpGap(from, to) <= jumpReachUp(to.y - from.y, ROLE_SPEED_MIN) + 0.01;
}
// legacy alias kept for the #ld reach-envelope drawing (same-level radius)
export const REACH = FLAT_REACH;

// OVERHANGS: for every platform that hangs over a lower one (x-spans overlap), the clearance you'd have standing
// on the lower deck under the upper one, classified walk / crouch / blocked. Drives the #ld passage labels.
export type Overhang = { lower: Plat; upper: Plat; x: number; gap: number; kind: "walk" | "crouch" | "blocked" };
export function findOverhangs(data: LayoutData = buildLayout()): Overhang[] {
  const { plats } = data;
  const out: Overhang[] = [];
  for (const lo of plats) for (const up of plats) {
    if (up.y <= lo.y) continue;
    const oL = Math.max(edges(lo).L, edges(up).L), oR = Math.min(edges(lo).R, edges(up).R);
    if (oR - oL < 0.5) continue;                        // no meaningful shared span
    const gap = (up.y - platThick(up)) - lo.y;          // free space between lower deck and upper slab bottom
    if (gap <= 0.05) continue;                          // stacked flush, not a passage
    out.push({ lower: lo, upper: up, x: (oL + oR) / 2, gap, kind: clearanceKind(gap) });
  }
  return out;
}

// CRUSHED platforms: you can't STAND on them because something directly above is too low (headroom < 1.8m). This
// also caps jumps onto/from them. Catches the "low ceiling over the play area" bug (a bridge over the island).
export function findCrushed(data: LayoutData = buildLayout()): { p: Plat; headroom: number; frac: number }[] {
  const { plats } = data;
  const out: { p: Plat; headroom: number; frac: number }[] = [];
  for (const p of plats) {
    if (p.kind === "ground") continue;                    // the main floor's patches under raised blocks are expected, not a bug
    const iv: [number, number][] = []; let minGap = Infinity;
    for (const up of plats) {
      if (up.y <= p.y) continue;
      const oL = Math.max(edges(p).L, edges(up).L), oR = Math.min(edges(p).R, edges(up).R);
      if (oR - oL < 0.5) continue;
      const gap = (up.y - platThick(up)) - p.y;           // headroom above p's surface
      if (gap < CHAR_H) { iv.push([oL, oR]); minGap = Math.min(minGap, gap); }
    }
    if (!iv.length) continue;
    iv.sort((a, b) => a[0] - b[0]);                        // union width of the crushed spans
    let w = 0, cl = iv[0][0], cr = iv[0][1];
    for (let i = 1; i < iv.length; i++) { if (iv[i][0] <= cr) cr = Math.max(cr, iv[i][1]); else { w += cr - cl; cl = iv[i][0]; cr = iv[i][1]; } }
    w += cr - cl;
    const frac = w / p.w;
    if (frac > 0.2) out.push({ p, headroom: minGap, frac }); // only flag if a real chunk is crushed (ground's tiny patches ignored)
  }
  return out;
}

// climb zones for the 3D game (x, bottom-surface, top-surface in WORLD Y) derived from the ladder links
export type LadderZone = { x: number; yb: number; yt: number; id: string };
export function genLadderZones(hidden: string[] = [], data: LayoutData = buildLayout()): LadderZone[] {
  const { plats, links } = data;
  const byId = new Map(plats.map((p) => [p.id, p]));
  return links.filter((l) => l.kind === "ladder" && !hidden.includes(l.a) && !hidden.includes(l.b) && !hidden.includes(`ladder:${l.a}-${l.b}`)).map((l) => {
    const a = byId.get(l.a)!, b = byId.get(l.b)!;
    const lo = a.y < b.y ? a : b, hi = a.y < b.y ? b : a;
    const ox = l.x != null ? l.x : (Math.max(edges(lo).L, edges(hi).L) + Math.min(edges(lo).R, edges(hi).R)) / 2;
    return { x: ox, yb: worldTop(lo.y), yt: worldTop(hi.y), id: l.id ?? `ladder:${l.a}-${l.b}` };
  });
}

// EVERY object in the level (platforms, supports, ramps, ladders) with a stable id + label + badge position. Used
// by #platlab to number/label/hide each one, and by the generator to skip hidden ones. So every object is nameable.
export type LevelObj = { id: string; label: string; x: number; y: number; kind: "plat" | "sup" | "ramp" | "ladder" };
export function levelObjects(data: LayoutData = buildLayout()): LevelObj[] {
  const { plats, links } = data;
  const byId = new Map(plats.map((p) => [p.id, p]));
  const objs: LevelObj[] = [];
  plats.forEach((p, i) => objs.push({ id: p.id, label: `${i + 1} ${p.id}`, x: p.x, y: worldTop(p.y) + 0.45, kind: "plat" }));
  plats.forEach((p) => { if (p.kind === "bridge") return; const top = worldTop(p.y) - platThick(p); const floor = p.kind === "island" ? worldTop(0) : -8; objs.push({ id: `sup:${p.id}`, label: `оп·${p.id}`, x: p.x, y: (top + floor) / 2, kind: "sup" }); });
  links.filter((l) => l.kind === "ramp").forEach((l) => { const a = byId.get(l.a), b = byId.get(l.b); if (!a || !b) return; const g = rampGeom(a, b); objs.push({ id: `ramp:${l.a}-${l.b}`, label: `рампа·${l.a}→${l.b}`, x: (g.from[0] + g.to[0]) / 2, y: worldTop((g.from[1] + g.to[1]) / 2) + 0.2, kind: "ramp" }); });
  genLadderZones([], data).forEach((L) => objs.push({ id: L.id, label: `лестн·${L.id.replace("ladder:", "")}`, x: L.x, y: (L.yb + L.yt) / 2, kind: "ladder" }));
  return objs;
}
