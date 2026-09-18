// BuildBar — the Cities: Skylines / Sims-style BOTTOM BUILD RIBBON for #studio. A friendlier surface than the top
// «Добавить» menu: pick a level STYLE on the left, a build CATEGORY (tabs), then click a thumbnail CARD to place a
// piece. A description strip explains the focused piece (name + role), like the info panel in city-builders. Drives
// the exact same store/add helpers as the menu — nothing new in the data model, just a nicer way to build.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Kind } from "../game/levels/layout";
import type { StyleId, DecorKind, ParallaxLayer } from "../game/levels/levelDoc";
import { paletteOf } from "./mockTextures";
import { T } from "./theme";

// a FREE structural beam = a background (z≠0) platform: rendered + collides, but NON-walkable (out of nav/validation).
// Drags freely on the X/Z plane. Presets vary length/thickness/orientation (tilt) so you can frame the scene in depth.
export type BeamPreset = { w: number; kind?: Kind; z?: number; rx?: number; ry?: number; rz?: number; depth?: number; double?: boolean; shape?: "truss" | "arch"; h?: number; round?: boolean };

// the callbacks the ribbon needs — provided by StudioApp (same helpers the menu uses).
export type BuildApi = {
  style: StyleId; setStyle: (s: StyleId) => void; tool: string;
  addPlat: (k: Kind, at?: { x: number; y: number }) => void; addRamp: () => void; addLadder: () => void;
  addBeam: (preset: BeamPreset, at?: { x: number; y: number }) => void;
  addKit: (t: DecorKind, variant?: "signal" | "power", at?: { x: number; y: number }) => void; seedDecor: () => void;
  addLayer: (k: ParallaxLayer["kind"]) => void; addDepthDecor: (at?: { x: number; y: number }) => void;
  projectDepth: () => void; clearProjection: () => void;
  setSpawn: (at?: { x: number; y: number }) => void;
  resolveDrop: (clientX: number, clientY: number) => [number, number] | null;
};

// run = click-to-place at a default spot. drop = place at a WORLD point (drag the card onto the map). Items without
// `drop` (ramp/ladder/set/background layers) are click-only — dragging them just does nothing.
type Item = { id: string; icon: string; label: string; desc: string; run: () => void; drop?: (x: number, y: number) => void; armed?: boolean; col?: string };
type Cat = { id: string; icon: string; label: string; items: (b: BuildApi) => Item[] };

