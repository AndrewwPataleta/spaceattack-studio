// SATK REWARD POP — a floating "+N SATK" gold cue that rises ~50px and fades over ~1s. Pure DOM overlay
// (fixed, pointer-events none, over the R3F canvas → zero WebGL cost), driven by a module-level trigger
// `satkPop(n)` + a tiny subscribe/version store (same pattern as Hitmarker/ScoreFlash). CSS-animated, no
// per-frame JS work, so it's mobile-safe. A small pool of live pops (capped) is rendered; each auto-expires.
//
// HONESTY NOTE (READ ME): the SATK numbers shown here MIRROR the backend reward scale so the cue feels honest,
// but they are COSMETIC ONLY. The authoritative SATK is awarded SERVER-SIDE at match/race end — and the real
// payout is now perTap-MULTIPLIED server-side (a kill = perTap × killTapMult, an overtake = perTap × overtakeTapMult),
// so the real credit is much bigger for a strong tapper. The engine doesn't know the player's perTap, so these are
// APPROXIMATE "feel" cues sized for a REFERENCE perTap (10): kill ≈ 10×10, overtake ≈ 10×5. Actual (bigger) credit
// lands at match/race end. Values mirror the reference expectation:
//   ARENA_KILL_SATK = 100  → refPerTap 10 × ECON.killTapMult 10 (per-kill; win/finish bonus paid at match end)
//   RACE_LAP_SATK   = 120  → backend REWARDS_DEFAULT.perLap (per completed lap)
//   RACE_OVERTAKE_SATK = 80 → refPerTap 10 × ECON.overtakeTapMult 8 (per overtake, capped per race)
export const ARENA_KILL_SATK = 100;
export const RACE_LAP_SATK = 120;
export const RACE_OVERTAKE_SATK = 80;
export const RACE_FINISH_SATK = 700; // mirror backend REWARDS_DEFAULT.finish (per completed race)

import { useEffect, useRef, useState } from "react";

// gold/SATK accent + fonts to match the arena + race HUD (see arena/ui/hudkit UI.warn / UI.font)
const GOLD = "#ffd23a";
const FONT_DISPLAY = "'Anton','Oswald','Russo One',system-ui,sans-serif";
const FONT_MONO = "'IBM Plex Mono',ui-monospace,monospace";
const LIFE = 1000; // ms visible (rise + fade window is ~0.8-1.2s)
const MAX_LIVE = 6; // hard cap so a kill/overtake storm can never flood the DOM

export type SatkPopEvent = { id: number; amount: number; label?: string };
let pid = 0;
const subs = new Set<() => void>();
let live: SatkPopEvent[] = [];
function emit() { subs.forEach((f) => f()); }

/** Fire a floating "+N SATK" cue. `label` is an optional small caption (e.g. "ОБГОН"). Safe to spam. */
export function satkPop(amount: number, label?: string) {
  live = [...live, { id: ++pid, amount, label }].slice(-MAX_LIVE);
  emit();
  // auto-expire after LIFE so `live` never grows unbounded (the CSS animation is `both`, so it stays faded).
  const myId = pid;
  setTimeout(() => { live = live.filter((e) => e.id !== myId); emit(); }, LIFE + 60);
}

let cssDone = false;
function ensureCss() {
  if (cssDone || typeof document === "undefined") return; cssDone = true;
  const s = document.createElement("style");
  // rise ~54px + scale-pop in, hold, then fade out — all on the compositor (opacity + transform only).
  s.textContent =
    "@keyframes satk-pop{0%{opacity:0;transform:translate(-50%,10px) scale(.7)}18%{opacity:1;transform:translate(-50%,0) scale(1.12)}34%{transform:translate(-50%,-6px) scale(1)}72%{opacity:1;transform:translate(-50%,-40px) scale(1)}100%{opacity:0;transform:translate(-50%,-54px) scale(1)}}";
  document.head.appendChild(s);
}

/** Mount ONCE over the canvas (arena BattleHud / race RaceHud). Arena + racing never share the screen, so a
 *  single module store is fine; whichever surface is live renders the pops. */
export function SatkPop() {
  const [, force] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ensureCss();
    const cb = () => force((n) => (n + 1) % 1e6);
    subs.add(cb);
    return () => { subs.delete(cb); };
  }, []);
  return (
    // centred column, just above screen-centre — non-intrusive, reads like a HUD reward tick
    <div ref={box} style={{ position: "fixed", left: "50%", top: "38%", zIndex: 58, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      {live.map((e) => (
        <div key={e.id} style={{ position: "relative", left: 0, animation: `satk-pop ${LIFE}ms ease-out both`, textAlign: "center", transform: "translate(-50%, 0)" }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 5, fontFamily: FONT_DISPLAY, color: GOLD, textShadow: `0 0 16px ${GOLD}cc, 0 2px 0 #000`, lineHeight: 1 }}>
            <span style={{ fontSize: 34 }}>+{e.amount}</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 15, letterSpacing: 2, fontWeight: 900 }}>SATK</span>
          </div>
          {e.label && (
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 3, color: GOLD, opacity: 0.85, textShadow: "0 1px 0 #000", marginTop: 1 }}>{e.label}</div>
          )}
        </div>
      ))}
    </div>
  );
}
