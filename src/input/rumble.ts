// RUMBLE — dual-rumble haptics on the connected pad (Gamepad vibrationActuator). Standalone (only reads the
// control profile) so game modules (Fighter/Bullets/combat) can import it without pulling the React drivers.
// No-op when the profile disables vibration, no pad is connected, or the browser lacks the API (Safari).
import { getProfile } from "./bindings";

function firstPad(): Gamepad | null {
  const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
  for (const p of pads) if (p && p.connected) return p;
  return null;
}

let lastEnd = 0;
export function rumble(weak: number, strong: number, ms: number) {
  if (!getProfile().vibrate) return;
  const act: any = firstPad() && (firstPad() as any).vibrationActuator;
  if (!act || typeof act.playEffect !== "function") return;
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  // let a stronger/newer effect through, but skip overlapping weak ones so rapid fire doesn't mush into a buzz
  if (now < lastEnd && strong < 0.5) return;
  lastEnd = now + ms;
  try { act.playEffect("dual-rumble", { duration: ms, startDelay: 0, weakMagnitude: weak, strongMagnitude: strong }); } catch { /* unsupported */ }
}

// "lub-dub" heartbeat — an anxious double-pulse for low HP. intensity 0..1 scales the strength.
export function rumbleHeartbeat(intensity: number) {
  const s = 0.4 + 0.4 * intensity;
  rumble(0.3, s, 70);
  setTimeout(() => rumble(0.25, s * 0.8, 70), 150);
}
