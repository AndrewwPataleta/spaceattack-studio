// The studio design system: Slate Pro palette + Rubik UI / Space Mono numbers. Now THEMEABLE — DARK (default) and a
// readable LIGHT mode, toggled in #studio. `T` is a single MUTABLE token object everything reads at render time;
// applyTheme() swaps the palette in place (and re-derives the couple of pre-built style objects) so one toggle +
// a re-render restyles the whole editor. btn()/chip()/field/card all resolve from T.
import type { CSSProperties } from "react";

// non-colour tokens (shared by both themes). Apple/Xcode look: San Francisco system font + SF Mono, soft radius.
const CONST = {
  radius: 7,
  ui: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  mono: '"SF Mono", ui-monospace, Menlo, "Roboto Mono", monospace',
  display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
};
// per-theme colour palettes (identical keys), Apple system colours. scene = the 3D viewport background.
const LIGHT = {
  bg: "#ffffff", bg2: "#f5f5f7", panel: "#fffffff5", panelSolid: "#ffffff", border: "#e2e2e6", borderLit: "#d2d2d7",
  ink: "#1d1d1f", dim: "#6e6e73", faint: "#aeaeb2",
  accent: "#0071e3", accentInk: "#ffffff", accent2: "#0071e3", good: "#1a9e4b", warn: "#c9820a", bad: "#e0343f",
  chip: "#f5f5f7", scene: "#e8e8ea", shadow: "0 8px 30px -10px rgba(0,0,0,.13)",
};
const DARK = {
  bg: "#1c1c1e", bg2: "#2c2c2e", panel: "#1c1c1ef2", panelSolid: "#1c1c1e", border: "#38383a", borderLit: "#48484a",
  ink: "#f5f5f7", dim: "#98989d", faint: "#6b6b70",
  accent: "#0a84ff", accentInk: "#ffffff", accent2: "#0a84ff", good: "#30d158", warn: "#ff9f0a", bad: "#ff453a",
  chip: "#2c2c2e", scene: "#161618", shadow: "0 12px 40px -12px rgba(0,0,0,.6)",
};

export type ThemeMode = "dark" | "light";
export let themeMode: ThemeMode = "light";
// the live token object (mutated in place by applyTheme so all `T.x` reads pick up the new theme on next render).
export const T = { ...CONST, ...LIGHT };

// two style objects are pre-built (spread into inputs/cards a lot); re-derive them on theme change so they stay in sync.
const makeField = (): CSSProperties => ({ fontFamily: T.mono, fontSize: 11.5, background: T.bg, color: T.ink, border: `1px solid ${T.border}`, borderRadius: Math.max(0, T.radius - 3), padding: "4px 6px", width: 58 });
const makeCard = (): CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: T.radius + 2, boxShadow: T.shadow });
export const field: CSSProperties = makeField();
export const card: CSSProperties = makeCard();

const themeListeners = new Set<() => void>();
export function onTheme(fn: () => void) { themeListeners.add(fn); return () => { themeListeners.delete(fn); }; }
export function applyTheme(mode: ThemeMode) {
  themeMode = mode;
  Object.assign(T, mode === "light" ? LIGHT : DARK);
  Object.assign(field, makeField()); Object.assign(card, makeCard());
  try { localStorage.setItem("studio_theme", mode); document.documentElement.style.colorScheme = mode; } catch { /* ignore */ }
  themeListeners.forEach((l) => l());
}
export function toggleTheme() { applyTheme(themeMode === "dark" ? "light" : "dark"); }
// restore the saved choice at load (default is LIGHT, so only switch when the user saved DARK)
try { const m = localStorage.getItem("studio_theme"); if (m === "dark") applyTheme("dark"); } catch { /* ignore */ }

// object-kind badge colours (semantic, not themed)
export const KIND_COL = { plat: "#ffd24d", sup: "#7aa0d8", ramp: "#f0a63a", ladder: "#7ee7ff" } as const;

// load the webfonts once (Rubik + Space Mono) + thin the overall weight (no chunky 700/800 everywhere)
let injected = false;
export function injectFonts() {
  if (injected || typeof document === "undefined") return; injected = true;
  const l = document.createElement("link"); l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap";
  document.head.appendChild(l);
  const st = document.createElement("style");
  // Apple/SF look: lighter overall weight, no chunky bold. Antialiased.
  st.textContent = `.studio-root{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;font-weight:400;letter-spacing:-.01em}.studio-root b,.studio-root strong{font-weight:590}`;
  document.head.appendChild(st);
}
injectFonts();

// ── style helpers ─────────────────────────────────────────────────────────────────────────────────────────────
// Apple/Xcode buttons: CLEAN — transparent by default (no grey fill), thin border, ink text. active = accent text +
// accent border + a whisper of accent tint. primary = solid accent (filled) with white text. danger = red outline.
export function btn(active?: boolean, variant?: "ghost" | "primary" | "danger"): CSSProperties {
  const base: CSSProperties = { fontFamily: T.ui, fontSize: 12, fontWeight: 400, cursor: "pointer", borderRadius: T.radius, padding: "6px 11px", transition: "all .12s", border: `1px solid ${T.border}`, background: "transparent", color: T.ink, whiteSpace: "nowrap" };
  if (variant === "danger") return { ...base, color: T.bad, border: `1px solid ${T.bad}55` };
  if (variant === "primary") return { ...base, background: T.accent, color: T.accentInk, border: `1px solid ${T.accent}`, fontWeight: 500 };
  if (active) return { ...base, background: `${T.accent}12`, color: T.accent, border: `1px solid ${T.accent}`, fontWeight: 500 };
  return base;
}
export function chip(active?: boolean): CSSProperties {
  return { fontFamily: T.ui, fontSize: 11, fontWeight: active ? 500 : 400, padding: "4px 9px", borderRadius: 999, cursor: "pointer", background: active ? `${T.accent}12` : "transparent", color: active ? T.accent : T.dim, border: `1px solid ${active ? T.accent : T.border}` };
}
