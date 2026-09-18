// RANDOM MAP GENERATOR — builds a valid Cosmos arena from high-level settings, honouring our world's rules:
// real jump/ramp metrics (layout.ts), spawns on the top tier, and guaranteed reachability (validated; retried until
// it passes). NEW: the play geometry is VARIED (asymmetric tier counts, height jitter, standalone jump islands,
// chunky depth-extruded platforms) and a rich DEPTH BACKDROP pass scatters non-walkable scenery (receding platforms
// at varied z / rotation / depth, background crates, landmark GLB towers) so every roll looks different + 3D — not
// the same mirror pattern. Output = a LevelDoc ready for store.replaceDoc().
import { STEP_UP, type Plat, type Link } from "../game/levels/layout";
import { defaultDecor, type LevelDoc, type DecorProp, DOC_VERSION } from "../game/levels/levelDoc";
import { validate } from "./validate";

export type MapOpts = {
  size: "compact" | "medium" | "large";   // arena width
  verticality: "low" | "medium" | "high"; // height step between tiers
  center: "island-bridge" | "island" | "open"; // central high-ground / catwalk
  links: "ramps" | "ramps-ladders" | "mixed" | "ladders"; // how tiers connect ("ladders" = stacked towers)
  cover: boolean;                          // seed cover crates on tiers
  symmetric?: boolean;                     // mirror both sides exactly (else asymmetric ±1 tier)
  tiers?: number;                          // explicit tiers per side (0 = auto from size)
  depthBands?: -1 | 0 | 2 | 3 | 4;         // depth-graph layers: -1 = OFF, 0 = random 2–4, 2/3/4 = explicit
  seed?: number;
};
export const DEFAULT_OPTS: MapOpts = { size: "medium", verticality: "medium", center: "island-bridge", links: "ramps-ladders", cover: true, symmetric: false, tiers: 0, depthBands: 0 };

// tiny seeded RNG so a given seed reproduces a map (and "another" = seed+1)
export function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const pick = <T,>(r: () => number, a: T[]): T => a[Math.floor(r() * a.length)];
const jit = (r: () => number, v: number, amt: number) => v + (r() * 2 - 1) * amt;

