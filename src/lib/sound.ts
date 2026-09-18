// Minimal Web Audio SFX (ported from Space Attack). Chosen over <audio> because iOS WKWebView plays
// HTMLAudio unreliably; Web Audio unlocks once on a gesture then plays every clip. Files live in /public/sounds.
let ctx: AudioContext | null = null;
const buffers: Record<string, AudioBuffer | undefined> = {};
const loading: Record<string, Promise<AudioBuffer | null> | undefined> = {};

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) { const AC = window.AudioContext || (window as any).webkitAudioContext; if (AC) ctx = new AC(); }
  return ctx;
}

// ── MASTER MUTE: everything routes through one gain node so a single toggle silences all SFX + loops.
let masterGain: GainNode | null = null;
let muted = (() => { try { return localStorage.getItem("arena.muted") === "1"; } catch { return false; } })();
function master(): AudioNode | null {
  const c = getCtx(); if (!c) return null;
  if (!masterGain) { masterGain = c.createGain(); masterGain.gain.value = muted ? 0 : 1; masterGain.connect(c.destination); }
  return masterGain;
}
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem("arena.muted", m ? "1" : "0"); } catch { /* ignore */ }
  const c = getCtx(); const g = master(); if (g && c) (g as GainNode).gain.setTargetAtTime(m ? 0 : 1, c.currentTime, 0.02);
}
export function isMuted() { return muted; }

function load(file: string): Promise<AudioBuffer | null> {
  const cached = buffers[file]; if (cached) return Promise.resolve(cached);
  const inflight = loading[file]; if (inflight) return inflight;
  const c = getCtx(); if (!c) return Promise.resolve(null);
  loading[file] = (async () => {
    // a name WITH an extension (e.g. "rampage.mp3") is fetched as-is; a bare name defaults to .wav (back-compat).
    const url = /\.(wav|mp3|ogg)$/i.test(file) ? `/sounds/${file}` : `/sounds/${file}.wav`;
    try { const res = await fetch(url); const arr = await res.arrayBuffer(); const buf = await c.decodeAudioData(arr); buffers[file] = buf; return buf; }
    catch { return null; }
  })();
  return loading[file];
}

// ── SENIOR MIX LAYER: anti-spam (per-sound cooldown + voice cap), pitch variation, distance attenuation, loops.
type SfxOpts = { pitch?: number; minGap?: number; maxVoices?: number };
const lastPlayed: Record<string, number> = {};   // cooldown bookkeeping
const voices: Record<string, number> = {};       // live instances per file (voice cap)
let listenerX = 0;                                 // local player x — for positional attenuation
export function setListener(x: number) { listenerX = x; }

/** play a one-shot clip from /public/sounds/<file>. volume 0..1; opts.pitch=±semitones, opts.minGap=ms cooldown. */
export function playSfx(file: string, volume = 0.6, opts: SfxOpts = {}) {
  const c = getCtx(); if (!c || volume <= 0.001) return;
  const now = performance.now();
  if (opts.minGap && now - (lastPlayed[file] || 0) < opts.minGap) return;       // too soon → skip (no spam)
  if (opts.maxVoices && (voices[file] || 0) >= opts.maxVoices) return;           // too many at once → skip
  lastPlayed[file] = now;
  if (c.state === "suspended") void c.resume().catch(() => {});
  void load(file).then((buf) => {
    if (!buf || !ctx) return;
    const src = ctx.createBufferSource(); src.buffer = buf;
    if (opts.pitch) src.playbackRate.value = Math.pow(2, ((Math.random() * 2 - 1) * opts.pitch) / 12); // ±semitones → no machine-gun sameness
    const g = ctx.createGain(); g.gain.value = Math.max(0, Math.min(1, volume));
    src.connect(g).connect(master() || ctx.destination);
    voices[file] = (voices[file] || 0) + 1;
    src.onended = () => { voices[file] = Math.max(0, (voices[file] || 1) - 1); };
    src.start();
  });
}

/** positional one-shot: attenuates by distance from the local player (self = full, far = silent past ~cutoff m). */
export function playSfxAt(file: string, worldX: number, baseVol = 0.7, cutoff = 16, opts: SfxOpts = {}) {
  const vol = baseVol * Math.max(0, 1 - Math.abs(worldX - listenerX) / cutoff);
  if (vol > 0.03) playSfx(file, vol, opts);
}

// ── LOOPS (ambience / low-hp heartbeat): one instance per file, volume adjustable, stoppable.
const loops: Record<string, { src: AudioBufferSourceNode; gain: GainNode } | undefined> = {};
export function playLoop(file: string, volume = 0.3) {
  const c = getCtx(); if (!c || loops[file]) return;
  if (c.state === "suspended") void c.resume().catch(() => {});
  void load(file).then((buf) => {
    if (!buf || !ctx || loops[file]) return;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const g = ctx.createGain(); g.gain.value = Math.max(0, Math.min(1, volume));
    src.connect(g).connect(master() || ctx.destination); src.start();
    loops[file] = { src, gain: g };
  });
}
export function setLoopVolume(file: string, volume: number) { const l = loops[file]; if (l && ctx) l.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime, 0.1); }
export function stopLoop(file: string) { const l = loops[file]; if (l) { try { l.src.stop(); } catch { /* already stopped */ } loops[file] = undefined; } }

export function haptic(kind: "light" | "heavy" = "light") {
  try { (navigator as any).vibrate?.(kind === "heavy" ? 32 : 12); } catch { /* unsupported */ }
}

// warm the cache so the first play isn't delayed
export function preloadSfx(...files: string[]) { files.forEach((f) => void load(f)); }

// iOS unlock: resume the context on the first user gesture, then stop listening.
if (typeof window !== "undefined") {
  const unlock = () => {
    const c = getCtx(); void c?.resume?.().catch(() => {});
    if (!c || c.state === "running") ["pointerdown", "touchend", "click", "keydown"].forEach((ev) => window.removeEventListener(ev, unlock, true));
  };
  ["pointerdown", "touchend", "click", "keydown"].forEach((ev) => window.addEventListener(ev, unlock, { capture: true, passive: true }));
}
