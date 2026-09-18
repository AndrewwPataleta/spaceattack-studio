// Global hitstop: brief near-freeze on impactful hits (headshots / kills) for weight.
// Systems multiply their frame dt by timeScale() so everything hitches together.
let until = 0;
export function hitstop(ms: number) { until = Math.max(until, performance.now() + ms); }

// Cinematic slow-motion (killcam): scale the world for a set window. Layered under hitstop (a hitstop still
// wins for its brief freeze). scale 0..1 (e.g. 0.4 = 40% speed).
let slowUntil = 0, slowScale = 1;
export function setSlow(ms: number, scale = 0.4) { slowUntil = performance.now() + ms; slowScale = scale; }
export function clearSlow() { slowUntil = 0; }

export function timeScale() {
  const now = performance.now();
  if (now < until) return 0.04;          // hitstop near-freeze
  if (now < slowUntil) return slowScale;  // cinematic slow-mo
  return 1;
}