// DEPTH GRAPH — the depth is a proper NODE GRAPH (like a real 3D world), not random scatter. Algorithm (the classic
// connected-dungeon recipe): (1) SAMPLE well-separated nodes across a few Z-bands (dart-throwing → no overlap/clutter);
// (2) build a MINIMUM SPANNING TREE (Prim's) over the nodes → everything CONNECTED, zero orphans; (3) add a couple of
// extra short edges → loops/junctions; (4) ANCHOR the shallowest node to the nearest play platform so the graph
// CONTINUES the level; (5) realise it: nodes → decks, edges → ROAD-BEAMS (a thin platform yaw-rotated to run from A to
// B). Decorative kit props sit at nodes, landmark towers at the deepest ones. All z<0 → non-walkable.
type GNode = { x: number; y: number; z: number };
const d3 = (a: GNode, b: GNode) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
// Prim's MST → list of [i,j] edges connecting every node with minimum total length (guaranteed spanning, no orphans).
function primMST(nodes: GNode[]): [number, number][] {
  const n = nodes.length; if (n < 2) return [];
  const inT = new Array(n).fill(false); inT[0] = true; const edges: [number, number][] = [];
  for (let k = 0; k < n - 1; k++) {
    let bi = -1, bj = -1, bd = Infinity;
    for (let i = 0; i < n; i++) if (inT[i]) for (let j = 0; j < n; j++) if (!inT[j]) { const d = d3(nodes[i], nodes[j]); if (d < bd) { bd = d; bi = i; bj = j; } }
    if (bj < 0) break; inT[bj] = true; edges.push([bi, bj]);
  }
  return edges;
}
export function depthEcho(walk: Plat[], r: () => number, groundW: number, bands = 0): { plats: Plat[]; decor: DecorProp[] } {
  const plats: Plat[] = []; const decor: DecorProp[] = []; let n = 0;
  const HW = groundW / 2;
  const B = bands >= 2 ? bands : 2 + Math.floor(r() * 3);          // 2–4 receding bands

  // 1) SAMPLE nodes, well-separated (dart-throwing with a min horizontal gap so decks/roads never overlap into mush)
  const nodes: GNode[] = []; const MIN = 6;                        // min horizontal separation
  for (let b = 1; b <= B; b++) {
    const z = -(3 + (b - 1) * (5 + r() * 2) + r() * 2);           // band depth
    const want = 2 + Math.floor(r() * 2);                          // 2–3 nodes per band
    for (let t = 0, placed = 0; t < 40 && placed < want; t++) {
      const x = +((r() * 2 - 1) * HW * 1.05).toFixed(1);
      const y = +(1 + r() * 6).toFixed(1);
      if (nodes.every((m) => Math.hypot(m.x - x, m.z - z) > MIN)) { nodes.push({ x, y, z }); placed++; }
    }
  }
  if (nodes.length < 2) return { plats, decor };

  // 2) MST → connected skeleton. 3) + a few shortest NON-tree edges → loops/junctions.
  const tree = primMST(nodes);
  const inTree = new Set(tree.map(([a, b]) => a < b ? `${a}-${b}` : `${b}-${a}`));
  const extra: [number, number, number][] = [];
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const key = `${i}-${j}`; if (!inTree.has(key)) extra.push([i, j, d3(nodes[i], nodes[j])]); }
  extra.sort((a, b) => a[2] - b[2]);
  const loops = extra.slice(0, Math.min(extra.length, 1 + Math.floor(r() * B))).map(([a, b]) => [a, b] as [number, number]);
  const edges = [...tree, ...loops];

  // 4) ANCHOR: connect the SHALLOWEST node (closest to the play plane) to the nearest play platform → depth continues
  // the level instead of floating. Modelled as one extra node at the play platform (z≈-0.6) + an edge to it.
  const shallow = nodes.reduce((a, b, i) => (b.z > nodes[a].z ? i : a), 0);
  const near = walk.filter((p) => !p.z).reduce((best, p) => (Math.abs(p.x - nodes[shallow].x) < Math.abs(best.x - nodes[shallow].x) ? p : best), walk[0]);
  const anchor: GNode = { x: near ? near.x : 0, y: near ? near.y : 1, z: -0.6 };
  const ai = nodes.push(anchor) - 1; edges.push([ai, shallow]);

  // 5a) NODE decks
  nodes.forEach((nd, i) => { if (i === ai) return; plats.push({ id: `nd${n++}`, x: +nd.x.toFixed(1), y: +nd.y.toFixed(1), w: +(4 + r() * 3).toFixed(1), kind: nd.z < -14 ? "high" : "mid", z: +nd.z.toFixed(2), depth: +(2 + r() * 2).toFixed(1) }); });
  // 5b) EDGE road-beams: a thin platform yaw-rotated so its WIDTH runs from A to B along the horizontal (x,z).
  for (const [a, b] of edges) {
    const A = nodes[a], Bn = nodes[b]; const dx = Bn.x - A.x, dz = Bn.z - A.z; const L = Math.hypot(dx, dz);
    if (L < 2) continue;
    const ry = Math.atan2(-dz, dx);                              // local +X → (cos ry, 0, -sin ry) = the edge direction
    plats.push({ id: `rd${n++}`, x: +((A.x + Bn.x) / 2).toFixed(1), y: +((A.y + Bn.y) / 2).toFixed(1), w: +L.toFixed(1), kind: "low", z: +((A.z + Bn.z) / 2).toFixed(2), ry: +ry.toFixed(2), depth: 2.4 });
  }

  // 5c) DECOR at some nodes (decorative kit only: crate/barrel/box/pipe — NO jumppad/portal/lift)
  nodes.forEach((nd, i) => {
    if (i === ai || r() < 0.45) return;
    const t = pick(r, ["crate", "barrel", "box", "pipe"]);
    if (t === "pipe") decor.push({ id: `dp${n++}`, label: "труба", type: "pipe", dir: "v", x: +nd.x.toFixed(1), y: +(nd.y + 2).toFixed(1), z: +(nd.z + 0.3).toFixed(1), w: +(3 + r() * 5).toFixed(1), h: 0.34, r: 0.18 });
    else if (t === "box") decor.push({ id: `dp${n++}`, label: "строение", type: "box", x: +nd.x.toFixed(1), y: +(nd.y + 1.5).toFixed(1), z: +(nd.z + 0.3).toFixed(1), w: +(2 + r() * 3).toFixed(1), h: +(3 + r() * 6).toFixed(1) });
    else if (t === "barrel") decor.push({ id: `dp${n++}`, label: "бочка", type: "barrel", x: +nd.x.toFixed(1), y: +nd.y.toFixed(1), z: +(nd.z + 0.3).toFixed(1), w: 0.96, h: 1.1, r: 0.5 });
    else decor.push({ id: `dp${n++}`, label: "ящик", type: "crate", x: +nd.x.toFixed(1), y: +nd.y.toFixed(1), z: +(nd.z + 0.3).toFixed(1), w: +(1 + r() * 1.5).toFixed(2), h: 1 });
  });
  // landmark tower at the DEEPEST node (roads terminate into a structure), fading toward the far backdrop
  const deep = nodes.reduce((a, b, i) => (i !== ai && b.z < nodes[a].z ? i : a), 0);
  decor.push({ id: `dm${n++}`, label: "вышка", type: "model", src: "/cosmos/world/tower.glb", x: +nodes[deep].x.toFixed(1), y: -2.5, z: +(nodes[deep].z - 3).toFixed(1), w: 4, h: 8, scale: +(4 + r() * 4).toFixed(1), ry: +(r() * 6.28).toFixed(2) });
  return { plats, decor };
}