const CATS: Cat[] = [
  {
    id: "plat", icon: "▭", label: "Платформы",
    items: (b) => [
      { id: "ground", icon: "▬", label: "Земля", desc: "Сплошной пол арены — основа всех боёв.", run: () => b.addPlat("ground"), drop: (x, y) => b.addPlat("ground", { x, y }) },
      { id: "low", icon: "▭", label: "Нижний", desc: "Нижний ярус — первое укрытие над землёй.", run: () => b.addPlat("low"), drop: (x, y) => b.addPlat("low", { x, y }) },
      { id: "mid", icon: "▢", label: "Средний", desc: "Средний ярус — основная боевая платформа.", run: () => b.addPlat("mid"), drop: (x, y) => b.addPlat("mid", { x, y }) },
      { id: "high", icon: "⬒", label: "Верхний", desc: "Верхний перч — снайперская позиция, награда за высоту.", run: () => b.addPlat("high"), drop: (x, y) => b.addPlat("high", { x, y }) },
      { id: "island", icon: "◈", label: "Остров", desc: "Центральный джамп-ап — спорная точка карты.", run: () => b.addPlat("island"), drop: (x, y) => b.addPlat("island", { x, y }) },
      { id: "bridge", icon: "═", label: "Мост", desc: "Пролёт без опоры — связывает ярусы.", run: () => b.addPlat("bridge"), drop: (x, y) => b.addPlat("bridge", { x, y }) },
      { id: "spawn", icon: "◎", label: "Спавн", desc: "Точка старта плейтеста — куда встаёт игрок. Перетащи на карту (или кликни), потом её же можно двигать в сцене.", run: () => b.setSpawn(), drop: (x, y) => b.setSpawn({ x, y }), col: "#37ff9a" },
    ],
  },
  {
    id: "beam", icon: "▬", label: "Балки",
    items: (b) => {
      const C = "#7f9bbf"; // structural grey-blue — reads as "background scenery", distinct from playable platforms
      const beam = (id: string, icon: string, label: string, desc: string, preset: BeamPreset): Item =>
        ({ id, icon, label, desc, run: () => b.addBeam(preset), drop: (x, y) => b.addBeam(preset, { x, y }), col: C });
      return [
        beam("beam-h", "▬", "Балка", "Свободная балка в глубину — таскай куда угодно, не платформа (не ходят).", { w: 8, kind: "bridge", z: -4 }),
        beam("beam-round", "◍", "Круглая", "Скруглённая балка — гладкий профиль-капсула (труба/свод).", { w: 8, kind: "bridge", z: -4, round: true }),
        beam("beam-long", "▭", "Длинная", "Длинный пролёт — перекрытие через всю сцену.", { w: 16, kind: "bridge", z: -5 }),
        beam("beam-v", "│", "Столб", "Вертикальная опора — балка повёрнута на 90°.", { w: 7, kind: "bridge", z: -4, rz: Math.PI / 2 }),
        beam("beam-diag", "╱", "Наклонная", "Диагональная балка — раскос, ферма.", { w: 9, kind: "bridge", z: -4, rz: 0.6 }),
        beam("beam-par", "═", "Параллель", "Две параллельные балки разом.", { w: 9, kind: "bridge", z: -4, double: true }),
        beam("beam-block", "▮", "Блок", "Толстый объём в глубину — колонна / контрфорс.", { w: 4, kind: "mid", z: -5, depth: 6 }),
        beam("beam-truss", "◺", "Ферма", "Ферма из балок — верхний и нижний пояс + раскосы.", { w: 14, kind: "bridge", z: -5, shape: "truss", h: 2.4 }),
        beam("beam-arch", "◠", "Арка", "Арка из сегментов — свод / проём.", { w: 12, kind: "bridge", z: -5, shape: "arch", h: 4 }),
      ];
    },
  },
  {
    id: "link", icon: "╱", label: "Проходы",
    items: (b) => [
      { id: "ramp", icon: "╱", label: "Рампа", desc: "Плавный подъём. Кликни две платформы, чтобы соединить.", run: b.addRamp, armed: b.tool === "add-ramp", col: T.accent },
      { id: "ladder", icon: "≣", label: "Лестница", desc: "Вертикальный подъём. Кликни две платформы.", run: b.addLadder, armed: b.tool === "add-ladder", col: "#7ee7ff" },
    ],
  },
  {
    id: "prop", icon: "▦", label: "Пропы",
    items: (b) => [
      { id: "pipe", icon: "┃", label: "Труба", desc: "Процедурная, тайлится по длине. Двигай по глубине Z.", run: () => b.addKit("pipe"), drop: (x, y) => b.addKit("pipe", "signal", { x, y }), col: "#c084ff" },
      { id: "crate", icon: "▦", label: "Ящик", desc: "Укрытие. Можно сделать «твёрдым» — об него натыкаешься.", run: () => b.addKit("crate"), drop: (x, y) => b.addKit("crate", "signal", { x, y }), col: "#c084ff" },
      { id: "barrel", icon: "⬒", label: "Бочка", desc: "Низкое укрытие / декор. Тоже может быть твёрдой.", run: () => b.addKit("barrel"), drop: (x, y) => b.addKit("barrel", "signal", { x, y }), col: "#c084ff" },
      { id: "cable-s", icon: "≋", label: "Кабель", desc: "Сигнальный пучок — тонкий, свисает под платформами.", run: () => b.addKit("cable", "signal"), drop: (x, y) => b.addKit("cable", "signal", { x, y }), col: "#c084ff" },
      { id: "cable-p", icon: "⌇", label: "Силовой", desc: "Силовой кабель — толще, оранжевый hazard-окрас.", run: () => b.addKit("cable", "power"), drop: (x, y) => b.addKit("cable", "power", { x, y }), col: "#c084ff" },
      { id: "set", icon: "✦", label: "Набор", desc: "Набор декора разом: трубы + кабели + ящики + бочки.", run: b.seedDecor, col: T.accent },
    ],
  },
  {
    id: "depth", icon: "▤", label: "Глубина",
    items: (b) => [
      { id: "far", icon: "░", label: "Фон", desc: "Дальний параллакс-слой (небо / каньон). Загрузи картинку во вкладке «Фон».", run: () => b.addLayer("far"), col: "#5fd0ff" },
      { id: "mid", icon: "▒", label: "Задник", desc: "Средний слой глубины между фоном и игрой.", run: () => b.addLayer("mid"), col: "#5fd0ff" },
      { id: "fore", icon: "▓", label: "Перед", desc: "Передний план — рамка кадра поверх сцены.", run: () => b.addLayer("fore"), col: "#5fd0ff" },
      { id: "decor", icon: "◧", label: "Декор-бокс", desc: "Фоновый бокс в глубину (−Z), без коллайдера — заполняет пустоту.", run: () => b.addDepthDecor(), drop: (x, y) => b.addDepthDecor({ x, y }), col: "#5fd0ff" },
      { id: "project", icon: "⧉", label: "Проекция", desc: "Продлить арену в глубину: копии твоего уровня уходят назад и вверх слоями — мир будто продолжается. Клик снова — пересобрать.", run: () => b.projectDepth(), col: "#37ff9a" },
      { id: "unproject", icon: "⌫", label: "Убрать", desc: "Убрать проекцию глубины (слои proj_).", run: () => b.clearProjection(), col: "#ff8a6b" },
    ],
  },
];

