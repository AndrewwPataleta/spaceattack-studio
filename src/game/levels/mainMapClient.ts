// Client cache of the backend-published MAIN arena map. #studio publishes it (POST /match/main-map); the engine
// fetches it (GET /match/main-map) so «бой тут» / deathmatch plays exactly what was built in the studio — the SAME
// level on every origin. preloadMainMap() runs during matchmaking so the doc is cached by match start; defaultDoc()
// returns it if present, else the baked-in defaultArena.json (offline / backend-down fallback). Keeps defaultDoc()
// synchronous so the arena mount is unchanged.
import type { LevelDoc } from "./levelDoc";

let cached: LevelDoc | null = null;

function apiBase(): string {
  try { const p = new URLSearchParams(location.search).get("api"); if (p) return p.replace(/\/$/, ""); } catch { /* */ }
  const env = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL;
  if (env) return env.replace(/\/$/, "");
  return `${location.protocol}//${location.hostname}:8080`;
}

/** Fetch the current published main map and cache it. Safe to await; never throws. No-op if nothing is published. */
export async function preloadMainMap(): Promise<void> {
  try {
    const r = await fetch(`${apiBase()}/match/main-map`);
    if (!r.ok) return;
    const j = (await r.json()) as { doc?: LevelDoc | null };
    if (j && j.doc) cached = j.doc;
  } catch { /* backend down → keep the baked default */ }
}

/** The cached published main map, or null if none was fetched yet. */
export function mainMapDoc(): LevelDoc | null { return cached; }
