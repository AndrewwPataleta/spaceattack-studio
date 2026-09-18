// DEFAULT MAP — the #studio-authored "Default" arena, saved to src/game/levels/defaultArena.json (exported from
// studio, spawns fixed to real plat ids). Baked in as the default for EVERY mode: defaultDoc() and duelDoc() in
// levelDoc.ts return testMapDoc(). To UPDATE the default map: export a new level from #studio → overwrite
// defaultArena.json (make sure spawns point to real platform ids). Revert: point those doc functions back to originals.
import arena from "./defaultArena.json";
import type { LevelDoc } from "./levelDoc";

// fresh deep copy each call (the renderer/generator may mutate) — never hand out the shared module object.
export function testMapDoc(): LevelDoc { return JSON.parse(JSON.stringify(arena)) as LevelDoc; }
