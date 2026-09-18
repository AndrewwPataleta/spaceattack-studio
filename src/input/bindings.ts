// CONTROL PROFILE — the single source of truth for how physical inputs (gamepad buttons + axes,
// keyboard keys, mouse) map to arena actions. Stored in localStorage; read by the drivers (input/drivers.ts)
// that feed the shared `ctl` bus; edited in the Controls screen (#controls, opened from the lobby profile).
// v1 covers GAMEPAD + KEYBOARD/MOUSE. Touch sticks (ArenaControls) stay as-is and are hidden when a
// gamepad/keyboard is in use.

export type ActionId = "jump" | "fire" | "grenade" | "ability" | "crouch" | "emote" | "reload" | "weaponSwitch" | "grenadeSwitch";

// Human labels for the control map (MK-style screen). "move"/"aim" are stick-driven (not single buttons).
export const ACTION_LABEL: Record<string, string> = {
  move: "Движение", aim: "Прицел", fire: "Огонь", jump: "Прыжок",
  crouch: "Присед", grenade: "Граната", ability: "Способность", emote: "Эмоция",
  reload: "Перезарядка", weaponSwitch: "Смена оружия", grenadeSwitch: "Смена гранаты",
};

export interface PadBinds { jump: number; fire: number; grenade: number; ability: number; crouch: number; emote: number; reload: number; weaponSwitch: number; grenadeSwitch: number }
export interface KeyBinds { moveLeft: string; moveRight: string; jump: string; crouch: string; fire: string; grenade: string; ability: string; emote: string; reload: string; weaponSwitch: string; grenadeSwitch: string }

export interface ControlProfile {
  swapSticks: boolean;   // left↔right stick roles (move ↔ aim)
  invertAimX: boolean;
  invertAimY: boolean;
  deadzone: number;      // 0.05..0.4 — dead center of the sticks
  mouseSens: number;     // 0.5..2 — keyboard+mouse aim only
  vibrate: boolean;      // rumble on hit (gamepad)
  pad: PadBinds;
  keys: KeyBinds;
}

// Standard-gamepad button indices (Xbox / DualShock map the same way in browsers):
// 0 A/✕  1 B/○  2 X/□  3 Y/△  4 LB/L1  5 RB/R1  6 LT/L2  7 RT/R2  8 Share/Back  9 Options/Start
// 10 L3  11 R3  12 D-Pad↑  13 D-Pad↓  14 D-Pad←  15 D-Pad→ ;  axes 0/1 = left stick, 2/3 = right stick.
export const DEFAULT_PROFILE: ControlProfile = {
  swapSticks: false,
  invertAimX: false,
  invertAimY: false,
  deadzone: 0.18,
  mouseSens: 1,
  vibrate: true,
  pad: { jump: 0, fire: 7, grenade: 4, ability: 3, crouch: 10, emote: 12, reload: 2, weaponSwitch: 5, grenadeSwitch: 13 },
  keys: { moveLeft: "a", moveRight: "d", jump: " ", crouch: "s", fire: "mouse0", grenade: "g", ability: "e", emote: "q", reload: "r", weaponSwitch: "f", grenadeSwitch: "c" },
};

// Physical-key resolver: on non-Latin layouts `e.key` for the A key is "ф", which would never match a "a"
// binding — so movement/actions silently die. Use `e.code` (layout-independent) for letters/space/digits/
// arrows and fall back to `e.key`. Bindings + capture + live-highlight all go through this so WASD works on
// ANY keyboard layout.
export function keyOf(e: KeyboardEvent): string {
  const c = e.code || "";
  if (/^Key[A-Z]$/.test(c)) return c.slice(3).toLowerCase();   // KeyA -> "a"
  if (c === "Space") return " ";
  if (/^Digit[0-9]$/.test(c)) return c.slice(5);               // Digit1 -> "1"
  if (/^Arrow(Up|Down|Left|Right)$/.test(c)) return c.toLowerCase(); // ArrowLeft -> "arrowleft"
  return (e.key || "").toLowerCase();
}

const KEY = "arena.controls.v1";
let cache: ControlProfile | null = null;

export function getProfile(): ControlProfile {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const j = JSON.parse(raw);
      cache = { ...DEFAULT_PROFILE, ...j, pad: { ...DEFAULT_PROFILE.pad, ...(j.pad || {}) }, keys: { ...DEFAULT_PROFILE.keys, ...(j.keys || {}) } };
      return cache!;
    }
  } catch { /* ignore corrupt storage */ }
  cache = { ...DEFAULT_PROFILE, pad: { ...DEFAULT_PROFILE.pad }, keys: { ...DEFAULT_PROFILE.keys } };
  return cache;
}

export function saveProfile(p: ControlProfile) {
  cache = p;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("controls:changed"));
}

export function resetProfile(): ControlProfile {
  const p: ControlProfile = { ...DEFAULT_PROFILE, pad: { ...DEFAULT_PROFILE.pad }, keys: { ...DEFAULT_PROFILE.keys } };
  saveProfile(p);
  return p;
}

// Pretty names for the control map + rebind rows.
export const PAD_BTN_NAME: Record<number, string> = {
  0: "A / ✕", 1: "B / ○", 2: "X / □", 3: "Y / △", 4: "LB / L1", 5: "RB / R1",
  6: "LT / L2", 7: "RT / R2", 8: "Share", 9: "Options", 10: "L3", 11: "R3",
  12: "D-Pad ↑", 13: "D-Pad ↓", 14: "D-Pad ←", 15: "D-Pad →",
};
export const padBtnName = (i: number) => PAD_BTN_NAME[i] ?? `Кнопка ${i}`;
export const keyName = (k: string) =>
  k === " " ? "Пробел" : k === "mouse0" ? "ЛКМ" : k === "mouse2" ? "ПКМ" :
  k === "arrowleft" ? "←" : k === "arrowright" ? "→" : k === "arrowup" ? "↑" : k === "arrowdown" ? "↓" :
  k.length === 1 ? k.toUpperCase() : k;
