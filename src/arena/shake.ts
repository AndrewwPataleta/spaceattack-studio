// TRAUMA-based camera shake (dep-free). Ported pattern from GDC "juice" talks: events add TRAUMA (0..1),
// trauma decays every frame, and the screen offset = trauma^2 (quadratic → small hits barely move, big hits
// slam) times a smooth time-based pseudo-noise. No React, no three, no per-frame Math.random (which would
// make the shake jitter incoherently); instead a cheap sin/tri mix per axis gives a smooth wobble.
//
// USAGE (from the camera's useFrame):
//   const s = shakeSample(dt);
//   cam.position.x += s.x; cam.position.y += s.y; cam.rotation.z = s.rot;
//
// USAGE (from gameplay): addShake(0.35) on a shot, addShake(0.7) on an explosion, etc.

// Tunable magnitudes — the parent bakes these defaults into the game. Kept small & tasteful.
// Baked to the МЯГКО (soft/cinematic) profile — user preference: a gentle, non-fatiguing shake, not a slam.
// (The punchier БАЛАНС/СОЧНО/ХАРДКОР profiles still live in #juice for tuning.)
export const shakeSpec = {
  maxX: 0.26,   // max horizontal offset (world units) at full trauma
  maxY: 0.17,  // max vertical offset
  maxRot: 0.018, // max roll (radians) at full trauma
  decay: 2.3,  // trauma units bled off per second (higher = settles faster)
  freq: 20,    // noise oscillation speed (higher = jitterier)
};

let trauma = 0;      // 0..1
let t = 0;           // internal clock (seconds), advanced by dt in shakeSample

/** Add trauma. Bigger events pass bigger amounts. Clamped so it can never exceed full shake. */
export function addShake(amount: number) {
  if (!(amount > 0)) return;
  trauma = Math.min(1, trauma + amount);
}

/** Current trauma (0..1) — handy for debug/UI readouts. */
export function shakeTrauma() { return trauma; }

/** Hard reset (e.g. on respawn / scene change) so a queued shake doesn't leak across a cut. */
export function resetShake() { trauma = 0; }

// Cheap smooth pseudo-noise in [-1,1]: a triangle wave modulated by a sine at a different frequency per seed.
// Coherent frame-to-frame (function of the clock, not random), so the shake reads as motion, not static hiss.
function noise(time: number, seed: number): number {
  const a = Math.sin(time * (1 + seed * 0.37) + seed * 12.9898);
  // triangle from a phase-shifted sine → different harmonic content, mix for a less pure/rounder wobble
  const p = time * (0.73 + seed * 0.19) + seed * 4.1;
  const tri = 2 * Math.abs(2 * (p / (2 * Math.PI) - Math.floor(p / (2 * Math.PI) + 0.5))) - 1;
  return Math.max(-1, Math.min(1, a * 0.65 + tri * 0.35));
}

/**
 * Advance + sample the shake. Call ONCE per frame from the camera.
 * @returns {x,y,rot} additive offsets (rot in radians). All zero when trauma is 0.
 */
export function shakeSample(dt: number): { x: number; y: number; rot: number } {
  // clamp dt so a long stall (tab refocus) doesn't teleport the clock or nuke all trauma at once
  const d = Math.max(0, Math.min(0.05, dt));
  trauma = Math.max(0, trauma - shakeSpec.decay * d);
  if (trauma <= 0) { t += d * shakeSpec.freq; return { x: 0, y: 0, rot: 0 }; }
  t += d * shakeSpec.freq;
  const shake = trauma * trauma; // quadratic falloff
  return {
    x: shakeSpec.maxX * shake * noise(t, 0),
    y: shakeSpec.maxY * shake * noise(t, 1),
    rot: shakeSpec.maxRot * shake * noise(t, 2),
  };
}
