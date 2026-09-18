// SINGLE SOURCE OF TRUTH for kill streaks (the "viral moment" layer). Both the server (which counts kills)
// and the client (banner + aura) import this so thresholds/labels/colors never drift.
// A streak = consecutive kills without dying; it resets to 0 on death.

/** @typedef {{ at:number, label:string, color:string }} StreakTier */

/** @type {StreakTier[]} — ascending; `at` is the kill count that triggers the announcement */
export const STREAK_TIERS = [
  { at: 3,  label: "TRIPLE KILL",  color: "#5fd0ff" },
  { at: 5,  label: "RAMPAGE",      color: "#ff8a3a" },
  { at: 7,  label: "UNSTOPPABLE",  color: "#ff4d4d" },
  { at: 10, label: "GODLIKE",      color: "#ffd23a" },
];

// the tier a streak count exactly hits (for the one-shot announcement), or null
export const streakTier = (n) => STREAK_TIERS.find((t) => t.at === n) || null;

// the highest tier a streak has REACHED (for the persistent aura on an on-fire player), or null
export const streakAura = (n) => {
  let hit = null;
  for (const t of STREAK_TIERS) if (n >= t.at) hit = t;
  return hit;
};

// streak >= this means the player is "on fire" (gets the aura)
export const ON_FIRE_AT = STREAK_TIERS[0].at;