const OPEN_KEY = "studio_buildbar_open";

export function BuildBar({ api }: { api: BuildApi }) {
  const [catId, setCatId] = useState("plat");
  const [open, setOpen] = useState(() => { try { return localStorage.getItem(OPEN_KEY) !== "0"; } catch { return true; } });
  const [hover, setHover] = useState<Item | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const flashT = useRef<number | undefined>(undefined);
  const [ghost, setGhost] = useState<{ item: Item; x: number; y: number; ok: boolean } | null>(null);
  const pending = useRef<{ item: Item; x0: number; y0: number; moved: boolean } | null>(null);
  const apiRef = useRef(api); apiRef.current = api;
  useEffect(() => { try { localStorage.setItem(OPEN_KEY, open ? "1" : "0"); } catch { /* ignore */ } }, [open]);

  const cat = CATS.find((c) => c.id === catId) ?? CATS[0];
  const items = cat.items(api);
  const pal = paletteOf(api.style);
  // description line: dragging card → hovered card → else the currently-armed link tool → else category hint.
  const armed = items.find((i) => i.armed) ?? null;
  const info = ghost?.item ?? hover ?? armed;

  const flashIt = useCallback((id: string) => { setFlash(id); window.clearTimeout(flashT.current); flashT.current = window.setTimeout(() => setFlash(null), 260); }, []);
  // is the cursor over the 3D canvas (so a drop lands on the map, not on a panel)?
  const overCanvas = (x: number, y: number) => { const el = document.elementFromPoint(x, y); return !!el && el.tagName === "CANVAS"; };
  const onWinMove = useCallback((e: PointerEvent) => {
    const p = pending.current; if (!p) return;
    if (!p.moved && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 6) return;
    p.moved = true;
    if (p.item.drop) setGhost({ item: p.item, x: e.clientX, y: e.clientY, ok: overCanvas(e.clientX, e.clientY) });
  }, []);
  const onWinUp = useCallback((e: PointerEvent) => {
    const p = pending.current; pending.current = null;
    window.removeEventListener("pointermove", onWinMove); window.removeEventListener("pointerup", onWinUp);
    setGhost(null); document.body.style.cursor = "";
    if (!p) return;
    if (!p.moved) { p.item.run(); flashIt(p.item.id); return; }      // no drag → treat as a click (place at default spot)
    if (!p.item.drop || !overCanvas(e.clientX, e.clientY)) return;   // dropped off the map / not droppable → cancel
    const w = apiRef.current.resolveDrop(e.clientX, e.clientY);
    if (w) { p.item.drop(w[0], w[1]); flashIt(p.item.id); }
  }, [onWinMove, flashIt]);
  const onCardDown = useCallback((it: Item, e: React.PointerEvent) => {
    if (e.button !== 0) return; e.preventDefault();
    pending.current = { item: it, x0: e.clientX, y0: e.clientY, moved: false };
    if (it.drop) document.body.style.cursor = "grabbing";
    window.addEventListener("pointermove", onWinMove); window.addEventListener("pointerup", onWinUp);
  }, [onWinMove, onWinUp]);
  useEffect(() => () => { window.removeEventListener("pointermove", onWinMove); window.removeEventListener("pointerup", onWinUp); }, [onWinMove, onWinUp]);

  return (
    <>
    <div style={{ position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)", pointerEvents: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 0, maxWidth: "min(940px, calc(100% - 120px))" }}>
      {/* collapsed → a single «строить» pill */}
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 999, padding: "7px 16px", color: T.accent, fontFamily: T.ui, fontSize: 12.5, fontWeight: 500, boxShadow: T.shadow }}>
          🧱 Строить <span style={{ color: T.faint, fontSize: 11 }}>▲</span>
        </button>
      ) : (
        <div style={{ background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: T.shadow, overflow: "hidden", width: "max-content", maxWidth: "100%" }}>
          {/* info strip: name + role of the focused piece (Cities-Skylines info panel) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", borderBottom: `1px solid ${T.border}`, background: T.bg2, minHeight: 20 }}>
            {info ? (<>
              <span style={{ fontFamily: T.ui, fontWeight: 600, fontSize: 12.5, color: info.col ?? T.accent, whiteSpace: "nowrap" }}>{info.icon} {info.label}</span>
              <span style={{ fontFamily: T.ui, fontSize: 11.5, color: T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{info.desc}</span>
            </>) : (
              <span style={{ fontFamily: T.ui, fontSize: 11.5, color: T.faint }}>Кликни деталь, чтобы построить. Наведи — покажу описание.</span>
            )}
            <button onClick={() => setOpen(false)} title="свернуть" style={{ marginLeft: "auto", cursor: "pointer", background: "transparent", border: "none", color: T.faint, fontSize: 12, padding: "0 2px" }}>▾</button>
          </div>

          <div style={{ display: "flex", alignItems: "stretch" }}>
            {/* category tabs + thumbnail cards */}
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <div style={{ display: "flex", gap: 2, padding: "7px 8px 4px", borderBottom: `1px solid ${T.border}` }}>
                {CATS.map((c) => { const on = c.id === catId; return (
                  <button key={c.id} onClick={() => setCatId(c.id)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: on ? T.bg2 : "transparent", color: on ? T.accent : T.dim, border: `1px solid ${on ? T.accent : "transparent"}`, borderRadius: 8, padding: "5px 11px", fontFamily: T.ui, fontSize: 12, fontWeight: on ? 500 : 400 }}>
                    <span style={{ fontSize: 13 }}>{c.icon}</span>{c.label}
                  </button>
                ); })}
              </div>
              <div style={{ display: "flex", gap: 7, padding: "9px 10px", overflowX: "auto", maxWidth: 640 }}>
                {items.map((it) => { const on = !!it.armed, fl = flash === it.id; const ac = it.col ?? T.accent; return (
                  <button key={it.id} title={it.drop ? "клик — поставить · или перетащи на карту" : "клик — поставить"} onPointerDown={(e) => onCardDown(it, e)} onMouseEnter={() => setHover(it)} onMouseLeave={() => setHover((h) => (h === it ? null : h))}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: it.drop ? "grab" : "pointer", width: 68, flexShrink: 0, background: "transparent", border: "none", padding: 0, touchAction: "none" }}>
                    <span style={{ width: 60, height: 52, display: "grid", placeItems: "center", fontSize: 24, color: on ? ac : T.ink, borderRadius: 10, background: fl ? `${ac}33` : `linear-gradient(155deg, ${T.bg2}, ${pal.body}66)`, border: `1.5px solid ${on ? ac : T.border}`, boxShadow: on ? `0 0 0 2px ${ac}44` : "none", transition: "all .12s" }}>{it.icon}</span>
                    <span style={{ fontFamily: T.ui, fontSize: 10.5, color: on ? ac : T.dim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 66 }}>{it.label}</span>
                  </button>
                ); })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    {/* drag ghost — follows the cursor while you drag a card onto the map */}
    {ghost && (
      <div style={{ position: "fixed", left: ghost.x, top: ghost.y, transform: "translate(-50%, -130%)", pointerEvents: "none", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <span style={{ width: 52, height: 46, display: "grid", placeItems: "center", fontSize: 22, borderRadius: 10, color: ghost.ok ? (ghost.item.col ?? T.accent) : T.dim, background: `${T.panelSolid}`, border: `1.5px solid ${ghost.ok ? (ghost.item.col ?? T.accent) : T.border}`, boxShadow: T.shadow, opacity: 0.95 }}>{ghost.item.icon}</span>
        <span style={{ fontFamily: T.ui, fontSize: 10.5, fontWeight: 500, color: ghost.ok ? T.ink : T.faint, background: `${T.panelSolid}cc`, border: `1px solid ${T.border}`, borderRadius: 6, padding: "1px 6px", whiteSpace: "nowrap" }}>{ghost.ok ? `↧ ${ghost.item.label}` : "за картой"}</span>
      </div>
    )}
    </>
  );
}
