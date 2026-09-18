// Ladder ZONES — used by BOTH the visuals (LaddersView) and the climb mechanic (Fighter). Now GENERATED from the
// single-source arena layout (src/game/levels/layout.ts), so 2D design = climb = 3D geometry, all consistent.
import { genLadderZones, type LadderZone } from "../game/levels/layout";
export type { LadderZone };

// LADDERS climb zones — LIVE binding, driven by the CURRENTLY-LOADED level (CosmosArena calls setLadders from its
// doc). Was a static const from the DEFAULT arena, so ladders never climbed on custom maps (duel/citadel): the
// rendered ladder had no matching climb zone. Now the climb zones always match the rendered geometry.
export let LADDERS: LadderZone[] = genLadderZones();
export function setLadders(zones: LadderZone[]) { LADDERS = zones; }

// climb tuning
export const CLIMB_SPEED = 3.4;      // m/s up/down the ladder
export const LADDER_GRAB_X = 0.9;    // how close (x) you must be to grab (generous so it's easy to catch)
