// Level validation shared by #ld and #studio: reachability (BFS over ramps/ladders/jumps), plus the clearance /
// crushed checks from layout.ts. Validated for the SLOWEST role so every role can traverse the level.
import { LevelDoc, layoutOf } from "../game/levels/levelDoc";
import { canJump, findCrushed, edges, isWalkable, type Plat } from "../game/levels/layout";

export type JumpEdge = { from: string; to: string; ok: boolean };
export type Verdict = {
  reachable: Set<string>;
  unreachable: string[];       // platform ids no spawn can reach
  crushed: { id: string; headroom: number }[];
  jumps: JumpEdge[];           // candidate jump pairs (for drawing arcs)
  ok: boolean;
  summary: string;
};

// candidate jump pairs: platforms whose edges are within a reasonable horizontal band (avoid O(n²) noise across the map)
function nearPairs(plats: Plat[]): [Plat, Plat][] {
  const out: [Plat, Plat][] = [];
  for (const a of plats) for (const b of plats) {
    if (a.id === b.id) continue;
    const ea = edges(a), eb = edges(b);
    const gap = Math.max(0, Math.max(eb.L - ea.R, ea.L - eb.R));
    if (gap <= 8 && Math.abs(a.y - b.y) <= 3) out.push([a, b]);
  }
  return out;
}

export function validate(doc: LevelDoc): Verdict {
  const raw = layoutOf(doc);
  // background depth-decor platforms (z≠0) are NOT walkable — exclude them from reachability entirely.
  const plats = raw.plats.filter(isWalkable);
  const walkIds = new Set(plats.map((p) => p.id));
  const links = raw.links.filter((l) => walkIds.has(l.a) && walkIds.has(l.b));
  const byId = new Map(plats.map((p) => [p.id, p]));
  const adj = new Map<string, Set<string>>();
  const link = (a: string, b: string) => { if (!adj.has(a)) adj.set(a, new Set()); adj.get(a)!.add(b); };

  // ramps + ladders connect both ways
  for (const l of links) { if (byId.has(l.a) && byId.has(l.b)) { link(l.a, l.b); link(l.b, l.a); } }

  // jumps: directed, validated for the slowest role (canJump already uses ROLE_SPEED_MIN)
  const jumps: JumpEdge[] = [];
  for (const [a, b] of nearPairs(plats)) {
    const ok = canJump(a, b);
    jumps.push({ from: a.id, to: b.id, ok });
    if (ok) link(a.id, b.id);
  }

  // BFS from spawns
  const start = doc.spawns.filter((s) => byId.has(s));
  const reachable = new Set<string>(start);
  const q = [...start];
  while (q.length) {
    const cur = q.shift()!;
    const nbrs = adj.get(cur);
    if (nbrs) nbrs.forEach((nx) => { if (!reachable.has(nx)) { reachable.add(nx); q.push(nx); } });
  }
  const unreachable = plats.filter((p) => !reachable.has(p.id)).map((p) => p.id);
  const crushed = findCrushed({ plats, links }).map((c) => ({ id: c.p.id, headroom: c.headroom }));

  const ok = unreachable.length === 0 && crushed.length === 0 && start.length > 0;
  const parts: string[] = [];
  if (!start.length) parts.push("нет спавнов");
  if (unreachable.length) parts.push(`недостижимо: ${unreachable.length}`);
  if (crushed.length) parts.push(`придавлено: ${crushed.length}`);
  const summary = ok ? "✓ проходимо всеми ролями" : parts.join(" · ");
  return { reachable, unreachable, crushed, jumps, ok, summary };
}
