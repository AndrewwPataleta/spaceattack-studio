// MOCK textures + style palettes for the level kit. Until real generated PNGs land (key is out of credits), the
// whole map is skinned by PROCEDURAL canvas textures tinted per STYLE. Picking a style recolors everything; a
// per-object skin override lets one block (e.g. the bridge) use a different style — exactly the "each block a
// different style for freshness" idea. When real art arrives, a slot just points at kit/<slot>.png instead.
import * as THREE from "three";
import type { StyleId } from "../game/levels/levelDoc";

export type Palette = {
  key: StyleId; label: string;
  body: string; deck: string; deckLine: string; seam: string;
  hazard: string; hazardDark: string; glow: string; accent: string; edge: string;
};

export const PALETTES: Record<StyleId, Palette> = {
  station: { key: "station", label: "Станция", body: "#2a3450", deck: "#33405f", deckLine: "#5fd0ff", seam: "#1a2138", hazard: "#f0b81e", hazardDark: "#12100a", glow: "#5fd0ff", accent: "#f0a63a", edge: "#e6ecf7" },
  mine:    { key: "mine",    label: "Шахта",   body: "#3a3020", deck: "#4a3d28", deckLine: "#f0a63a", seam: "#241a10", hazard: "#f0a63a", hazardDark: "#1a1206", glow: "#f0a63a", accent: "#ffcf6b", edge: "#e8d9b8" },
  crystal: { key: "crystal", label: "Кристалл",body: "#2a2450", deck: "#332a5f", deckLine: "#c084ff", seam: "#1a1438", hazard: "#c084ff", hazardDark: "#140a2a", glow: "#c084ff", accent: "#7ee7ff", edge: "#e9dcff" },
  wreck:   { key: "wreck",   label: "Обломки", body: "#3a2430", deck: "#4a2a34", deckLine: "#ff6b6b", seam: "#241016", hazard: "#ff6b6b", hazardDark: "#1a0a0e", glow: "#ff6b6b", accent: "#f0a63a", edge: "#f7d9dc" },
};
export const STYLE_LIST: StyleId[] = ["station", "mine", "crystal", "wreck"];
export const paletteOf = (s: StyleId | undefined): Palette => PALETTES[s ?? "station"] ?? PALETTES.station;

const cache = new Map<string, THREE.Texture>();
function keyed(k: string, build: () => THREE.Texture): THREE.Texture {
  let t = cache.get(k);
  if (!t) { t = build(); cache.set(k, t); }
  return t;
}
function finish(c: HTMLCanvasElement): THREE.Texture {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// dark metal body: panels + seam lights + rivets, tinted by palette
export function panelTexture(pal: Palette): THREE.Texture {
  return keyed(pal.key + ":panel", () => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
    g.fillStyle = pal.body; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = pal.seam; g.lineWidth = 6;
    for (let i = 0; i <= 256; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); }
    g.strokeStyle = pal.edge + "22"; g.lineWidth = 2; g.strokeRect(14, 14, 100, 228); g.strokeRect(142, 14, 100, 228);
    g.fillStyle = pal.glow; g.shadowColor = pal.glow; g.shadowBlur = 10;
    g.fillRect(20, 150, 88, 6); g.fillRect(148, 150, 88, 6);
    g.shadowBlur = 0; g.fillStyle = "#0e162699";
    for (const rx of [22, 106, 150, 234]) for (let ry = 30; ry < 240; ry += 60) { g.beginPath(); g.arc(rx, ry, 3, 0, 7); g.fill(); }
    return finish(c);
  });
}

// top-down walk deck: plate grid + a glowing centre data-line
export function deckTexture(pal: Palette): THREE.Texture {
  return keyed(pal.key + ":deck", () => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
    g.fillStyle = pal.deck; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = pal.seam; g.lineWidth = 5;
    for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    g.fillStyle = pal.edge + "14"; for (let x = 0; x < 256; x += 64) for (let y = 0; y < 256; y += 64) g.fillRect(x + 6, y + 6, 52, 8);
    g.fillStyle = pal.deckLine; g.shadowColor = pal.deckLine; g.shadowBlur = 12; g.fillRect(0, 124, 256, 8); g.shadowBlur = 0;
    g.fillStyle = "#0e162688"; for (const rx of [10, 246]) for (let ry = 12; ry < 256; ry += 64) { g.beginPath(); g.arc(rx, ry, 3, 0, 7); g.fill(); }
    return finish(c);
  });
}

// yellow/black (or accent) diagonal hazard chevrons
export function hazTexture(pal: Palette): THREE.Texture {
  return keyed(pal.key + ":haz", () => {
    const c = document.createElement("canvas"); c.width = 128; c.height = 32; const g = c.getContext("2d")!;
    g.fillStyle = pal.hazardDark; g.fillRect(0, 0, 128, 32);
    for (let x = -32; x < 160; x += 24) { g.fillStyle = pal.hazard; g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 12, 32); g.lineTo(x + 12 + 32, 0); g.lineTo(x + 32, 0); g.closePath(); g.fill(); }
    return finish(c);
  });
}

// mock parallax backdrop by depth kind, tinted by palette (used when a layer has no uploaded src)
export function backdropTexture(kind: "far" | "mid" | "fore", pal: Palette): THREE.Texture {
  return keyed(pal.key + ":bg:" + kind, () => {
    const c = document.createElement("canvas"); c.width = 512; c.height = 512; const g = c.getContext("2d")!;
    if (kind === "far") {
      const grd = g.createLinearGradient(0, 0, 0, 512); grd.addColorStop(0, "#070b16"); grd.addColorStop(1, pal.seam);
      g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
      g.fillStyle = pal.glow; for (let i = 0; i < 120; i++) { g.globalAlpha = 0.2 + (i % 5) * 0.15; g.fillRect((i * 97) % 512, (i * 53) % 512, 2, 2); } g.globalAlpha = 1;
      g.fillStyle = pal.accent + "33"; g.beginPath(); g.arc(360, 150, 90, 0, 7); g.fill();
    } else if (kind === "mid") {
      g.clearRect(0, 0, 512, 512);
      g.fillStyle = pal.seam; for (let i = 0; i < 7; i++) { const w = 40 + (i * 37) % 90, x = (i * 79) % 512; g.fillRect(x, 512 - (90 + (i * 61) % 260), w, 300); }
      g.fillStyle = pal.glow + "cc"; for (let i = 0; i < 40; i++) g.fillRect((i * 113) % 512, 200 + (i * 71) % 260, 3, 3);
    } else {
      g.clearRect(0, 0, 512, 512);
      g.fillStyle = pal.body; g.fillRect(0, 0, 60, 512); g.fillRect(452, 0, 60, 512);
      g.fillStyle = pal.glow; g.fillRect(56, 0, 4, 512); g.fillRect(452, 0, 4, 512);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  });
}

// resolve a texture from a slot: an uploaded dataURL src wins, else the procedural backdrop.
export function textureFromSrc(src: string): THREE.Texture | null {
  if (!src) return null;
  // unique-enough key: dataURLs share a long identical prefix, so mix in length + a middle + tail slice.
  const key = "src:" + src.length + ":" + src.slice(40, 72) + ":" + src.slice(-24);
  return keyed(key, () => {
    const t = new THREE.TextureLoader().load(src); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}
