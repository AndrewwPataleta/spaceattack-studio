// SINGLE SOURCE for the TANK ballistic-shield (held front-arm shield) numbers + pose mapping.
// Imported by the client (combat.ts), the server (authoritative absorb/regen) and the bot AI (shield_* anim)
// so all three agree — offline and online play the same shield, no drift.
export const SHIELD_HP = 150;        // durability: soaks 75% of blocked damage until depleted
export const SHIELD_PASS = 0.25;     // fraction that leaks through an INTACT frontal shield (75% blocked)
export const SHIELD_BREAK_MS = 6000; // stays broken this long after depletion (then regenerates out of fire)
export const SHIELD_REGEN = 45;      // hp/sec the shield rebuilds while out of fire

// Map a base locomotion anim to the tank BLOCK-STANCE pose. The shield is UP only while PLANTED
// (idle/crouch/jump); running or shooting STOWS it (pistol poses). A BROKEN shield → plain assault poses.
// This is exactly the offline Fighter.tsx mapping, factored out so server bots produce the same anims.
export function shieldAnim(role, base, broken) {
  if (base === "climb" || base === "mantle") return base; // both hands on the rungs → never a shield/pistol pose (tank climbed sideways otherwise)
  if (role !== "tank" || broken) return base;
  if (base === "idle") return "shield_idle";
  if (base === "crouch") return "shield_crouch";
  if (base === "air" || base === "jump") return "shield_jump";
  if (base === "run" || base === "run_back") return "pistol_run"; // moving → shield stowed
  if (base === "shoot") return "pistol_idle";                     // firing → shield stowed
  return base;
}
// Is the tank ACTIVELY blocking right now? Read purely from the (network-synced) anim string — clock-free, so
// the server and every client agree without sharing a clock. Block = the shield pose is up (planted stance).
export function shieldBlockingAnim(anim) { return typeof anim === "string" && anim.startsWith("shield_"); }
