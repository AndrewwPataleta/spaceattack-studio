// Backend-synced MAIN arena map. The studio loads the current published level from the backend (so every origin —
// studio.spaceattack.app, localhost, iPad — shows the SAME level the engine plays) and publishes back to it. This
// replaces the per-origin localStorage draft as the source of truth and the dev-only /__studio/publish file write.
//
// Backend base resolution (same convention as arena/balanceStore.apiBase): ?api=<url> wins, else VITE_API_URL at
// build (set this for the deployed studio → its backend), else dev host:8080.

export type MainMapRecord = { doc: unknown | null; nav: unknown | null; rev: number; updatedAt: number };

export function apiBase(): string {
  try { const p = new URLSearchParams(location.search).get("api"); if (p) return p.replace(/\/$/, ""); } catch { /* */ }
  const env = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL;
  if (env) return env.replace(/\/$/, "");
  return `${location.protocol}//${location.hostname}:8080`;
}

// publish key (prod backend sets ARENA_MAP_KEY → publish requires it): ?mapkey= or VITE_ARENA_MAP_KEY.
function mapKey(): string {
  try { const q = new URLSearchParams(location.search).get("mapkey"); if (q) return q; } catch { /* */ }
  return (import.meta as { env?: Record<string, string> }).env?.VITE_ARENA_MAP_KEY || "";
}

export async function fetchMainMap(): Promise<MainMapRecord | null> {
  try { const r = await fetch(`${apiBase()}/match/main-map`); if (!r.ok) return null; return (await r.json()) as MainMapRecord; }
  catch { return null; }
}

export async function publishMainMap(doc: unknown, nav: unknown): Promise<{ ok: boolean; rev?: number; error?: string }> {
  try {
    const key = mapKey();
    const r = await fetch(`${apiBase()}/match/main-map`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(key ? { "x-arena-map-key": key } : {}) },
      body: JSON.stringify({ doc, nav }),
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const j = (await r.json()) as { rev?: number };
    return { ok: true, rev: j.rev };
  } catch (e) { return { ok: false, error: String((e as Error)?.message || e) }; }
}
