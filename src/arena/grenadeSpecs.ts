// LIVE-tunable grenade effect params (edited in the labs / in-match panels; read by combat + VFX + overlays).
// Kept dependency-free so gameplay files (combat, Fighter, GameFx) can import them without pulling three.quarks.

// SMOKE — tuned in #smoke / the in-match «ДЫМ ⚙» panel.
export const smokeSpec = { count: 55, life: 8.1, size: 2.9, radius: 1.6, spread: 0.2, gravity: 0.4, spin: 0.8, turb: 0.9, opacity: 0.16, colA: "#f8fafc", colB: "#e6eaef" };

// FLASHBANG — tuned in #flash. radius = blast, dur = blind ms, intensity = peak white (0..1), fade = ease-out ms.
export const flashSpec = { radius: 3.8, dur: 1700, intensity: 1, fade: 800 };

// FREEZE (cryo) — tuned in #freeze. radius = blast, dur = slow ms, slow = movement multiplier while frozen
// (lower = more slow), frostIntensity = peak blue vignette (0..1), frostFade = ease-out ms.
export const freezeSpec = { radius: 3.0, dur: 2600, slow: 0.32, frostIntensity: 0.9, frostFade: 700 };