// build ONE valid attempt from opts + a random stream
function attempt(opts: MapOpts, rnd: () => number): LevelDoc {
  const baseTiers = opts.size === "compact" ? 2 : opts.size === "large" ? 4 : 3;
  const groundW = Math.round(jit(rnd, opts.size === "compact" ? 50 : opts.size === "large" ? 92 : 72, 8));
  const step = opts.verticality === "low" ? 1.3 : opts.verticality === "high" ? 2.2 : 1.7;
  const kindFor = (i: number, top: number) => (i === top ? "high" : i === 1 ? "low" : "mid");

  const tierCount = opts.tiers && opts.tiers > 0 ? opts.tiers : baseTiers;
  const mode = opts.links;
  // build ONE side. mode "ladders" → a STACKED TOWER at a fixed x (tiers over each other, ladder rungs). Otherwise the
  // OUTWARD march (tiers step out from centre, ramps between them).
  const buildSide = (sign: 1 | -1, tag: "R" | "L", team: "red" | "blue", count: number): { plats: Plat[]; links: Link[]; top: string } => {
    const out: Plat[] = []; const links: Link[] = [];
    if (mode === "ladders") {
      const bx = +(sign * (6 + rnd() * 5)).toFixed(1); let prevId = "ground";
      for (let i = 1; i <= count; i++) {
        const y = +Math.max(1, i * step + jit(rnd, 0, step * 0.15)).toFixed(2);
        const w = +(6 + rnd() * 3).toFixed(1);
        const id = `t${i}${tag}`;
        out.push({ id, x: bx, y, w, kind: kindFor(i, count), team });
        links.push({ a: prevId, b: id, kind: "ladder", x: bx });
        prevId = id;
      }
      return { plats: out, links, top: `t${count}${tag}` };
    }
    let prev = 3.5;
    for (let i = 1; i <= count; i++) {
      const w = 5 + Math.round(rnd() * (i === 1 ? 8 : 4));
      const y = +Math.max(1, i * step + jit(rnd, 0, step * 0.28)).toFixed(2);
      const gap = 2.4 + rnd() * 1.6;
      const L = prev + gap; const x = +(sign * (L + w / 2)).toFixed(2);
      const p: Plat = { id: `t${i}${tag}`, x, y, w, kind: kindFor(i, count), team };
      if (rnd() < 0.5) p.depth = +(2 + rnd() * 8).toFixed(1);
      out.push(p); prev = L + w;
    }
    const ids = ["ground", ...out.map((p) => p.id)];
    for (let i = 0; i < ids.length - 1; i++) links.push({ a: ids[i], b: ids[i + 1], kind: "ramp" });
    return { plats: out, links, top: out[out.length - 1].id };
  };

  const R = buildSide(1, "R", "red", tierCount);
  // SYMMETRIC → mirror the right side exactly; else build the left independently with ±1 tiers (asymmetric/chaotic).
  const mp = (p: Plat): Plat => ({ ...p, id: p.id.replace(/R$/, "L"), x: -p.x, team: "blue" });
  const ml = (l: Link): Link => ({ ...l, a: l.a.replace(/R$/, "L"), b: l.b.replace(/R$/, "L"), x: l.x != null ? -l.x : undefined });
  const Lft = opts.symmetric
    ? { plats: R.plats.map(mp), links: R.links.map(ml), top: R.top.replace(/R$/, "L") }
    : buildSide(-1, "L", "blue", Math.max(2, tierCount + (rnd() < 0.4 ? (rnd() < 0.5 ? -1 : 1) : 0)));
  const ground: Plat = { id: "ground", x: 0, y: 0, w: groundW, kind: "ground" };
  if (rnd() < 0.5) ground.depth = +(2 + rnd() * 10).toFixed(1); // sometimes a deep chunky floor
  const plats: Plat[] = [ground, ...R.plats, ...Lft.plats];
  const links: Link[] = [...R.links, ...Lft.links];
  let spawns = [R.top, Lft.top];

  // optional command PERCH (vertical ladder up the outer tier) — only for the outward-march ladder modes (a stacked
  // tower already tops out at its spawn, and pure-ramps has none).
  if (opts.links === "ramps-ladders" || opts.links === "mixed") {
    for (const [side, tag] of [[R, "R"], [Lft, "L"]] as const) {
      const s = side.plats.find((p) => p.id === side.top)!;
      const perchY = +(s.y + 2.8).toFixed(2);
      const pid = `perch${tag}`;
      plats.push({ id: pid, x: s.x, y: perchY, w: Math.max(4, s.w - 2), kind: "high", team: s.team });
      links.push({ a: s.id, b: pid, kind: "ladder", x: s.x });
    }
    spawns = ["perchR", "perchL"];
  }

  // CENTER variety: island (+bridge) OR a couple of scattered stepping islands (jump-reachable) OR open
  const centerMode = opts.center === "open" ? (rnd() < 0.5 ? "steps" : "open") : opts.center;
  if (centerMode === "island" || centerMode === "island-bridge") {
    const islandY = +Math.min(step, STEP_UP - 0.4).toFixed(2);
    plats.push({ id: "island", x: 0, y: islandY, w: 6, kind: "island" });
    if (centerMode === "island-bridge") {
      const bridgeY = +Math.max(baseTiers * step + 0.2, islandY + 2.9).toFixed(2);
      plats.push({ id: "bridge", x: 0, y: bridgeY, w: Math.min(24, groundW * 0.3), kind: "bridge", depth: rnd() < 0.5 ? +(3 + rnd() * 6).toFixed(1) : undefined });
      links.push({ a: "island", b: "bridge", kind: "ladder", x: 0 });
    }
  } else if (centerMode === "steps") {
    // scattered jump-up stepping stones near the middle (dy < STEP_UP from the ground → reachable, no link needed)
    const k = 1 + Math.floor(rnd() * 2);
    for (let i = 0; i < k; i++) { const sx = +jit(rnd, 0, 6).toFixed(1); plats.push({ id: `step${i}`, x: sx, y: +Math.min(STEP_UP - 0.5, 1.3 + rnd() * 0.8).toFixed(2), w: +(3 + rnd() * 2).toFixed(1), kind: "island" }); }
  }

  // DECOR: cover crates/barrels (if wanted) + the depth backdrop scenery
  const cover = opts.cover ? defaultDecor(plats.filter((p) => !p.z)) : [];
  // depth OFF (-1) → no depth graph at all. No auto backdrop layer either (add one yourself in the depth panel if wanted).
  const back = opts.depthBands === -1 ? { plats: [] as Plat[], decor: [] as DecorProp[] } : depthEcho(plats, rnd, groundW, opts.depthBands ?? 0);
  return {
    meta: { name: "Случайная арена", style: "station", version: DOC_VERSION },
    plats: [...plats, ...back.plats], links, spawns, skins: {}, layers: [], decor: [...cover, ...back.decor], hidden: [],
  } as LevelDoc;
}

// generate a VALID map: try attempts until validation passes (reachable + no crushed), else return the best try.
export function genRandomMap(opts: MapOpts = DEFAULT_OPTS): LevelDoc {
  const base = (opts.seed ?? Math.floor(Math.random() * 1e9)) >>> 0;
  let best: LevelDoc | null = null; let bestScore = -1;
  for (let i = 0; i < 40; i++) {
    const doc = attempt(opts, rng(base + i * 2654435761));
    const v = validate(doc);
    if (v.ok) return doc;
    const score = doc.plats.length - v.unreachable.length - v.crushed.length;
    if (score > bestScore) { bestScore = score; best = doc; }
  }
  return best!;
}
