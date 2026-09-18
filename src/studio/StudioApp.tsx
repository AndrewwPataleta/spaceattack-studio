// #studio - the LEVEL EDITOR (studio.spaceattack.app). Evolves the #platlab viewer into a real editor: select /
// move (drag) / resize / add / delete objects, per-object style skins, depth/parallax layers, live validation,
// undo/redo, save/load/export, and one-click playtest. Reads & writes the LevelDoc via the studio store.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, OrthographicCamera, TransformControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CosmosArena, blockout, WALL_VARIANTS } from "../game/levels/cosmos";
import { GROUND_TOP, THICK, worldTop, levelObjects, edges, rampGeom, genLadderZones, canJump, jumpGap, type Kind, type LevelObj, type Plat } from "../game/levels/layout";
import { layoutOf, defaultDecor, blankDoc, starterDoc, encodeDoc, type LevelDoc, type StyleId, type ParallaxLayer, type DecorProp, type DecorKind } from "../game/levels/levelDoc";
import { genNav, autoWaypoints } from "../game/levels/genNav";
import { STAND } from "../../shared/nav.mjs";
import { STYLE_LIST, paletteOf } from "./mockTextures";
import { validate, type Verdict } from "./validate";
import { TEMPLATES } from "./templates";
import { t, useLang, setLang, getLang, LANGS, LANG_NAMES, type Lang } from "./i18n";
import { genRandomMap, depthEcho, rng, DEFAULT_OPTS, type MapOpts } from "./genMap";

const WALL_LABEL: Record<string, string> = { plat_under1: "низ: трубы", plat_under2: "низ: фермы", plat_under3: "низ: трубопровод", back_panel: "панели", back_hatch: "люки", back_pipes: "трубы", back_cargo: "трюм", back_reactor: "реактор", back_vents: "вентиляция" };
import { Tutor, tutorSeen } from "./Tutor";
import { BuildBar, type BuildApi, type BeamPreset } from "./BuildBar";
import { T, KIND_COL, btn, field, toggleTheme, themeMode, onTheme } from "./theme";
import * as store from "./store";
import { fetchMainMap, publishMainMap } from "./mainMap";

// grid SNAP step - mutable so a header control can switch it (1 / 0.5 / 0.25 / off) for coarse vs fine placement.
let SNAP = 0.5;
export function setSnap(s: number) { SNAP = s; }
export function getSnap() { return SNAP; }
const snap = (v: number) => (SNAP > 0 ? Math.round(v / SNAP) * SNAP : +v.toFixed(2));
const KINDS: Kind[] = ["ground", "low", "mid", "high", "island", "bridge"];
const VIEWS: { id: string; label: string }[] = [{ id: "front", label: "Фронт" }, { id: "isoL", label: "¾ слева" }, { id: "isoR", label: "¾ справа" }, { id: "top", label: "Сверху" }];
const font = T.ui;
const uid = (p: string) => p + "_" + Math.random().toString(36).slice(2, 6);

// per-platform texture presets (from the kit) for the deck (top) and sides/underside - plus "⭱ upload your own".
const KIT = (f: string) => "/cosmos/kit/" + f;
const DECK_TEX: [string, string][] = [["plat_deck.webp", "дека"], ["bridge_grate.webp", "решётка"], ["ramp_tread.webp", "рифль"], ["crate_top.webp", "ящик-верх"], ["cover_hi.png", "укрытие"]];
const SIDE_TEX: [string, string][] = [["plat_side.webp", "борт"], ["plat_under1.png", "низ: трубы"], ["plat_under2.png", "низ: фермы"], ["plat_under3.png", "низ: трубопровод"], ["crate_side.webp", "ящик-бок"], ["crate_hex.webp", "гекс"], ["back_panel.png", "панель"], ["sup_side.webp", "опора"]];
// one texture slot: swatch preview + kit-preset dropdown + upload (data-URL) + clear. onSet(undefined) resets to default.
function TexRow({ label, cur, presets, onSet }: { label: string; cur?: string; presets: [string, string][]; onSet: (v?: string) => void }) {
  const up = (f: File) => { const r = new FileReader(); r.onload = () => onSet(String(r.result)); r.readAsDataURL(f); };
  const isPreset = !!cur && presets.some(([f]) => KIT(f) === cur);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 28, height: 28, borderRadius: 5, border: `1px solid ${T.border}`, flexShrink: 0, background: cur ? `center/cover url(${cur})` : "repeating-conic-gradient(#8883 0 25%, transparent 0 50%) 0/9px 9px" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: T.dim, marginBottom: 2 }}>{label}{cur && !isPreset ? t(" · своя") : ""}</div>
        <select value={isPreset ? cur : ""} onChange={(e) => onSet(e.target.value || undefined)} style={{ ...field, width: "100%" }}>
          <option value="">{t("- по умолчанию -")}</option>
          {presets.map(([f, n]) => <option key={f} value={KIT(f)}>{t(n)}</option>)}
        </select>
      </div>
      <label style={{ ...btn(), padding: "4px 7px", cursor: "pointer" }} title={t("загрузить свою")}>⭱<input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && up(e.target.files[0])} /></label>
      {cur && <button style={{ ...btn(false, "danger"), padding: "4px 7px" }} onClick={() => onSet(undefined)} title={t("сбросить")}>✕</button>}
    </div>
  );
}

// keyboard camera: ARROWS / WASD = PAN, Q/E = zoom (same as #platlab).
function CameraKeys({ orbit }: { orbit: boolean }) {
  const cam = useThree((s) => s.camera) as any;
  const controls = useThree((s) => s.controls) as any;
  const gl = useThree((s) => s.gl);
  const keys = useRef<Record<string, boolean>>({});
  const flying = useRef(false);
  useEffect(() => {
    const tag = () => (document.activeElement?.tagName || "").toLowerCase();
    const dn = (e: KeyboardEvent) => { if (tag() === "input" || tag() === "select" || tag() === "textarea") return; keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", dn); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);
  const R = useMemo(() => new THREE.Vector3(), []), U = useMemo(() => new THREE.Vector3(), []), M = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const k = keys.current; const sp = 22 * dt; let dx = 0, dy = 0;
    // ARROWS pan the camera. (W/E/R/Q are reserved for the gizmo modes; zoom is the mouse wheel.)
    if (k["arrowup"]) dy += sp;
    if (k["arrowdown"]) dy -= sp;
    if (k["arrowleft"]) dx -= sp;
    if (k["arrowright"]) dx += sp;
    if (dx || dy) {
      // pan along the CAMERA's own right/up axes (screen-relative) so arrows feel right even after orbiting
      R.set(1, 0, 0).applyQuaternion(cam.quaternion); U.set(0, 1, 0).applyQuaternion(cam.quaternion);
      M.copy(R).multiplyScalar(dx).addScaledVector(U, dy);
      cam.position.add(M); if (controls) { controls.target.add(M); controls.update(); }
      if (!flying.current) { flying.current = true; gl.domElement.style.cursor = "all-scroll"; } // flying → 4-arrows
    } else if (flying.current) { flying.current = false; gl.domElement.style.cursor = orbit ? "grab" : "default"; }
  });
  return null;
}

// Blender-like reference GRID: faint XY back-plane (for the 2D front view) + an XZ FLOOR grid (reads depth on orbit)
// + coloured X/Y/Z world axes so orientation is always clear. X=orange, Y=cyan, Z=violet.
// A CALM reference grid (Apple/Xcode-ish): only MAJOR lines every 5m + a faint axis, theme-aware so it's a soft light
// grey on the light theme (not a dense dark mesh). Minor 1m lines were removed - they read as cheap clutter and the
// snap is 0.5m anyway (you don't need a line for every cell). Recomputes on theme change.
function ViewGrid() {
  const geo = useMemo(() => {
    const pos: number[] = [], col: number[] = [];
    const light = themeMode === "light";
    const cMajor = new THREE.Color(light ? "#e3e3e6" : "#2a3038");   // soft, single grid tone
    const cAxis = new THREE.Color(light ? "#c9ccd2" : "#3a4450");    // slightly stronger centre lines
    const line = (a: [number, number, number], b: [number, number, number], c: THREE.Color) => { pos.push(a[0], a[1], a[2], b[0], b[1], b[2]); col.push(c.r, c.g, c.b, c.r, c.g, c.b); };
    const bz = -1.4;                                              // XY back-plane - MAJOR only (every 5m)
    for (let x = -60; x <= 60; x += 5) if (x !== 0) line([x, -8, bz], [x, 16, bz], cMajor);
    for (let y = -5; y <= 16; y += 5) if (y !== 0) line([-60, y, bz], [60, y, bz], cMajor);
    const gy = GROUND_TOP;                                        // XZ floor grid - sparse (every 5m)
    for (let x = -45; x <= 45; x += 5) if (x !== 0) line([x, gy, -26], [x, gy, 10], cMajor);
    for (let z = -25; z <= 10; z += 5) line([-45, gy, z], [45, gy, z], cMajor);
    line([-60, 0, bz], [60, 0, bz], cAxis); line([0, -8, bz], [0, 16, bz], cAxis); // centre cross (subtle, not neon)
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [themeMode]);
  return <lineSegments geometry={geo}><lineBasicMaterial vertexColors transparent opacity={light2(themeMode)} depthWrite={false} /></lineSegments>;
}
const light2 = (m: string) => (m === "light" ? 0.9 : 0.5);

// imperative camera commands (zoom in/out, reset, fit-to-level) driven by the bottom-right zoom widget via events.
function ViewCommands({ plats }: { plats: { id: string; x: number; w: number }[] }) {
  const cam = useThree((s) => s.camera) as any;
  const controls = useThree((s) => s.controls) as any;
  useEffect(() => {
    const onCmd = (e: Event) => {
      const d = (e as CustomEvent).detail as string;
      if (d === "in") cam.zoom *= 1.2;
      else if (d === "out") cam.zoom /= 1.2;
      else if (d === "reset") { cam.position.set(0, 3, 40); cam.zoom = 15; if (controls) { controls.target.set(0, 2, 0); controls.update(); } }
      else if (d === "fit") {
        const xs = plats.flatMap((p) => [p.x - p.w / 2, p.x + p.w / 2]);
        const minX = Math.min(-5, ...xs), maxX = Math.max(5, ...xs), cx = (minX + maxX) / 2, span = Math.max(maxX - minX, 10);
        cam.position.set(cx, 3, 40); if (controls) { controls.target.set(cx, 2, 0); controls.update(); }
        cam.zoom = Math.max(5, Math.min(40, (window.innerWidth * 0.55) / span));
      } else if (d.startsWith("view:")) {
        // preset camera angles (flip through Z perspectives): keeps the current target, changes the view direction.
        const tx = controls ? controls.target.x : 0, ty = controls ? controls.target.y : 2;
        const off: Record<string, [number, number, number]> = { front: [0, 1, 40], isoL: [-26, 15, 30], isoR: [26, 15, 30], top: [0, 42, 6] };
        const o = off[d.slice(5)] ?? off.front;
        cam.position.set(tx + o[0], ty + o[1], o[2]); if (controls) controls.update();
      } else if (d === "focus") {
        // frame the SELECTED platforms (or the whole level if nothing selected)
        const selIds = store.getState().selection;
        const target = selIds.length ? plats.filter((p) => selIds.includes(p.id)) : plats;
        const src = target.length ? target : plats;
        const xs = src.flatMap((p) => [p.x - p.w / 2, p.x + p.w / 2]);
        const minX = Math.min(...xs), maxX = Math.max(...xs), cx = (minX + maxX) / 2, span = Math.max(maxX - minX, 8);
        cam.position.set(cx, 3, 40); if (controls) { controls.target.set(cx, 3, 0); controls.update(); }
        cam.zoom = Math.max(6, Math.min(60, (window.innerWidth * 0.5) / span));
      }
      cam.zoom = Math.max(4, Math.min(120, cam.zoom));
      cam.updateProjectionMatrix();
    };
    window.addEventListener("studio-view", onCmd);
    return () => window.removeEventListener("studio-view", onCmd);
  }, [cam, controls, plats]);
  return null;
}

function TierLine({ y, color = "#1c2c48" }: { y: number; color?: string }) {
  return <mesh position={[0, y, -1.5]}><boxGeometry args={[80, 0.015, 0.01]} /><meshBasicMaterial color={color} /></mesh>;
}

// exposes a screen→world resolver (client px → world x/y on the z=0 play plane) so the HTML build ribbon can
// DROP a piece exactly where the cursor is (works in 2D front view and when the camera is orbited).
type DropFn = (clientX: number, clientY: number) => [number, number] | null;
function Unproject({ target }: { target: React.MutableRefObject<DropFn | null> }) {
  const cam = useThree((s) => s.camera) as any;
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
    target.current = (cx, cy) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((cx - rect.left) / rect.width) * 2 - 1, ndcY = -((cy - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera({ x: ndcX, y: ndcY } as any, cam);
      return ray.ray.intersectPlane(plane, hit) ? [hit.x, hit.y] : null;
    };
    return () => { target.current = null; };
  }, [cam, gl, target]);
  return null;
}

// wireframe / polygon shading - flips `wireframe` on every mesh material each frame (survives geometry remounts on
// edits). Off = leaves solid/textured materials untouched.
function Shading({ wire }: { wire: boolean }) {
  const scene = useThree((s) => s.scene);
  const was = useRef(false);
  useFrame(() => {
    if (!wire && !was.current) return;
    scene.traverse((o: any) => {
      const m = o.material; if (!m || o.type === "LineSegments" || o.type === "Line") return;
      if (Array.isArray(m)) m.forEach((x) => ("wireframe" in x) && (x.wireframe = wire)); else if ("wireframe" in m) m.wireframe = wire;
    });
    was.current = wire;
  });
  return null;
}

const PICK_COL = 2; // = COL in cosmos.tsx (default gameplay-slab depth); pick-boxes mirror the rendered beam depth
// shared: true while the pointer is over a gizmo handle or dragging it → the pick overlays must NOT steal the click
// (otherwise a press on the green arrow "falls through" and selects the platform behind it).
const gizmoBusy = { active: false };
// SMART SNAP (City-Skylines / Sims style): while dragging, if the moving block's edges/centre (X) or top (Y) line up
// with ANOTHER block within this tolerance, nudge onto that line and surface a green guide + highlight the match.
const SNAP_TOL = 0.5;
function alignSnap(plats: Plat[], exclude: Set<string>, cx: number, w: number, topY: number) {
  const myXs = [cx - w / 2, cx, cx + w / 2];
  let bx = 0, bxd = SNAP_TOL, bxl: number | null = null, bxo = "";
  let by = 0, byd = SNAP_TOL, byl: number | null = null, byo = "";
  for (const o of plats) {
    if (exclude.has(o.id)) continue;
    for (const ox of [o.x - o.w / 2, o.x, o.x + o.w / 2]) for (const mx of myXs) { const dd = Math.abs(mx - ox); if (dd < bxd) { bxd = dd; bx = ox - mx; bxl = ox; bxo = o.id; } }
    const ot = worldTop(o.y); const dd = Math.abs(topY - ot); if (dd < byd) { byd = dd; by = ot - topY; byl = ot; byo = o.id; }
  }
  return { dx: bx, dTop: by, vx: bxl !== null ? [bxl] : [], hy: byl !== null ? [byl] : [], ids: [bxo, byo].filter(Boolean) as string[] };
}
// per-platform pick+drag overlay + rubber-band (marquee) box-select on empty space + GROUP move of the whole selection.
type DragState = { startX: number; startTopY: number; base: Record<string, { x: number; y: number }>; kind: "plat" | "decor" | "ladder" | "resize" | "depthz" | "platxz" | "decorxz"; ladder?: { lo: number; hi: number }; resize?: { id: string; fixedEdge: number; side: "L" | "R" }; depthz?: { id: string; frontWorldZ: number; topY: number } };
function PlatOverlays({ doc, selection, unreachable, orbit, showBg }: { doc: LevelDoc; selection: string[]; unreachable: Set<string>; orbit: boolean; showBg: boolean }) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);   // object under the cursor → subtle highlight (UX feedback)
  const [marquee, setMarquee] = useState<{ x0: number; y0: number; x1: number; y1: number; add: boolean } | null>(null);
  const [guides, setGuides] = useState<{ vx: number[]; hy: number[]; ids: string[] } | null>(null); // green snap guides while dragging
  const anySel = selection.length > 0; // focus mode: dim the non-selected blocks so the selection stands out
  const cam = useThree((s) => s.camera) as any;
  const controls = useThree((s) => s.controls) as any;
  const gl = useThree((s) => s.gl);
  // context-aware CURSOR: default / grab(orbit ready) / grabbing(tumble/move) / crosshair(marquee) / pointer(hover)
  const base = () => (orbit ? "grab" : "default");
  const cur = (c: string) => { gl.domElement.style.cursor = c; };
  useEffect(() => { cur(base()); }, [orbit]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // sticky/Alt orbit is driven by OrbitControls → reflect grab→grabbing on its drags
    const el = gl.domElement; const dn = () => { if (orbit) cur("grabbing"); }; const up = () => cur(base());
    el.addEventListener("pointerdown", dn); window.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", dn); window.removeEventListener("pointerup", up); };
  }, [orbit]); // eslint-disable-line react-hooks/exhaustive-deps
  const hoverOn = () => { if (!orbit && !bgRef.current.mode && !drag) cur("pointer"); };
  const hoverOff = () => { if (!drag && !bgRef.current.mode) cur(base()); };
  // press-and-HOLD (~0.22s) on empty space → tumble/fly; a quick drag → marquee; a click → deselect
  const bgRef = useRef<{ mode: "pending" | "marquee" | "orbit" | null; t: number; wx: number; wy: number; sx: number; sy: number }>({ mode: null, t: 0, wx: 0, wy: 0, sx: 0, sy: 0 });

  // click / start-drag on a platform
  const onPlatDown = (id: string, pointerTopY: number, e: any) => {
    if (gizmoBusy.active) return; // yield to the gizmo handle under the pointer (no fall-through select)
    const st = store.getState();
    if (st.tool !== "select") { handleLinkClick(id); return; }
    // selection: shift toggles; clicking an unselected block selects just it; clicking a selected block keeps the group
    if (e.shiftKey) { store.toggleSelection(id); return; }
    if (!st.selection.includes(id)) store.setSelection(id);
    const sel = store.getState().selection;
    // BACKGROUND piece (z≠0 or rotated), single-selected → drag it FREELY on the horizontal plane (X + depth Z), so
    // you place scenery anywhere "in 360" instead of only sliding it in the play plane. Walkable plats keep X/Y drag.
    const p0 = doc.plats.find((x) => x.id === id);
    if (sel.length === 1 && sel[0] === id && p0 && (p0.z || p0.ry)) {
      store.beginHistory();
      setDrag({ startX: e.point.x, startTopY: e.point.y, base: {}, kind: "platxz", depthz: { id, frontWorldZ: 0, topY: worldTop(p0.y) } });
      e.target?.setPointerCapture?.(e.pointerId); cur("grabbing");
      return;
    }
    store.beginHistory();
    const base: Record<string, { x: number; y: number }> = {};
    for (const s of sel) { const p = doc.plats.find((x) => x.id === s); if (p) base[s] = { x: p.x, y: p.y }; }
    setDrag({ startX: e.point.x, startTopY: pointerTopY, base, kind: "plat" });
    e.target?.setPointerCapture?.(e.pointerId); cur("grabbing");
  };
  // begin dragging decor prop(s) - every prop (pipe/crate/barrel/cable/box) is now draggable in x/y.
  const onDecorDown = (rawId: string, e: any) => {
    if (gizmoBusy.active) return;
    const st = store.getState();
    if (st.tool !== "select") return;
    const selId = `decor:${rawId}`;
    if (e.shiftKey) { store.toggleSelection(selId); return; }
    if (!st.selection.includes(selId)) store.setSelection(selId);
    const sel = store.getState().selection;
    // a single BACKGROUND prop (pushed into depth) drags on the HORIZONTAL plane → move it freely in X + depth Z.
    const p0 = doc.decor.find((x) => x.id === rawId);
    if (sel.length === 1 && sel[0] === selId && p0 && (p0.z ?? 0) < -0.5) {
      store.beginHistory();
      setDrag({ startX: e.point.x, startTopY: e.point.y, base: {}, kind: "decorxz", depthz: { id: rawId, frontWorldZ: 0, topY: p0.y } });
      e.target?.setPointerCapture?.(e.pointerId); cur("grabbing");
      return;
    }
    store.beginHistory();
    const base: Record<string, { x: number; y: number }> = {};
    for (const s of sel) { if (!s.startsWith("decor:")) continue; const id = s.slice(6); const p = doc.decor.find((x) => x.id === id); if (p) base[id] = { x: p.x, y: p.y }; }
    setDrag({ startX: e.point.x, startTopY: e.point.y, base, kind: "decor" });
    e.target?.setPointerCapture?.(e.pointerId); cur("grabbing");
  };
  // begin dragging a LADDER along X - its position lives in link.x (else auto-centred). Clamped between the two
  // platforms it connects so it always stays reachable.
  const onLadderDown = (L: { id: string; x: number }, e: any) => {
    if (gizmoBusy.active) return;
    const st = store.getState();
    if (st.tool !== "select") return;
    if (e.shiftKey) { store.toggleSelection(L.id); return; }
    store.setSelection(L.id);
    const link = doc.links.find((l) => l.kind === "ladder" && `ladder:${l.a}-${l.b}` === L.id);
    const a = link && doc.plats.find((p) => p.id === link.a), b = link && doc.plats.find((p) => p.id === link.b);
    if (!a || !b) return;
    const lo = Math.max(edges(a).L, edges(b).L), hi = Math.min(edges(a).R, edges(b).R), m = hi - lo > 1 ? 0.3 : 0;
    store.beginHistory();
    setDrag({ startX: e.point.x, startTopY: e.point.y, base: { [L.id]: { x: L.x, y: 0 } }, kind: "ladder", ladder: { lo: lo + m, hi: hi - m } });
    e.target?.setPointerCapture?.(e.pointerId); cur("grabbing");
  };
  // begin RESIZING a platform by dragging one of its edge handles: the OPPOSITE edge stays pinned, width + centre
  // follow the pointer. This is the "продлить платформу мышкой" the user wanted (was only a number field before).
  const onResizeDown = (p: Plat, side: "L" | "R", e: any) => {
    if (store.getState().tool !== "select" || orbit || gizmoBusy.active) return;
    e.stopPropagation();
    store.setSelection(p.id); store.beginHistory();
    const fixedEdge = side === "R" ? p.x - p.w / 2 : p.x + p.w / 2; // the edge that stays put
    setDrag({ startX: e.point.x, startTopY: e.point.y, base: {}, kind: "resize", resize: { id: p.id, fixedEdge, side } });
    e.target?.setPointerCapture?.(e.pointerId); cur("ew-resize");
  };
  // begin DRAGGING platform DEPTH (Z-extrude) - grab the back edge in the iso view and pull it into the scene. Reads
  // world Z off a HORIZONTAL capture plane at the platform top (onDepthMove), so it works at any camera angle.
  const onDepthDown = (p: Plat, e: any) => {
    if (store.getState().tool !== "select" || orbit || gizmoBusy.active) return;
    e.stopPropagation();
    store.setSelection(p.id); store.beginHistory();
    setDrag({ startX: e.point.x, startTopY: e.point.y, base: {}, kind: "depthz", depthz: { id: p.id, frontWorldZ: (p.z ?? 0) + 1, topY: worldTop(p.y) } });
    e.target?.setPointerCapture?.(e.pointerId); cur("grabbing");
  };
  const onDepthMove = (e: any) => {
    if (!drag || drag.kind !== "depthz" || !drag.depthz) return;
    const nd = Math.max(2, Math.min(40, snap(drag.depthz.frontWorldZ - e.point.z))); // front minus pointer Z = how deep
    store.mutate((d) => { const p = d.plats.find((x) => x.id === drag.depthz!.id); if (!p) return; if (nd > 2.01) p.depth = +nd.toFixed(1); else delete p.depth; });
  };
  // free X + depth-Z placement of a background piece (horizontal plane at its top)
  const onPlatXZMove = (e: any) => {
    if (!drag || drag.kind !== "platxz" || !drag.depthz) return;
    const nx0 = snap(e.point.x), nz = Math.max(-40, Math.min(2, snap(e.point.z)));
    const prim = doc.plats.find((x) => x.id === drag.depthz!.id);
    let nx = nx0, g: { vx: number[]; hy: number[]; ids: string[] } | null = null;
    if (prim) { const a = alignSnap(doc.plats, new Set([prim.id]), nx0, prim.w, worldTop(prim.y)); nx = nx0 + a.dx; if (a.vx.length) g = { vx: a.vx, hy: [], ids: a.ids }; }
    store.mutate((d) => { const p = d.plats.find((x) => x.id === drag.depthz!.id); if (!p) return; p.x = +nx.toFixed(2); p.z = (Math.abs(nz) < 0.25 && !p.ry && !p.rx && !p.rz) ? undefined : +nz.toFixed(2); });
    setGuides(g);
  };
  const onDecorXZMove = (e: any) => {
    if (!drag || drag.kind !== "decorxz" || !drag.depthz) return;
    const nx = snap(e.point.x), nz = Math.max(-40, Math.min(2, snap(e.point.z)));
    store.mutate((d) => { const p = d.decor.find((x) => x.id === drag.depthz!.id); if (!p) return; p.x = nx; p.z = +nz.toFixed(2); });
  };
  const onGroupMove = (e: any) => {
    if (!drag) return;
    const dx = snap(e.point.x - drag.startX), dyTop = snap(e.point.y - drag.startTopY);
    if (drag.kind === "resize" && drag.resize) {
      const { id, fixedEdge, side } = drag.resize; const edge = snap(e.point.x);
      store.mutate((d) => { const p = d.plats.find((x) => x.id === id); if (!p) return;
        const w = Math.max(1, side === "R" ? edge - fixedEdge : fixedEdge - edge);
        p.w = +w.toFixed(1); p.x = +(side === "R" ? fixedEdge + w / 2 : fixedEdge - w / 2).toFixed(2);
      });
      return;
    }
    if (drag.kind === "ladder" && drag.ladder) { const id = Object.keys(drag.base)[0]; const nx = Math.max(drag.ladder.lo, Math.min(drag.ladder.hi, drag.base[id].x + dx)); store.mutate((d) => { const l = d.links.find((k) => k.kind === "ladder" && `ladder:${k.a}-${k.b}` === id); if (l) l.x = +nx.toFixed(2); }); return; }
    if (drag.kind === "decor") { store.mutate((d) => { for (const id of Object.keys(drag.base)) { const p = d.decor.find((x) => x.id === id); if (!p) continue; p.x = drag.base[id].x + dx; p.y = drag.base[id].y + dyTop; } }); return; }
    // SMART SNAP for platform drag: align the PRIMARY block's edges/centre (X) + top (Y) to a neighbour, nudge the
    // whole group by that delta, and surface green guides + highlight the matched block.
    const ids = Object.keys(drag.base); const prim = doc.plats.find((p) => p.id === ids[0]);
    let sdx = dx, sdy = dyTop; let g: { vx: number[]; hy: number[]; ids: string[] } | null = null;
    if (prim) {
      const nx = drag.base[ids[0]].x + dx, ny = Math.max(0, drag.base[ids[0]].y + dyTop);
      const a = alignSnap(doc.plats, new Set(ids), nx, prim.w, worldTop(ny));
      sdx = dx + a.dx; sdy = dyTop + a.dTop;
      if (a.vx.length || a.hy.length) g = { vx: a.vx, hy: a.hy, ids: a.ids };
    }
    store.mutate((d) => { for (const id of ids) { const p = d.plats.find((x) => x.id === id); if (!p) continue; p.x = drag.base[id].x + sdx; p.y = Math.max(0, drag.base[id].y + sdy); } });
    setGuides(g);
  };

  const applyMarquee = (x1: number, y1: number, add: boolean) => {
    const b = bgRef.current; const lo = Math.min(b.wx, x1), hi = Math.max(b.wx, x1), yb = Math.min(b.wy, y1), yt = Math.max(b.wy, y1);
    setMarquee({ x0: b.wx, y0: b.wy, x1, y1, add });
    const inRect = (x: number, y: number) => x >= lo && x <= hi && y >= yb && y <= yt;
    const hits: string[] = doc.plats.filter((p) => { const th = THICK[p.kind ?? "mid"] ?? 0.8; const top = worldTop(p.y), bot = top - th; return p.x - p.w / 2 <= hi && p.x + p.w / 2 >= lo && bot <= yt && top >= yb; }).map((p) => p.id);
    for (const l of doc.links) { const a = doc.plats.find((p) => p.id === l.a), b2 = doc.plats.find((p) => p.id === l.b); if (!a || !b2) continue; if (l.kind === "ramp") { const g = rampGeom(a, b2); if (inRect((g.from[0] + g.to[0]) / 2, worldTop((g.from[1] + g.to[1]) / 2))) hits.push(`ramp:${l.a}-${l.b}`); } }
    for (const L of genLadderZones([], { plats: doc.plats, links: doc.links })) { if (inRect(L.x, (L.yb + L.yt) / 2)) hits.push(L.id); }
    if (showBg) for (const dc of doc.decor) if (inRect(dc.x, dc.y)) hits.push(`decor:${dc.id}`);
    store.setSelectionMany(add ? [...store.getState().selection, ...hits] : hits);
  };
  // orbit the camera around the controls target by screen-pixel deltas (manual tumble that coexists with OrbitControls)
  const orbitBy = (dxs: number, dys: number) => {
    const target = controls ? controls.target : new THREE.Vector3(0, 2, 0);
    const off = new THREE.Vector3().copy(cam.position).sub(target);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta -= dxs * 0.006; sph.phi -= dys * 0.006;
    sph.phi = Math.max(Math.PI * 0.12, Math.min(Math.PI * 0.88, sph.phi));
    off.setFromSpherical(sph); cam.position.copy(target).add(off); if (controls) controls.update();
  };
  const onBgDown = (e: any) => {
    if (store.getState().tool !== "select" || gizmoBusy.active) return; // yield to the gizmo handle over empty space (else its click deselects mid-drag)
    bgRef.current = { mode: "pending", t: performance.now(), wx: e.point.x, wy: e.point.y, sx: e.nativeEvent?.clientX ?? 0, sy: e.nativeEvent?.clientY ?? 0 };
    e.target?.setPointerCapture?.(e.pointerId);
  };
  const onBgMove = (e: any) => {
    const b = bgRef.current; if (!b.mode) return;
    if (b.mode === "pending") {
      const moved = Math.hypot(e.point.x - b.wx, e.point.y - b.wy);
      if (performance.now() - b.t > 220) { b.mode = "orbit"; b.sx = e.nativeEvent?.clientX ?? b.sx; b.sy = e.nativeEvent?.clientY ?? b.sy; cur("grabbing"); }
      else if (moved > 0.6) { b.mode = "marquee"; cur("crosshair"); }
      else return;
    }
    if (b.mode === "marquee") applyMarquee(e.point.x, e.point.y, e.shiftKey);
    else if (b.mode === "orbit") { const cx = e.nativeEvent?.clientX ?? b.sx, cy = e.nativeEvent?.clientY ?? b.sy; orbitBy(cx - b.sx, cy - b.sy); b.sx = cx; b.sy = cy; }
  };
  const onBgUp = (e: any) => {
    if (bgRef.current.mode === "pending" && !e.shiftKey && !gizmoBusy.active) store.setSelection(null); // plain click on empty = deselect (never while the gizmo is in use)
    bgRef.current.mode = null; setMarquee(null); cur(base());
  };

  const mx = marquee ? Math.min(marquee.x0, marquee.x1) : 0, mX = marquee ? Math.max(marquee.x0, marquee.x1) : 0;
  const my = marquee ? Math.min(marquee.y0, marquee.y1) : 0, mY = marquee ? Math.max(marquee.y0, marquee.y1) : 0;

  return (
    <>
      {/* background capture plane (behind platforms): quick-drag = marquee · hold ~0.22s = fly/tumble · click = deselect.
          Disabled while the sticky/Alt orbit is on (then OrbitControls handles LEFT-drag). */}
      {!orbit && <mesh position={[0, 4, -1.2]} onPointerDown={onBgDown} onPointerMove={onBgMove} onPointerUp={onBgUp} onPointerLeave={onBgUp}>
        <planeGeometry args={[400, 200]} /><meshBasicMaterial visible={false} />
      </mesh>}
      {/* DECOR prop overlays - EVERY prop (pipe/crate/barrel/cable/box) is selectable + draggable in-scene. Box sized
          to the prop's footprint per type, anchored like the rendered mesh (crate/barrel sit on y; cable hangs from y). */}
      {doc.decor.map((dc) => {
        const id = `decor:${dc.id}`, seld = selection.includes(id);
        const r = dc.r ?? (dc.type === "barrel" ? 0.48 : 0.18);
        const isBump = dc.type === "crate" || dc.type === "barrel";
        const isModel = dc.type === "model";
        const sc = isBump && !dc.solid ? 0.72 : 1;   // non-solid bump-props render smaller → match the pick box
        // MODEL: the loaded GLB is roughly `scale` tall/wide, so size the grab box to the scale (not the tiny w/h) and
        // sit it OVER the model (grows up from the anchor) → the whole prop is grabbable, not a sliver at its feet.
        const mS = (dc.scale ?? 1);
        const bw = isModel ? Math.max(dc.w, mS * 1.3) : (dc.type === "pipe" ? (dc.dir === "v" ? Math.max(0.7, r * 3) : dc.w) : dc.type === "cable" ? 1.0 : dc.type === "barrel" ? r * 2 : dc.w) * sc;
        const bh = isModel ? Math.max(dc.h, mS * 1.8) : (dc.type === "pipe" ? (dc.dir === "v" ? dc.w : Math.max(0.7, r * 3)) : dc.type === "cable" ? (dc.len ?? 1.8) : dc.type === "barrel" ? (dc.h ?? 1.1) : dc.type === "crate" ? dc.w : dc.h) * sc;
        const cy = isModel ? dc.y + bh * 0.35 : isBump ? dc.y + bh / 2 : dc.type === "cable" ? dc.y - bh / 2 : dc.y;
        // pick-box sits at the prop's REAL depth (dc.z) + yaw (models), so a click lands on the prop exactly where it's
        // rendered - including background/depth props and rotated models, in any camera view.
        const pd = isModel ? Math.max(1.2, mS * 1.2) : 1.4;
        return (
          <mesh key={id} position={[dc.x, cy, dc.z]} rotation={[0, isModel ? ((dc as any).ry ?? 0) : 0, 0]} onPointerOver={() => { hoverOn(); setHoverId(id); }} onPointerOut={() => { hoverOff(); setHoverId((h) => (h === id ? null : h)); }}
            onPointerDown={(e) => { if (orbit) return; e.stopPropagation(); onDecorDown(dc.id, e); }}>
            <boxGeometry args={[bw + 0.2, bh + 0.2, pd]} />
            <meshBasicMaterial transparent opacity={seld ? 0.3 : hoverId === id ? 0.16 : anySel ? 0.4 : 0.001} color={seld || hoverId === id ? "#c084ff" : anySel ? "#060a12" : "#ffffff"} depthWrite={false} />
          </mesh>
        );
      })}
      {doc.plats.map((p) => {
        const th = THICK[p.kind ?? "mid"] ?? 0.8; const topW = worldTop(p.y);
        const sel = selection.includes(p.id); const bad = unreachable.has(p.id);
        // The pick-box now MIRRORS the rendered CleanBeam transform: real x/y/Z + Y-rotation (ry) + real extruded
        // depth, and covers the full body/facade (p.bh). So a click ANYWHERE on the visible block selects it - even
        // when it's pushed into depth (z≠0), rotated, or stretched, and in ANY camera view (front / depth / orbit).
        const bodyH = (p as any).bh ?? 0;
        const d = Math.max(PICK_COL, p.depth ?? 2);     // actual visual depth (matches CleanBeam's `d`)
        const cz = PICK_COL / 2 - d / 2;                // local z centre of the body (matches CleanBeam)
        const pickH = th + bodyH + 0.1;
        return (
          <group key={p.id} position={[p.x, topW - th / 2, p.z ?? 0]} rotation={[0, p.ry ?? 0, 0]}>
            <mesh position={[0, -bodyH / 2, cz]} onPointerOver={() => { hoverOn(); setHoverId(p.id); }} onPointerOut={() => { hoverOff(); setHoverId((h) => (h === p.id ? null : h)); }}
              onPointerDown={(e) => { if (orbit) return; e.stopPropagation(); onPlatDown(p.id, e.point.y, e); }}>
              <boxGeometry args={[p.w, pickH, d]} />
              <meshBasicMaterial transparent opacity={guides?.ids.includes(p.id) ? 0.34 : sel ? 0.26 : hoverId === p.id ? 0.14 : bad ? 0.16 : anySel ? 0.4 : 0.001} color={guides?.ids.includes(p.id) ? "#2fe08a" : sel ? "#37ff9a" : hoverId === p.id ? "#ffffff" : bad ? "#ff5a6a" : anySel ? "#060a12" : "#ffffff"} depthWrite={false} />
            </mesh>
            {/* TEAM-SPAWN FLAG — blue = your team, red = enemy. Non-pickable (raycast off) so it never blocks selecting
                the platform. Marks where the match spawns players/bots (doc.spawns[0]=blue, [1]=red). */}
            {(doc.spawns?.[0] === p.id || doc.spawns?.[1] === p.id) && (() => {
              const col = doc.spawns?.[0] === p.id ? "#5fd0ff" : "#ff6b6b";
              return (
                <group position={[0, th / 2 + 1.05, 0.2]}>
                  <mesh raycast={() => null}><sphereGeometry args={[0.34, 16, 12]} /><meshBasicMaterial color={col} toneMapped={false} /></mesh>
                  <mesh raycast={() => null} position={[0, -0.72, 0]}><cylinderGeometry args={[0.035, 0.035, 1.45, 6]} /><meshBasicMaterial color={col} toneMapped={false} /></mesh>
                </group>
              );
            })()}
          </group>
        );
      })}
      {/* HANDLES on the single selected platform: green = drag an EDGE to widen (X), blue = drag the BACK to extrude
          DEPTH (Z, use ◨ глубина view). */}
      {(() => {
        if (orbit || selection.length !== 1 || selection[0].includes(":")) return null;
        const p = doc.plats.find((x) => x.id === selection[0]); if (!p) return null;
        const th = THICK[p.kind ?? "mid"] ?? 0.8, cy = worldTop(p.y) - th / 2;
        const backZ = (p.z ?? 0) + 1 - (p.depth ?? 2);           // world Z of the back face
        return (<>
          {(["L", "R"] as const).map((side) => (
            <mesh key={"rz" + side} position={[side === "L" ? edges(p).L : edges(p).R, cy, 1.55]}
              onPointerOver={() => { if (!orbit && !drag) cur("ew-resize"); }} onPointerOut={hoverOff}
              onPointerDown={(e) => { e.stopPropagation(); onResizeDown(p, side, e); }}>
              <boxGeometry args={[0.5, Math.max(1.4, th + 1.0), 2.7]} />
              <meshBasicMaterial transparent opacity={0.55} color="#37ff9a" depthWrite={false} />
            </mesh>
          ))}
          {/* DEPTH handle - sits on the back edge; drag it away from the camera to pull the block into Z */}
          <mesh position={[p.x, worldTop(p.y) + 0.12, backZ]}
            onPointerOver={() => { if (!orbit && !drag) cur("grab"); }} onPointerOut={hoverOff}
            onPointerDown={(e) => { e.stopPropagation(); onDepthDown(p, e); }}>
            <boxGeometry args={[Math.min(p.w, 3), 0.4, 0.6]} />
            <meshBasicMaterial transparent opacity={0.75} color="#4aa3ff" depthWrite={false} />
          </mesh>
        </>);
      })()}
      {/* RAMP overlays - clickable to select/delete the junction (like platforms) */}
      {doc.links.filter((l) => l.kind === "ramp").map((l) => {
        const a = doc.plats.find((p) => p.id === l.a), b = doc.plats.find((p) => p.id === l.b); if (!a || !b) return null;
        const g = rampGeom(a, b); const fx = g.from[0], fy = worldTop(g.from[1]), tx = g.to[0], ty = worldTop(g.to[1]);
        const id = `ramp:${l.a}-${l.b}`, len = Math.hypot(tx - fx, ty - fy), ang = Math.atan2(ty - fy, tx - fx), seld = selection.includes(id);
        return (
          <mesh key={id} position={[(fx + tx) / 2, (fy + ty) / 2, 1.3]} rotation={[0, 0, ang]} onPointerOver={hoverOn} onPointerOut={hoverOff}
            onPointerDown={(e) => { if (orbit || gizmoBusy.active || store.getState().tool !== "select") return; e.stopPropagation(); e.shiftKey ? store.toggleSelection(id) : store.setSelection(id); }}>
            <boxGeometry args={[len, 0.95, 2.0]} />
            <meshBasicMaterial transparent opacity={seld ? 0.28 : 0.001} color={seld ? "#f0a63a" : "#ffffff"} depthWrite={false} />
          </mesh>
        );
      })}
      {/* LADDER overlays */}
      {genLadderZones([], { plats: doc.plats, links: doc.links }).map((L) => {
        const id = L.id, h = L.yt - L.yb, seld = selection.includes(id);
        return (
          <mesh key={id} position={[L.x, (L.yb + L.yt) / 2, 1.3]} onPointerOver={hoverOn} onPointerOut={hoverOff}
            onPointerDown={(e) => { if (orbit) return; e.stopPropagation(); onLadderDown(L, e); }}>
            <boxGeometry args={[1.0, h, 1.8]} />
            <meshBasicMaterial transparent opacity={seld ? 0.28 : 0.001} color={seld ? "#7ee7ff" : "#ffffff"} depthWrite={false} />
          </mesh>
        );
      })}
      {/* SUPPORT (pillar) overlays - click to select the column, then hide/return it. Only visible (not-hidden) ones. */}
      {doc.plats.flatMap((p) => {
        if (p.kind === "bridge") return [];
        const id = `sup:${p.id}`; if (doc.hidden.includes(id)) return [];
        const th = THICK[p.kind ?? "mid"] ?? 0.8; const top = worldTop(p.y) - th, floor = p.kind === "island" ? worldTop(0) : -8;
        const sw = p.kind === "high" ? 5 : p.kind === "ground" ? 6 : Math.min(p.w * 0.5, 2.6);
        const xs = p.kind === "ground" ? [-13, 0, 13] : [p.x]; const cy = (top + floor) / 2, hh = top - floor, seld = selection.includes(id);
        return xs.map((sx, i) => (
          <mesh key={id + i} position={[sx, cy, -0.7]} onPointerOver={hoverOn} onPointerOut={hoverOff}
            onPointerDown={(e) => { if (orbit || gizmoBusy.active || store.getState().tool !== "select") return; e.stopPropagation(); e.shiftKey ? store.toggleSelection(id) : store.setSelection(id); }}>
            <boxGeometry args={[sw, hh, 1.5]} />
            <meshBasicMaterial transparent opacity={seld ? 0.3 : 0.001} color={seld ? "#7aa0d8" : "#ffffff"} depthWrite={false} />
          </mesh>
        ));
      })}
      {drag && (drag.kind === "depthz" || drag.kind === "platxz" || drag.kind === "decorxz") && drag.depthz ? (
        /* DEPTH extrude / free X-Z move read world Z → capture on a HORIZONTAL plane at the object top */
        <mesh position={[0, drag.depthz.topY, -8]} rotation={[-Math.PI / 2, 0, 0]} onPointerMove={drag.kind === "depthz" ? onDepthMove : drag.kind === "platxz" ? onPlatXZMove : onDecorXZMove} onPointerUp={() => { setDrag(null); setGuides(null); cur(base()); }} onPointerLeave={() => { setDrag(null); setGuides(null); cur(base()); }}>
          <planeGeometry args={[600, 600]} /><meshBasicMaterial visible={false} />
        </mesh>
      ) : drag && (
        <mesh position={[0, 0, 1.35]} onPointerMove={onGroupMove} onPointerUp={() => { setDrag(null); setGuides(null); cur(base()); }} onPointerLeave={() => { setDrag(null); setGuides(null); cur(base()); }}>
          <planeGeometry args={[600, 600]} /><meshBasicMaterial visible={false} />
        </mesh>
      )}
      {/* marquee rectangle */}
      {marquee && (mX - mx > 0.05 || mY - my > 0.05) && (
        <mesh position={[(mx + mX) / 2, (my + mY) / 2, 1.6]}>
          <planeGeometry args={[mX - mx, mY - my]} />
          <meshBasicMaterial color="#37ff9a" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      )}
      {/* SMART-SNAP guides - green lines where the dragged block lines up with a neighbour (edge / centre / level) */}
      {guides && guides.vx.map((x, i) => (
        <mesh key={"gv" + i} position={[x, 4, 1.7]}><boxGeometry args={[0.07, 80, 0.02]} /><meshBasicMaterial color="#2fe08a" transparent opacity={0.95} depthWrite={false} toneMapped={false} /></mesh>
      ))}
      {guides && guides.hy.map((y, i) => (
        <mesh key={"gh" + i} position={[0, y, 1.7]}><boxGeometry args={[160, 0.07, 0.02]} /><meshBasicMaterial color="#2fe08a" transparent opacity={0.95} depthWrite={false} toneMapped={false} /></mesh>
      ))}
    </>
  );
}

// clicking a platform while a link tool is active builds a ramp/ladder between the two picked platforms.
function handleLinkClick(id: string) {
  const s = store.getState();
  if (s.tool !== "add-ramp" && s.tool !== "add-ladder") return;
  if (!s.linkFrom) { store.setLinkFrom(id); return; }
  if (s.linkFrom === id) { store.setLinkFrom(null); return; }
  const kind = s.tool === "add-ramp" ? "ramp" : "ladder";
  const a = s.linkFrom, b = id;
  store.commit((d) => { if (!d.links.some((l) => l.a === a && l.b === b)) d.links.push({ a, b, kind }); });
  store.setTool("select");
}

// numbered/clickable badge on every object (select on click; shift = add/remove).
function BlockBadges({ objs, selection }: { objs: LevelObj[]; selection: string[] }) {
  return (<>{objs.map((o) => (
    <Html key={o.id} position={[o.x, o.y, 1.4]} center zIndexRange={[20, 0]}>
      <div onPointerDown={(e) => { e.stopPropagation(); if (store.getState().tool !== "select") handleLinkClick(o.id); else if (e.shiftKey) store.toggleSelection(o.id); else store.setSelection(o.id); }}
        style={{ cursor: "pointer", fontFamily: font, fontSize: 10.5, fontWeight: 500, color: "#0a1020", background: KIND_COL[o.kind], border: selection.includes(o.id) ? "2px solid #37ff9a" : "1px solid #0006", borderRadius: 5, padding: "0px 5px", whiteSpace: "nowrap" }}>{o.label}</div>
    </Html>
  ))}</>);
}

// MEASURE / integrity overlay: heights on every platform + (for the selected one) the jump math to nearby platforms -
// horizontal gap, height Δ, and ✓/✗ whether the player can jump it (validated for the slowest role). "где пройдёт".
function tag(txt: string, color: string) {
  return <div style={{ fontFamily: T.mono, fontSize: 10.5, fontWeight: 700, color: "#0a1020", background: color, borderRadius: 4, padding: "0 4px", whiteSpace: "nowrap" }}>{txt}</div>;
}
// straight measuring line between two world points.
function DimLine({ a, b, color }: { a: [number, number, number]; b: [number, number, number]; color: string }) {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b)), 1, 0.045, 5, false), [a, b]);
  return <mesh geometry={geo}><meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.85} /></mesh>;
}
function MeasureOverlay({ doc, selection }: { doc: LevelDoc; selection: string[] }) {
  const selPlats = selection.map((id) => doc.plats.find((p) => p.id === id)).filter(Boolean) as Plat[];
  const from = selPlats[selPlats.length - 1];
  // explicit distance/height between the FIRST and LAST selected objects (select two blocks → exact numbers).
  const pair = selPlats.length >= 2 ? [selPlats[0], selPlats[selPlats.length - 1]] as const : null;
  return (
    <>
      {/* heights on every platform */}
      {doc.plats.map((p) => (
        <Html key={p.id} position={[edges(p).R - 0.1, worldTop(p.y) + 0.15, 0.9]} center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
          {tag(`▲${p.y.toFixed(1)}`, T.accent2)}
        </Html>
      ))}
      {/* two selected → precise dimension line: horizontal gap · Δ height · straight distance */}
      {pair && (() => {
        const [a, b] = pair; const ay = worldTop(a.y), by = worldTop(b.y);
        const gap = jumpGap(a, b), dy = b.y - a.y, dist = Math.hypot(b.x - a.x, by - ay);
        return (<group>
          <DimLine a={[a.x, ay, 1.5]} b={[b.x, by, 1.5]} color={T.accent} />
          <Html position={[(a.x + b.x) / 2, (ay + by) / 2 + 0.5, 1.6]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
            {tag(`⇿${gap.toFixed(1)}м  ↕${dy >= 0 ? "+" : ""}${dy.toFixed(1)}м  ⤢${dist.toFixed(1)}м`, T.accent)}
          </Html>
        </group>);
      })()}
      {/* single selected → jump math to nearby platforms (пройдёт ли прыжок) */}
      {from && !pair && doc.plats.filter((t) => t.id !== from.id && Math.abs(t.x - from.x) < 16 && Math.abs(t.y - from.y) <= 3).map((t) => {
        const gap = jumpGap(from, t), dy = t.y - from.y, ok = canJump(from, t);
        const mx = (from.x + t.x) / 2, my = (worldTop(from.y) + worldTop(t.y)) / 2 + 0.6;
        return (
          <Html key={"m" + t.id} position={[mx, my, 1.5]} center zIndexRange={[25, 0]} style={{ pointerEvents: "none" }}>
            {tag(`${gap.toFixed(1)}м ${dy >= 0 ? "↑" : "↓"}${Math.abs(dy).toFixed(1)} ${ok ? "✓" : "✗"}`, ok ? "#37ff9a" : "#ff6b7a")}
          </Html>
        );
      })}
    </>
  );
}

// a curved arc between the near edges of two platforms - green = passable jump, red = the player CANNOT cross here.
function ReachArc({ a, b, color }: { a: Plat; b: Plat; color: string }) {
  const geo = useMemo(() => {
    const ea = edges(a), eb = edges(b);
    const ax = Math.abs(ea.R - eb.L) < Math.abs(ea.L - eb.R) ? ea.R : ea.L;
    const bx = Math.abs(eb.L - ea.R) < Math.abs(eb.R - ea.L) ? eb.L : eb.R;
    const p0 = new THREE.Vector3(ax, worldTop(a.y) + 0.12, 1.55);
    const p1 = new THREE.Vector3(bx, worldTop(b.y) + 0.12, 1.55);
    const mid = new THREE.Vector3((ax + bx) / 2, Math.max(worldTop(a.y), worldTop(b.y)) + 1.5, 1.55);
    return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0, mid, p1), 22, 0.06, 6, false);
  }, [a, b]);
  return <mesh geometry={geo}><meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.92} /></mesh>;
}
// TRAVERSABILITY viz ("проверка"): every platform tinted green (reachable from a spawn) or red (stranded); a glowing
// probe RUNS the reachable platforms so you can watch it sweep the level; red arcs + "✗" mark the exact gaps the
// player cannot cross (the frontier into a stranded zone).
function ReachViz({ doc, verdict }: { doc: LevelDoc; verdict: Verdict }) {
  const dot = useRef<THREE.Mesh>(null);
  const route = useMemo(() => doc.plats.filter((p) => verdict.reachable.has(p.id)).map((p) => ({ x: p.x, y: worldTop(p.y) })).sort((a, b) => a.x - b.x), [doc, verdict]);
  // fail arcs = near pairs that DON'T jump, on the frontier (one side reachable, other stranded) → "you can't get there".
  const fails = useMemo(() => {
    const seen = new Set<string>(); const out: [Plat, Plat][] = [];
    for (const j of verdict.jumps) {
      if (j.ok) continue;
      if (verdict.reachable.has(j.from) === verdict.reachable.has(j.to)) continue; // only the reachable→stranded frontier
      const k = [j.from, j.to].sort().join("|"); if (seen.has(k)) continue; seen.add(k);
      const a = doc.plats.find((p) => p.id === j.from), b = doc.plats.find((p) => p.id === j.to); if (a && b) out.push([a, b]);
    }
    return out;
  }, [doc, verdict]);
  useFrame(({ clock }) => {
    const d = dot.current; if (!d) return; const n = route.length;
    if (n === 0) { d.visible = false; return; } d.visible = true;
    if (n === 1) { d.position.set(route[0].x, route[0].y + 0.6, 1.6); return; }
    const SEG = 0.7, t = (clock.getElapsedTime() % (SEG * (n - 1))) / SEG, i = Math.min(n - 2, Math.floor(t)), f = t - i;
    const a = route[i], b = route[i + 1], hop = Math.sin(f * Math.PI) * 0.7;
    d.position.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f + hop + 0.6, 1.6);
  });
  return (
    <>
      {doc.plats.filter((p) => !p.z).map((p) => { const r = verdict.reachable.has(p.id); const th = THICK[p.kind ?? "mid"] ?? 0.8; return (
        <mesh key={p.id} position={[p.x, worldTop(p.y) - th / 2, 1.3]}><boxGeometry args={[p.w, th + 0.14, 2.42]} /><meshBasicMaterial transparent opacity={0.22} color={r ? "#2fe08a" : "#ff4d5f"} depthWrite={false} /></mesh>
      ); })}
      {fails.map(([a, b], i) => <ReachArc key={i} a={a} b={b} color="#ff4d5f" />)}
      {fails.map(([a, b], i) => <Html key={"x" + i} position={[(a.x + b.x) / 2, Math.max(worldTop(a.y), worldTop(b.y)) + 1.6, 1.6]} center style={{ pointerEvents: "none" }}>{tag(t("✗ не пройти"), "#ff4d5f")}</Html>)}
      <mesh ref={dot}><sphereGeometry args={[0.24, 16, 16]} /><meshBasicMaterial color="#eafff4" toneMapped={false} /><pointLight color="#7fffd0" intensity={2} distance={3.5} /></mesh>
    </>
  );
}
// the PLAYTEST spawn marker (green flag) - now DRAGGABLE: grab it and move it anywhere; the point is persisted to
// pb_spawn (+ studio-spawn event so #playbox and the editor stay in sync). Snap to the 0.5m grid like everything else.
function saveSpawn(x: number, y: number) {
  try { localStorage.setItem("pb_spawn", JSON.stringify([x, y])); localStorage.removeItem("pb_spawnRandom"); } catch { /* ignore */ }
  window.dispatchEvent(new Event("studio-spawn"));
}
function SpawnGizmo({ pos, orbit }: { pos: [number, number]; orbit: boolean }) {
  const [drag, setDrag] = useState(false);
  const gl = useThree((s) => s.gl);
  const down = (e: any) => { if (orbit) return; e.stopPropagation(); setDrag(true); e.target?.setPointerCapture?.(e.pointerId); gl.domElement.style.cursor = "grabbing"; };
  const move = (e: any) => { if (!drag) return; saveSpawn(snap(e.point.x), snap(e.point.y)); };
  const end = () => { if (!drag) return; setDrag(false); gl.domElement.style.cursor = orbit ? "grab" : "default"; };
  return (
    <>
      <group position={[pos[0], pos[1] + 0.5, 1.4]}>
        <mesh><sphereGeometry args={[0.32, 16, 12]} /><meshBasicMaterial color="#37ff9a" toneMapped={false} /></mesh>
        <mesh position={[0, -0.55, 0]}><cylinderGeometry args={[0.03, 0.03, 1.1, 6]} /><meshBasicMaterial color="#37ff9a" toneMapped={false} /></mesh>
        {/* grab handle (a bit bigger than the visible sphere so it's easy to catch) */}
        <mesh onPointerDown={down} onPointerOver={() => { if (!orbit && !drag) gl.domElement.style.cursor = "grab"; }} onPointerOut={() => { if (!drag) gl.domElement.style.cursor = orbit ? "grab" : "default"; }}>
          <sphereGeometry args={[0.5, 12, 10]} /><meshBasicMaterial transparent opacity={drag ? 0.25 : 0.001} color="#37ff9a" depthWrite={false} />
        </mesh>
      </group>
      {drag && <mesh position={[0, 0, 2]} onPointerMove={move} onPointerUp={end} onPointerLeave={end}><planeGeometry args={[600, 600]} /><meshBasicMaterial visible={false} /></mesh>}
    </>
  );
}
// ── BOT ROUTE overlay (route mode): draws the nav GRAPH derived from the level - walkable surfaces (green spans),
// portals (ramp cyan / ladder violet), and the editable ROAM NODES (spheres, coloured by tag) a searching bot picks
// at random. Nodes are draggable and snap to the nearest surface so they stay valid. Editing writes doc.waypoints.
const WP_COL: Record<string, string> = { cover: "#ffb400", centre: "#7ee7ff", edge: "#9fb4d0", perch: "#c084ff" };
// nearest walkable surface (stand-centre Y + clamped X) for a dragged point → keeps every node ON a surface.
function snapToSurface(nav: ReturnType<typeof genNav>, x: number, y: number) {
  let best = nav.surfaces[0], bd = Infinity;
  for (const s of nav.surfaces) {
    const inSpan = x >= s.x0 - 0.6 && x <= s.x1 + 0.6;
    const d = Math.abs(s.y - y) + (inSpan ? 0 : 6);
    if (d < bd) { bd = d; best = s; }
  }
  return best ? { x: Math.max(best.x0 + 0.4, Math.min(best.x1 - 0.4, x)), y: best.y } : { x, y };
}
function RouteOverlay({ doc, orbit, selNode, setSelNode }: { doc: LevelDoc; orbit: boolean; selNode: string | null; setSelNode: (id: string | null) => void }) {
  const gl = useThree((s) => s.gl);
  const nav = useMemo(() => genNav(doc), [doc]);
  const nodes = doc.waypoints ?? [];
  const [dragId, setDragId] = useState<string | null>(null);
  const topOf = (id: string) => (nav.byId?.[id]?.y ?? 0) - STAND; // surface top = stand centre − STAND offset
  const down = (id: string) => (e: any) => { if (orbit) return; e.stopPropagation(); setSelNode(id); setDragId(id); store.beginHistory(); e.target?.setPointerCapture?.(e.pointerId); gl.domElement.style.cursor = "grabbing"; };
  const move = (e: any) => { if (!dragId) return; const p = snapToSurface(nav, snap(e.point.x), e.point.y); store.mutate((d) => { const w = d.waypoints?.find((n) => n.id === dragId); if (w) { w.x = +p.x.toFixed(2); w.y = +p.y.toFixed(2); } }); };
  const end = () => { if (!dragId) return; setDragId(null); gl.domElement.style.cursor = orbit ? "grab" : "default"; };
  return (
    <>
      {/* walkable surfaces */}
      {nav.surfaces.map((s) => (
        <mesh key={"s" + s.id} position={[(s.x0 + s.x1) / 2, s.y - STAND + 0.03, 1.42]}>
          <boxGeometry args={[Math.max(0.2, s.x1 - s.x0), 0.06, 0.06]} /><meshBasicMaterial color="#2fe08a" toneMapped={false} transparent opacity={0.8} depthWrite={false} />
        </mesh>
      ))}
      {/* portals (ramp/ladder) as connector bars */}
      {nav.portals.map((p, i) => {
        const ay = topOf(p.a), by = topOf(p.b); const mx = (p.ax + p.bx) / 2, my = (ay + by) / 2;
        const len = Math.hypot(p.bx - p.ax, by - ay) || 0.2, ang = Math.atan2(by - ay, p.bx - p.ax);
        return <mesh key={"p" + i} position={[mx, my + 0.2, 1.4]} rotation={[0, 0, ang]}><boxGeometry args={[len, 0.05, 0.05]} /><meshBasicMaterial color={p.kind === "ladder" ? "#c084ff" : "#39d6ff"} toneMapped={false} transparent opacity={0.7} depthWrite={false} /></mesh>;
      })}
      {/* roam nodes - draggable, snap to nearest surface */}
      {nodes.map((w) => {
        const on = selNode === w.id, col = WP_COL[w.tag] ?? "#7ee7ff";
        return (
          <group key={w.id} position={[w.x, w.y, 1.5]}>
            <mesh onPointerDown={down(w.id)} onPointerOver={() => { if (!orbit && !dragId) gl.domElement.style.cursor = "grab"; }} onPointerOut={() => { if (!dragId) gl.domElement.style.cursor = orbit ? "grab" : "default"; }}>
              <sphereGeometry args={[on ? 0.34 : 0.26, 14, 12]} /><meshBasicMaterial color={col} toneMapped={false} transparent opacity={on ? 1 : 0.82} />
            </mesh>
            {on && <mesh><ringGeometry args={[0.42, 0.5, 20]} /><meshBasicMaterial color="#ffffff" toneMapped={false} transparent opacity={0.9} depthWrite={false} /></mesh>}
          </group>
        );
      })}
      {dragId && <mesh position={[0, 0, 2]} onPointerMove={move} onPointerUp={end} onPointerLeave={end}><planeGeometry args={[600, 600]} /><meshBasicMaterial visible={false} /></mesh>}
    </>
  );
}
// route editor CONTROLS (floating panel): auto-build nodes from the geometry, add / delete / retag / clear. Nodes
// live in doc.waypoints (saved with the level, undo-able). Bots pick them at RANDOM while searching (genNav → bots).
const WP_TAGS: { id: "cover" | "centre" | "edge" | "perch"; label: string }[] = [
  { id: "cover", label: "укрытие" }, { id: "centre", label: "центр" }, { id: "edge", label: "фланг" }, { id: "perch", label: "высота" },
];
function RoutePanel({ doc, selNode, setSelNode, onClose }: { doc: LevelDoc; selNode: string | null; setSelNode: (id: string | null) => void; onClose: () => void }) {
  const nodes = doc.waypoints ?? [];
  const sel = nodes.find((n) => n.id === selNode) || null;
  const build = () => store.commit((d) => { d.waypoints = autoWaypoints(d); });
  const clear = () => { if (confirm(t("Удалить все узлы маршрута?"))) { store.commit((d) => { d.waypoints = []; }); setSelNode(null); } };
  const addNode = () => {
    const id = "wp_" + Math.random().toString(36).slice(2, 6);
    store.commit((d) => { const s = genNav(d).surfaces[0]; (d.waypoints ||= []).push({ id, x: s ? +((s.x0 + s.x1) / 2).toFixed(2) : 0, y: s ? +s.y.toFixed(2) : worldTop(0) + STAND, tag: "centre" }); });
    setSelNode(id);
  };
  const delNode = () => { if (!selNode) return; store.commit((d) => { d.waypoints = (d.waypoints ?? []).filter((n) => n.id !== selNode); }); setSelNode(null); };
  const retag = (tag: "cover" | "centre" | "edge" | "perch") => { if (!selNode) return; store.commit((d) => { const w = d.waypoints?.find((n) => n.id === selNode); if (w) w.tag = tag; }); };
  const chip = (col: string, lbl: string) => <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: T.dim }}><span style={{ width: 8, height: 8, borderRadius: 8, background: col }} />{lbl}</span>;
  return (
    <div style={{ position: "absolute", left: 12, bottom: 12, width: 232, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7, fontFamily: T.ui }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b style={{ fontSize: 12, color: T.accent, letterSpacing: ".03em" }}>{t("МАРШРУТ БОТОВ")}</b>
        <button onClick={onClose} style={{ ...btn(), padding: "2px 7px" }}>✕</button>
      </div>
      <div style={{ fontSize: 10.5, color: T.dim, lineHeight: 1.4 }}>{t("Узлы патруля - бот бродит по ним")} <b style={{ color: T.ink }}>{t("случайно")}</b> {t("(не по кругу). Точки тащатся мышью и липнут к поверхности.")}</div>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={{ ...btn(false, "primary"), flex: 1 }} onClick={build} title={t("перестроить узлы по геометрии уровня")}>{t("⟳ авто-построить")}</button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={{ ...btn(), flex: 1 }} onClick={addNode}>{t("＋ узел")}</button>
        <button style={{ ...btn(), flex: 1, opacity: sel ? 1 : 0.4 }} disabled={!sel} onClick={delNode}>{t("удалить")}</button>
        <button style={{ ...btn(false, "danger") }} onClick={clear} title={t("очистить все узлы")}>✕</button>
      </div>
      {sel && (
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 6, display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ fontSize: 10, color: T.faint }}>{t("узел")} {sel.id} · x {sel.x} · y {sel.y}</div>
          <div style={{ display: "flex", gap: 4 }}>
            {WP_TAGS.map((wt) => <button key={wt.id} onClick={() => retag(wt.id)} style={{ ...btn(sel.tag === wt.id), flex: 1, padding: "4px 2px", fontSize: 10 }}>{t(wt.label)}</button>)}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
        {chip("#ffb400", t("укрытие"))}{chip("#7ee7ff", t("центр"))}{chip("#9fb4d0", t("фланг"))}{chip("#c084ff", t("высота"))}
      </div>
      <div style={{ fontSize: 10, color: T.faint }}>{t("узлов:")} {nodes.length}{nodes.length === 0 && t(" - нажми «авто-построить»")}</div>
    </div>
  );
}
// ── VIEWPORT NAVIGATION ─────────────────────────────────────────────────────────────────────────────────────
// Unity-style scheme, reliable (imperative mouseButtons on the OrbitControls ref → NO React-state lag):
//   LEFT      = select / move / marquee (free unless a nav modifier is held)
//   Alt/Ctrl+LEFT = orbit · Space+LEFT = pan · MIDDLE = orbit · RIGHT = pan · WHEEL = zoom-to-cursor
// Holding a nav modifier also flips `orbitActive` so the pick overlays step aside while you fly.
function ViewportControls({ orbitLock, setOrbitActive }: { orbitLock: boolean; setOrbitActive: (v: boolean) => void }) {
  const ref = useRef<any>(null);
  const held = useRef({ nav: false, space: false });
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const apply = () => {
      const h = held.current;
      const rotate = h.nav || orbitLock;   // orbit with LEFT
      const pan = h.space;                  // pan with LEFT
      c.mouseButtons = {
        LEFT: pan ? THREE.MOUSE.PAN : rotate ? THREE.MOUSE.ROTATE : null,
        MIDDLE: THREE.MOUSE.ROTATE,
        RIGHT: THREE.MOUSE.PAN,
      };
      setOrbitActive(rotate || pan);
    };
    apply();
    const isField = () => { const t = (document.activeElement?.tagName || "").toLowerCase(); return t === "input" || t === "select" || t === "textarea" || t === "button"; };
    const dn = (e: KeyboardEvent) => {
      if (isField()) return; let ch = false;
      if ((e.key === "Alt" || e.key === "Control" || e.altKey || e.ctrlKey) && !held.current.nav) { held.current.nav = true; ch = true; }
      if (e.code === "Space" && !held.current.space) { held.current.space = true; ch = true; e.preventDefault(); }
      if (ch) apply();
    };
    const up = (e: KeyboardEvent) => {
      let ch = false;
      if ((e.key === "Alt" || e.key === "Control") && !e.altKey && !e.ctrlKey && held.current.nav) { held.current.nav = false; ch = true; }
      if (e.code === "Space" && held.current.space) { held.current.space = false; ch = true; }
      if (ch) apply();
    };
    const blur = () => { held.current.nav = false; held.current.space = false; apply(); };
    const noCtx = (e: MouseEvent) => { if (e.altKey || e.ctrlKey) e.preventDefault(); };
    window.addEventListener("keydown", dn); window.addEventListener("keyup", up);
    window.addEventListener("blur", blur); window.addEventListener("contextmenu", noCtx);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); window.removeEventListener("contextmenu", noCtx); };
  }, [orbitLock, setOrbitActive]);
  return (
    <OrbitControls ref={ref} makeDefault enablePan enableRotate enableDamping dampingFactor={0.12}
      zoomToCursor zoomSpeed={1.5} minZoom={4} maxZoom={260}
      minPolarAngle={Math.PI * 0.12} maxPolarAngle={Math.PI * 0.88} target={[0, 2, 0]} />
  );
}

// ── 360° TRANSFORM GIZMO (Blender/TankLab-style) ────────────────────────────────────────────────────────────
// When exactly ONE object is selected, attach a drei TransformControls gizmo to an invisible PROXY placed at that
// object's world transform (rings=rotate, arrows=move, boxes=scale). On drag we write the proxy's transform back to
// the doc fields (delta on translate, absolute yaw on rotate, multiply w/depth/scale on scale). This gives the
// "grab it and spin/resize in 360" feel without needing refs into the data-driven CosmosArena render.
export type GizmoMode = "translate" | "rotate" | "scale";
type GTarget =
  | { kind: "plat"; id: string; cx: number; cy: number; cz: number; rx: number; ry: number; rz: number }
  | { kind: "decor"; id: string; cx: number; cy: number; cz: number; rx: number; ry: number; rz: number };

// The gizmo must sit at the object's VISUAL CENTRE (not its data anchor), so it lands dead-centre on the block/crate/
// model - mirrors the pick-box centring: platforms account for facade body (bh) + depth extrusion (cz), decor uses
// the same per-type centre as the pick-box (crates/barrels grow up from y, models ~mid, cables hang down).
function resolveGizmoTarget(doc: LevelDoc, selection: string[]): GTarget | null {
  if (selection.length !== 1) return null;
  const sel = selection[0];
  if (sel.startsWith("decor:")) {
    const dd = doc.decor.find((x) => x.id === sel.slice(6)) as any;
    if (!dd) return null;
    const r = dd.r ?? (dd.type === "barrel" ? 0.48 : 0.18);
    const isBump = dd.type === "crate" || dd.type === "barrel";
    const isModel = dd.type === "model";
    const sc = isBump && !dd.solid ? 0.72 : 1;
    const mS = dd.scale ?? 1;
    const bh = (isModel ? Math.max(dd.h, mS * 1.8) : (dd.type === "pipe" ? (dd.dir === "v" ? dd.w : Math.max(0.7, r * 3)) : dd.type === "cable" ? (dd.len ?? 1.8) : dd.type === "barrel" ? (dd.h ?? 1.1) : dd.type === "crate" ? dd.w : dd.h)) * sc;
    const cy = isModel ? dd.y + bh * 0.35 : isBump ? dd.y + bh / 2 : dd.type === "cable" ? dd.y - bh / 2 : dd.y;
    return { kind: "decor", id: dd.id, cx: dd.x, cy, cz: dd.z, rx: 0, ry: dd.ry ?? 0, rz: 0 };
  }
  // a support pillar (sup:platId) → gizmo the PLATFORM it belongs to (so clicking the column still works)
  const platId = sel.startsWith("sup:") ? sel.slice(4) : sel;
  if (platId.includes(":")) return null; // ramps/ladders → not gizmo-editable here
  const p = doc.plats.find((x) => x.id === platId);
  if (!p) return null;
  const th = THICK[p.kind ?? "mid"] ?? 0.6;
  const d = Math.max(PICK_COL, p.depth ?? 2);
  const czLocal = PICK_COL / 2 - d / 2;             // depth centre (matches CleanBeam) so it sits mid-depth
  const ry = p.ry ?? 0, cos = Math.cos(ry), sin = Math.sin(ry);
  // gizmo on the TOP SLAB (the walkable surface - the natural handle point), centred in depth + yaw.
  return { kind: "plat", id: p.id, cx: p.x + czLocal * sin, cy: worldTop(p.y) - th / 2, cz: (p.z ?? 0) + czLocal * cos, rx: p.rx ?? 0, ry, rz: p.rz ?? 0 };
}

function GizmoLayer({ doc, selection, mode, orbit }: { doc: LevelDoc; selection: string[]; mode: GizmoMode; orbit: boolean }) {
  // a STABLE proxy object in the scene graph; TransformControls attaches to it via `object=` and follows its matrix,
  // so moving the proxy moves the gizmo. (The children-form attaches to drei's own wrapper → gizmo stuck at origin.)
  const proxy = useMemo(() => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: "#37b0ff", transparent: true, opacity: 0.85, depthTest: false })); g.add(m); return g; }, []);
  const controls = useRef<any>(null);
  const dragging = useRef(false);
  const base = useRef<{ pos: THREE.Vector3; ry: number; scale: THREE.Vector3; doc: any } | null>(null);
  const target = useMemo(() => resolveGizmoTarget(doc, selection), [doc, selection]);
  const active = (!!target || dragging.current) && !orbit; // stay mounted through a drag even if selection momentarily changes

  // keep the proxy pinned to the selected object's CENTRE - re-runs whenever the selection/doc changes (but NOT while
  // dragging, else it fights the gizmo). This is what makes the gizmo jump to each newly-selected object.
  useEffect(() => {
    if (!target || dragging.current) return;
    proxy.position.set(target.cx, target.cy, target.cz);
    proxy.rotation.set(target.rx, target.ry, target.rz);
    proxy.scale.set(1, 1, 1);
    proxy.updateMatrixWorld();
  }, [target, proxy]);

  useEffect(() => {
    const c = controls.current; if (!c || !c.addEventListener) return;
    const onDrag = (e: any) => {
      dragging.current = !!e.value;
      if (e.value) gizmoBusy.active = true;   // mark busy the INSTANT a handle is grabbed (don't wait a frame → bg can't deselect)
      if (e.value) {
        store.beginHistory();
        const t = resolveGizmoTarget(store.getState().doc, store.getState().selection);
        // snapshot ORIGINAL dims + ORIGINAL anchor so we apply deltas to the doc coords (the proxy sits at the visual
        // CENTRE, which is offset from the anchor - never write the centre back as the anchor).
        let dims: any = {}, orig: any = {};
        const st = store.getState().doc;
        if (t?.kind === "plat") { const p = st.plats.find((x) => x.id === t.id) as any; if (p) { dims = { w: p.w, depth: p.depth ?? 2 }; orig = { x: p.x, y: p.y, z: p.z ?? 0 }; } }
        else if (t?.kind === "decor") { const dd = st.decor.find((x) => x.id === t.id) as any; if (dd) { dims = { w: dd.w, h: dd.h, scale: dd.scale ?? 1, isModel: dd.type === "model" || !!dd.src }; orig = { x: dd.x, y: dd.y, z: dd.z }; } }
        base.current = { pos: proxy.position.clone(), ry: proxy.rotation.y, scale: proxy.scale.clone(), doc: { t, dims, orig } };
      }
    };
    const onChange = () => {
      if (!dragging.current || !base.current) return;
      const b = base.current, t: GTarget = b.doc.t, dims = b.doc.dims, orig = b.doc.orig; if (!t) return;
      const dx = proxy.position.x - b.pos.x, dy = proxy.position.y - b.pos.y, dz = proxy.position.z - b.pos.z;
      const sx = proxy.scale.x / b.scale.x, sy = proxy.scale.y / b.scale.y, sz = proxy.scale.z / b.scale.z;
      const clamp = (v: number, lo = 0.4) => Math.max(lo, v);
      const norm = (v: number) => (Math.abs(v) < 1e-4 ? 0 : Math.round(v * 1e4) / 1e4); // kill float dust so unused axes stay exactly 0
      store.mutate((d) => {
        if (t.kind === "plat") {
          const p = d.plats.find((x) => x.id === t.id); if (!p) return;
          // deltas apply to the ORIGINAL anchor (world Y ↔ doc y is a constant offset → dy is 1:1)
          if (mode === "translate") { p.x = orig.x + dx; p.y = orig.y + dy; p.z = orig.z + dz; }
          else if (mode === "rotate") { p.rx = norm(proxy.rotation.x); p.ry = norm(proxy.rotation.y); p.rz = norm(proxy.rotation.z); }
          else if (mode === "scale") { p.w = clamp(dims.w * sx); p.depth = clamp(dims.depth * sz, 0.5); }
        } else {
          const dd: any = d.decor.find((x) => x.id === t.id); if (!dd) return;
          if (mode === "translate") { dd.x = orig.x + dx; dd.y = orig.y + dy; dd.z = orig.z + dz; }
          else if (mode === "rotate") { dd.ry = proxy.rotation.y; }
          else if (mode === "scale") {
            if (dims.isModel) dd.scale = clamp(dims.scale * sx); // GLB model = uniform scale
            else { dd.w = clamp(dims.w * sx); dd.h = clamp(dims.h * sy); }
          }
        }
      });
    };
    c.addEventListener("dragging-changed", onDrag);
    c.addEventListener("objectChange", onChange);
    return () => { c.removeEventListener("dragging-changed", onDrag); c.removeEventListener("objectChange", onChange); dragging.current = false; };
  }, [mode, active]);

  // publish whether the gizmo is being hovered/dragged so the pick overlays yield the click to it (no fall-through)
  useFrame(() => { const c = controls.current; gizmoBusy.active = !!(c && active && (c.dragging || c.axis)); });
  useEffect(() => () => { gizmoBusy.active = false; }, []);

  if (!active) return null;
  return (
    <>
      <primitive object={proxy} />
      <TransformControls ref={controls} object={proxy} mode={mode} size={1.1} space="world" showX showY showZ />
    </>
  );
}

function StudioScene({ doc, greybox, wire, selection, unreachable, spawn, showGrid, showBg, showLabels, orbit, orbitLock, setOrbitActive, measure, check, verdict, route, selNode, setSelNode, gizmo }: { doc: LevelDoc; greybox: boolean; wire: boolean; selection: string[]; unreachable: Set<string>; spawn: [number, number] | null; showGrid: boolean; showBg: boolean; showLabels: boolean; orbit: boolean; orbitLock: boolean; setOrbitActive: (v: boolean) => void; measure: boolean; check: boolean; verdict: Verdict; route: boolean; selNode: string | null; setSelNode: (id: string | null) => void; gizmo: GizmoMode | null }) {
  const sceneDoc = showBg ? doc : { ...doc, layers: [], decor: [] };
  const objs = useMemo(() => levelObjects(layoutOf(doc)), [doc]);
  // structural signature - remount Physics only when structure/skins change, NOT on every drag (x/y are props).
  const physKey = greybox + "|" + doc.plats.map((p) => p.id + p.kind).join(",") + "|" + doc.links.map((l) => l.kind + l.a + l.b).join(",") + "|" + JSON.stringify(doc.skins) + "|" + doc.meta.style + "|" + doc.decor.length + "|" + doc.layers.map((l) => l.id).join(",");
  blockout.on = greybox;
  const tiers = useMemo(() => Array.from(new Set(doc.plats.map((p) => worldTop(p.y)))).sort((a, b) => a - b), [doc]);
  return (
    <>
      <color attach="background" args={[T.scene]} />
      <OrthographicCamera makeDefault position={[0, 3, 40]} zoom={15} near={0.1} far={200} />
      <ambientLight intensity={0.7} />
      <directionalLight intensity={0.9} position={[-3, 8, 6]} />
      <directionalLight intensity={0.4} position={[5, 3, 8]} />
      {showGrid && <ViewGrid />}
      {tiers.map((t, i) => <TierLine key={i} y={t} />)}
      <ViewCommands plats={doc.plats} />
      <Suspense fallback={null}>
        <Physics key={physKey} paused>
          <CosmosArena doc={sceneDoc} editable />
        </Physics>
        <PlatOverlays doc={doc} selection={selection} unreachable={check ? EMPTY_SET : unreachable} orbit={orbit} showBg={showBg} />
        {gizmo && <GizmoLayer doc={doc} selection={selection} mode={gizmo} orbit={orbit} />}
        {check && <ReachViz doc={doc} verdict={verdict} />}
        {showLabels && <BlockBadges objs={objs} selection={selection} />}
        {measure && <MeasureOverlay doc={doc} selection={selection} />}
        <Shading wire={wire} />
        {spawn && <SpawnGizmo pos={spawn} orbit={orbit} />}
        {route && <RouteOverlay doc={doc} orbit={orbit} selNode={selNode} setSelNode={setSelNode} />}
      </Suspense>
      {/* camera nav: Alt/Ctrl+LEFT or MIDDLE = orbit (see depth Z) · Space+LEFT or RIGHT = pan · wheel = zoom-to-cursor.
          «орбита» toggle makes LEFT orbit stickily. Damping = smooth; polar limits keep the 2.5D scene upright. */}
      <ViewportControls orbitLock={orbitLock} setOrbitActive={setOrbitActive} />
      <CameraKeys orbit={orbit} />
    </>
  );
}

// ── UI helpers ───────────────────────────────────────────────────────────────────────────────────────────────
function StyleSelect({ value, onChange, allowInherit }: { value: string; onChange: (v: string) => void; allowInherit?: boolean }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...field, width: "auto" }}>
      {allowInherit && <option value="">- как у карты -</option>}
      {STYLE_LIST.map((s) => <option key={s} value={s}>{paletteOf(s).label}</option>)}
    </select>
  );
}

function Inspector({ doc, selection }: { doc: LevelDoc; selection: string[] }) {
  if (selection.length === 0) return <div style={{ color: T.dim, fontSize: 12, lineHeight: 1.6 }}>{t("Клик по блоку/метке - выбрать.")} <b>{t("Тяни по пустому месту")}</b> {t("- рамкой выделить несколько.")} <b>{t("Shift+клик")}</b> {t("- добавить. Тяни выделенное - двигать группой.")}</div>;
  // MULTI-select → group tools (align / distribute / duplicate / delete)
  if (selection.length > 1) {
    const platIds = selection.filter((s) => doc.plats.some((p) => p.id === s));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12, color: T.ink }}>
        <div style={{ fontWeight: 500, color: T.accent }}>{t("ВЫБРАНО:")} {selection.length} {platIds.length !== selection.length && t(`(платформ: ${platIds.length})`)}</div>
        <div style={{ color: T.faint, fontSize: 11 }}>{t("ВЫРОВНЯТЬ ПО X")}</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button style={btn()} onClick={() => alignSel("left")}>{t("◀ левому")}</button>
          <button style={btn()} onClick={() => alignSel("cx")}>{t("│ центру")}</button>
          <button style={btn()} onClick={() => alignSel("right")}>{t("правому ▶")}</button>
        </div>
        <div style={{ color: T.faint, fontSize: 11 }}>{t("ВЫРОВНЯТЬ ПО ВЫСОТЕ")}</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button style={btn()} onClick={() => alignSel("top")}>{t("▲ верху")}</button>
          <button style={btn()} onClick={() => alignSel("distx")}>{t("⇿ распределить X")}</button>
        </div>
        <div style={{ color: T.faint, fontSize: 11 }}>{t("ГЛУБИНА (Z)")}</div>
        <button style={btn()} onClick={cloneToDepth} title={t("скопировать выбранные платформы НАЗАД в глубину (эхо-слой, непроходимый) - быстро набрать план как на арт-референсе")}>{t("◨ клонировать в глубину")}</button>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={btn()} onClick={duplicateSelection}>{t("⧉ дублировать")}</button>
          <button style={btn(false, "danger")} onClick={deleteSelection}>{t("удалить все")}</button>
        </div>
      </div>
    );
  }
  const sel = selection[0];
  // DECOR prop (depth beam/box)
  if (sel.startsWith("decor:")) {
    const did = sel.slice(6); const dc = doc.decor.find((x) => x.id === did);
    if (!dc) return <div style={{ color: T.dim, fontSize: 12 }}>{t("Декор удалён.")}</div>;
    const setD = (fn: (p: DecorProp) => void) => store.commit((d) => { const p = d.decor.find((x) => x.id === did); if (p) fn(p); });
    const kind = dc.type ?? "box";
    const KLABEL: Record<string, string> = { box: "ДЕКОР (фон)", crate: "ЯЩИК", barrel: "БОЧКА", pipe: "ТРУБА", cable: "КАБЕЛИ", model: "3D-МОДЕЛЬ (GLB)" };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: T.ink }}>
        <div style={{ fontWeight: 500, color: "#c084ff" }}>{t(KLABEL[kind])} · {did}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          x<input type="number" step={0.5} value={dc.x} onChange={(e) => setD((p) => (p.x = +e.target.value))} style={{ ...field, width: 44 }} />
          y<input type="number" step={0.5} value={dc.y} onChange={(e) => setD((p) => (p.y = +e.target.value))} style={{ ...field, width: 44 }} />
          <span title={t("глубина - тяни вглубь/ближе")}>z</span>
          <button style={{ ...btn(), padding: "3px 7px" }} onClick={() => setD((p) => (p.z = +(p.z + 0.5).toFixed(2)))} title={t("ближе")}>＋</button>
          <input type="number" step={0.5} value={dc.z} onChange={(e) => setD((p) => (p.z = +e.target.value))} style={{ ...field, width: 44 }} />
          <button style={{ ...btn(), padding: "3px 7px" }} onClick={() => setD((p) => (p.z = +(p.z - 0.5).toFixed(2)))} title={t("глубже")}>－</button>
        </div>
        {/* depth slider - push ANY prop (crate/barrel included) back into Z; z < 0 = scenery (no collider) */}
        <input type="range" min={-24} max={2} step={0.5} value={dc.z} onChange={(e) => setD((p) => (p.z = +e.target.value))} style={{ width: "100%", accentColor: "#c084ff" }} />
        <div style={{ fontSize: 10, color: T.faint, marginTop: -4 }}>{dc.z < -0.5 ? t("в глубине - фон, игрок не цепляется") : t("на игровой плоскости")}</div>
        {/* per-TYPE params */}
        {(kind === "crate" || kind === "box") && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {t("размер")}<input type="number" step={0.5} value={dc.w} onChange={(e) => setD((p) => (p.w = Math.max(0.4, +e.target.value)))} style={{ ...field, width: 50 }} />
            {kind === "box" && <>{t("в")}<input type="number" step={0.5} value={dc.h} onChange={(e) => setD((p) => (p.h = Math.max(0.4, +e.target.value)))} style={{ ...field, width: 50 }} /></>}
          </div>
        )}
        {kind === "barrel" && (<>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {t("радиус")}<input type="number" step={0.05} value={dc.r ?? 0.48} onChange={(e) => setD((p) => (p.r = Math.max(0.2, +e.target.value)))} style={{ ...field, width: 50 }} />
            {t("высота")}<input type="number" step={0.1} value={dc.h} onChange={(e) => setD((p) => (p.h = Math.max(0.4, +e.target.value)))} style={{ ...field, width: 50 }} />
          </div>
          {/* barrel TYPE - plain cover, explosive (frag blast when shot), or cryo (freeze blast) */}
          <div style={{ display: "flex", gap: 5 }}>
            {([["обычная", { explosive: undefined, cryo: undefined }], ["взрыв", { explosive: true, cryo: undefined }], ["крио", { explosive: undefined, cryo: true }]] as const).map(([lbl, set]) => {
              const on = (lbl === "взрыв" && dc.explosive) || (lbl === "крио" && dc.cryo) || (lbl === "обычная" && !dc.explosive && !dc.cryo);
              return <button key={lbl} style={{ ...btn(on), flex: 1, padding: "4px 4px", fontSize: 11 }} onClick={() => setD((p) => { p.explosive = set.explosive; p.cryo = set.cryo; if (set.explosive || set.cryo) p.solid = true; })}>{t(lbl)}</button>;
            })}
          </div>
        </>)}
        {kind === "pipe" && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <label>{t("ось")}<select value={dc.dir ?? "v"} onChange={(e) => setD((p) => (p.dir = e.target.value as "h" | "v"))} style={{ ...field, width: "auto" }}><option value="v">{t("вертик.")}</option><option value="h">{t("гориз.")}</option></select></label>
            {t("длина")}<input type="number" step={0.5} value={dc.w} onChange={(e) => setD((p) => (p.w = Math.max(1, +e.target.value)))} style={{ ...field, width: 48 }} />
            {t("толщ")}<input type="number" step={0.02} value={dc.r ?? 0.18} onChange={(e) => setD((p) => (p.r = Math.max(0.05, +e.target.value)))} style={{ ...field, width: 48 }} />
          </div>
        )}
        {kind === "cable" && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {t("кол-во")}<input type="number" step={1} value={dc.count ?? 4} onChange={(e) => setD((p) => (p.count = Math.max(1, Math.round(+e.target.value))))} style={{ ...field, width: 44 }} />
            {t("длина")}<input type="number" step={0.2} value={dc.len ?? 1.8} onChange={(e) => setD((p) => (p.len = Math.max(0.4, +e.target.value)))} style={{ ...field, width: 48 }} />
            <label><select value={dc.variant ?? "signal"} onChange={(e) => setD((p) => (p.variant = e.target.value as "signal" | "power"))} style={{ ...field, width: "auto" }}><option value="signal">{t("сигнал")}</option><option value="power">{t("силовой")}</option></select></label>
          </div>
        )}
        {kind === "model" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, padding: "8px 9px" }}>
            <label style={{ ...btn(false, "primary"), textAlign: "center", cursor: "pointer" }}>
              {t("⭱ Загрузить GLB")}
              <input type="file" accept=".glb,model/gltf-binary" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const url = String(r.result); const big = url.length > 4.5e6; setD((p) => { p.src = url; if (!p.label || p.label === "3D-модель") p.label = f.name.replace(/\.glb$/i, ""); }); if (big) alert(t("GLB тяжёлый - в превью покажется, но НЕ сохранится между перезагрузками (лимит localStorage ~5МБ). Для постоянного: сожми tools/compress-glb.mjs → положи в public/ → впиши путь ниже.")); }; r.readAsDataURL(f); }} />
            </label>
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11 }}>{t("путь")}<input value={dc.src && dc.src.startsWith("data:") ? "" : (dc.src ?? "")} placeholder="/cosmos/world/tower.glb" onChange={(e) => setD((p) => (p.src = e.target.value || undefined))} style={{ ...field, flex: 1, width: "auto" }} /></label>
            <div style={{ fontSize: 10, color: dc.src ? T.good : T.warn }}>{dc.src ? (dc.src.startsWith("data:") ? t("загружен (превью, не сохранится)") : t("путь задан ✓")) : t("нет файла - показан каркас-заглушка")}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: T.dim }}><span>{t("масштаб")}</span><b style={{ color: T.ink }}>{(dc.scale ?? 1).toFixed(1)}</b></div>
            <input type="range" min={0.2} max={30} step={0.1} value={dc.scale ?? 1} onChange={(e) => setD((p) => (p.scale = +e.target.value))} style={{ width: "100%", accentColor: T.accent }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: T.dim }}><span>{t("поворот")}</span><b style={{ color: T.ink }}>{Math.round((dc.ry ?? 0) * 57)}°</b></div>
            <input type="range" min={0} max={6.28} step={0.05} value={dc.ry ?? 0} onChange={(e) => setD((p) => (p.ry = +e.target.value))} style={{ width: "100%", accentColor: T.accent }} />
            <div style={{ fontSize: 10, color: T.faint, lineHeight: 1.4 }}>{t("Фоновый пропс, без коллайдера. Тяни в глубину (z−). Каркас в списке = пик-бокс для перетаскивания.")}</div>
          </div>
        )}
        {(kind === "crate" || kind === "barrel") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 8px" }}>
            <div style={{ fontSize: 10.5, color: T.faint }}>{t("РОЛЬ (глубина Z + размер)")}</div>
            <div style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: 7, overflow: "hidden" }}>
              <button onClick={() => setD((p) => (p.solid = true))} style={{ flex: 1, cursor: "pointer", fontFamily: T.ui, fontSize: 11, padding: "6px 6px", border: "none", background: dc.solid ? T.bg : "transparent", color: dc.solid ? T.accent : T.dim }}>{t("▣ на линии")}</button>
              <button onClick={() => setD((p) => (p.solid = undefined))} style={{ flex: 1, cursor: "pointer", fontFamily: T.ui, fontSize: 11, padding: "6px 6px", border: "none", background: !dc.solid ? T.bg : "transparent", color: !dc.solid ? "#c084ff" : T.dim }}>{t("▢ фон")}</button>
            </div>
            <div style={{ fontSize: 10.5, color: T.dim, lineHeight: 1.5 }}>{dc.solid ? t("На игровой плоскости - об него можно наткнуться (укрытие).") : t("В глубину и мельче - чистый декор, игрок сквозь него не ходит.")}</div>
          </div>
        )}
        <button onClick={() => deleteSel(sel)} style={btn(false, "danger")}>{t("удалить")}</button>
      </div>
    );
  }
  // SUPPORT column
  if (sel.startsWith("sup:")) {
    const pid = sel.slice(4); const isHidden = doc.hidden.includes(sel);
    const sp = doc.plats.find((p) => p.id === pid);
    const setBh = (v: number) => store.commit((d) => { const p = d.plats.find((x) => x.id === pid); if (!p) return; if (v > 0) p.bh = v; else delete p.bh; });
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: T.ink }}>
        <div style={{ fontWeight: 500, color: "#7aa0d8" }}>{t("НИЗ ПЛАТФОРМЫ")} · {pid}</div>
        <div style={{ color: T.dim, fontSize: 11.5 }}>{t("Тело платформы вниз (на всю ширину, текстурированное). Тяни высоту - платформа продлевается вниз как структура станции.")}</div>
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>{t("высота вниз")}
          <input type="number" step={0.5} min={0} value={sp?.bh ?? 0} onChange={(e) => setBh(Math.max(0, +e.target.value))} style={{ ...field, width: 64 }} /></label>
        <input type="range" min={0} max={16} step={0.5} value={sp?.bh ?? 0} onChange={(e) => setBh(+e.target.value)} />
        {/* which station-wall texture the body wears (different depth styles per platform) */}
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>{t("стиль стены")}
          <select value={sp?.wall ?? "back_panel"} onChange={(e) => store.commit((d) => { const p = d.plats.find((x) => x.id === pid); if (p) p.wall = e.target.value; })} style={{ ...field, width: "auto" }}>
            {WALL_VARIANTS.map((w) => <option key={w} value={w}>{t(WALL_LABEL[w] ?? w)}</option>)}
          </select></label>
        <button onClick={() => store.commit((d) => { if (isHidden) d.hidden = d.hidden.filter((x) => x !== sel); else d.hidden.push(sel); })} style={btn(false, isHidden ? undefined : "danger")}>{isHidden ? t("↩ вернуть колонну") : t("убрать колонну")}</button>
      </div>
    );
  }
  const plat = doc.plats.find((p) => p.id === sel);
  const isLink = sel.startsWith("ramp:") || sel.startsWith("ladder:");
  if (plat) {
    const set = (fn: (p: any) => void) => store.commit((d) => { const p = d.plats.find((x) => x.id === sel); if (p) fn(p); });
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: T.ink }}>
        <div style={{ fontWeight: 500, color: "#ffd24d" }}>{t("ПЛАТФОРМА")} · {plat.id}</div>
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>{t("тип")}
          <select value={plat.kind ?? "mid"} onChange={(e) => set((p) => (p.kind = e.target.value))} style={{ ...field, width: "auto" }}>{KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>{t("команда")}
          <select value={plat.team ?? ""} onChange={(e) => set((p) => (p.team = e.target.value || undefined))} style={{ ...field, width: "auto" }}><option value="">-</option><option value="blue">{t("синие")}</option><option value="red">{t("красные")}</option></select></label>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span>x</span><input type="number" step={0.5} value={plat.x} onChange={(e) => set((p) => (p.x = +e.target.value))} style={field} />
          <span>{t("выс")}</span><input type="number" step={0.1} value={plat.y} onChange={(e) => set((p) => (p.y = Math.max(0, +e.target.value)))} style={field} />
          <span>{t("шир")}</span><input type="number" step={0.5} value={plat.w} onChange={(e) => set((p) => (p.w = Math.max(1, +e.target.value)))} style={field} />
        </div>
        {/* SNAP to the next/previous TIER where platforms already sit - one click instead of surgically dragging the
            gizmo; keeps everything coplanar on shared levels. Falls back to ±one jump-height when there's no tier. */}
        {(() => {
          const tiers = Array.from(new Set(doc.plats.map((p) => Math.round(p.y * 100) / 100))).sort((a, b) => a - b);
          const toTier = (dir: 1 | -1) => set((p) => { const cur = p.y; const cand = dir > 0 ? tiers.find((t) => t > cur + 0.05) : [...tiers].reverse().find((t) => t < cur - 0.05); p.y = Math.max(0, cand !== undefined ? cand : cur + dir * 2.4); });
          return (
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ ...btn(), flex: 1 }} onClick={() => toTier(1)} title={t("поднять на следующий уровень, где уже стоят платформы (в одну плоскость)")}>{t("▲ уровень выше")}</button>
              <button style={{ ...btn(), flex: 1 }} onClick={() => toTier(-1)} title={t("опустить на предыдущий уровень")}>{t("▼ уровень ниже")}</button>
            </div>
          );
        })()}
        {/* DEPTH (Z) - extrude the block BACKWARD into the scene so it reads as a chunky 3D volume, not a flat card.
            Walk-collider stays a front slab → non-walkable back, jumps unchanged. Textured sides. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>{t("глубина (в стену Z)")}
            <input type="number" step={0.5} min={2} value={plat.depth ?? 2} onChange={(e) => set((p) => { const v = Math.max(2, +e.target.value); if (v > 2.01) p.depth = v; else delete p.depth; })} style={{ ...field, width: 60 }} /></div>
          <input type="range" min={2} max={24} step={0.5} value={plat.depth ?? 2} onChange={(e) => set((p) => { const v = +e.target.value; if (v > 2.01) p.depth = v; else delete p.depth; })} style={{ width: "100%", accentColor: T.accent }} />
          <div style={{ fontSize: 10, color: T.faint }}>{t("объём уходит назад по Z, ходить нельзя - только вид (текстуры)")}</div>
        </div>
        {/* BODY HEIGHT - extend the platform's solid block DOWNWARD into a tall textured station structure (experiment) */}
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>{t("высота блока (вниз)")}
          <input type="number" step={0.5} min={0} value={plat.bh ?? 0} onChange={(e) => set((p) => { const v = Math.max(0, +e.target.value); if (v) p.bh = v; else delete p.bh; })} style={{ ...field, width: 64 }} /></label>
        {plat.bh ? (
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>{t("стиль стены")}
            <select value={plat.wall ?? "back_panel"} onChange={(e) => set((p) => (p.wall = e.target.value))} style={{ ...field, width: "auto" }}>
              {WALL_VARIANTS.map((w) => <option key={w} value={w}>{t(WALL_LABEL[w] ?? w)}</option>)}
            </select></label>
        ) : null}
        {/* DEPTH (Z) - gated by type: a WALKABLE platform is pinned to the play plane (Z=0); push it to the BACKGROUND
            to move it in depth (then it's decor: no collider, not walkable - level law L2). */}
        {plat.z ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 8px" }}>
            <div style={{ fontSize: 10.5, color: "#c084ff", fontWeight: 600 }}>{t("ФОН · глубина · без коллайдера, не ходибельная")}</div>
            {/* depth-BAND presets - one click to snap the structure onto a receding layer (near→far) */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[["близко", -4], ["средне", -9], ["далеко", -16], ["даль", -26]].map(([lbl, z]) => (
                <button key={lbl} style={{ ...btn(Math.abs((plat.z ?? 0) - (z as number)) < 0.6), padding: "3px 7px", fontSize: 10.5 }} onClick={() => set((p) => (p.z = z as number))}>{t(lbl as string)}</button>
              ))}
            </div>
            {/* fine Z slider + numeric */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span>Z</span>
              <button style={{ ...btn(), padding: "3px 8px" }} onClick={() => set((p) => (p.z = +((p.z ?? 0) + 0.5).toFixed(2)))} title={t("ближе к камере")}>＋</button>
              <input type="number" step={0.5} value={plat.z} onChange={(e) => set((p) => (p.z = +e.target.value || undefined))} style={{ ...field, width: 54 }} />
              <button style={{ ...btn(), padding: "3px 8px" }} onClick={() => set((p) => (p.z = +((p.z ?? 0) - 0.5).toFixed(2)))} title={t("глубже в сцену")}>－</button>
            </div>
            <input type="range" min={-30} max={6} step={0.5} value={plat.z} onChange={(e) => set((p) => (p.z = +e.target.value || -0.5))} style={{ width: "100%", accentColor: "#c084ff" }} />
            <button style={btn()} onClick={() => store.commit((d) => { const p = d.plats.find((x) => x.id === sel); if (p) delete p.z; })}>{t("⇄ вернуть в игру (Z=0)")}</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 5, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 8px" }}>
            <div style={{ fontSize: 10.5, color: T.dim }}>{t("глубина Z:")} <b style={{ color: T.ink }}>0</b> {t("- ходибельная, на игровой плоскости 🔒")}</div>
            <button style={btn()} onClick={() => store.commit((d) => { const p = d.plats.find((x) => x.id === sel); if (p) p.z = -3; d.spawns = d.spawns.filter((s) => s !== sel); d.links = d.links.filter((l) => l.a !== sel && l.b !== sel); })}>{t("⇄ сделать фоном (в глубину)")}</button>
          </div>
        )}
        {/* ROTATION (yaw) - angle a piece into depth. A rotated block is scenery → non-walkable (forced background). */}
        {(plat.z || plat.ry) ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>{t("поворот (по Y)")}<b style={{ color: T.ink }}>{Math.round((plat.ry ?? 0) * 57)}°</b></div>
            <input type="range" min={0} max={6.28} step={0.02} value={plat.ry ?? 0} onChange={(e) => { const v = +e.target.value; store.commit((d) => { const p = d.plats.find((x) => x.id === sel); if (!p) return; if (v > 0.01) { p.ry = +v.toFixed(2); d.spawns = d.spawns.filter((s) => s !== sel); d.links = d.links.filter((l) => l.a !== sel && l.b !== sel); } else delete p.ry; }); }} style={{ width: "100%", accentColor: "#c084ff" }} />
            <div style={{ fontSize: 10, color: T.faint }}>{t("развернуть в глубину. В фон-режиме платформу можно ТАЩИТЬ мышью по глубине (X+Z).")}</div>
          </div>
        ) : null}
        {/* per-platform TEXTURES - pick a kit texture or upload your own for the deck (top) and the sides/underside */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 8px" }}>
          <div style={{ fontSize: 10.5, color: T.faint }}>{t("ТЕКСТУРЫ ПЛАТФОРМЫ")}</div>
          <TexRow label={t("верх (дека)")} cur={plat.deckTex} presets={DECK_TEX} onSet={(v) => set((p) => { if (v) p.deckTex = v; else delete p.deckTex; })} />
          <TexRow label={t("бока / низ")} cur={plat.sideTex} presets={SIDE_TEX} onSet={(v) => set((p) => { if (v) p.sideTex = v; else delete p.sideTex; })} />
        </div>
        {/* MULTIPLAYER TEAM SPAWNS — which side ENTERS THE MATCH on this platform. Writes doc.spawns ([0]=blue/yours,
            [1]=red/enemy) → genNav derives real stand points here → the server spawns bots+players exactly on it. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 8px" }}>
          <div style={{ fontSize: 10.5, color: T.faint }}>{t("СПАВН В БОЮ")}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setTeamSpawn(sel, "blue")} style={{ ...btn(doc.spawns?.[0] === sel), color: doc.spawns?.[0] === sel ? "#0a1a2a" : "#5fd0ff", borderColor: "#2f6fa8", ...(doc.spawns?.[0] === sel ? { background: "#5fd0ff" } : {}) }}>{doc.spawns?.[0] === sel ? t("◎ твой спавн ✓") : t("◎ твой спавн")}</button>
            <button onClick={() => setTeamSpawn(sel, "red")} style={{ ...btn(doc.spawns?.[1] === sel), color: doc.spawns?.[1] === sel ? "#2a0a0a" : "#ff8080", borderColor: "#a83f3f", ...(doc.spawns?.[1] === sel ? { background: "#ff6b6b" } : {}) }}>{doc.spawns?.[1] === sel ? t("◎ спавн врага ✓") : t("◎ спавн врага")}</button>
          </div>
          <div style={{ fontSize: 10, color: T.faint }}>{t("синий = твоя команда, красный = противник. Боты и игроки появляются здесь.")}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setSpawnAt(plat.x, worldTop(plat.y))} style={btn()}>{t("◎ спавн-тест сюда")}</button>
          <button onClick={() => deleteSel(sel)} style={btn(false, "danger")}>{t("удалить")}</button>
        </div>
      </div>
    );
  }
  if (isLink) {
    const [, ab] = sel.split(":"); const [a, b] = ab.split("-");
    const isLadder = sel.startsWith("ladder:");
    const ladderCtl = isLadder ? (() => {
      const link = doc.links.find((l) => l.kind === "ladder" && `ladder:${l.a}-${l.b}` === sel);
      const pa = link && doc.plats.find((p) => p.id === link.a), pb = link && doc.plats.find((p) => p.id === link.b);
      if (!link || !pa || !pb) return null;
      const lo = Math.max(edges(pa).L, edges(pb).L), hi = Math.min(edges(pa).R, edges(pb).R);
      const curX = link.x != null ? link.x : (lo + hi) / 2;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, padding: "7px 8px" }}>
          <div style={{ fontSize: 10.5, color: T.dim }}>{t("позиция X (между платформами) - или")} <b style={{ color: T.ink }}>{t("тяни лестницу")}</b> {t("в сцене")}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span>X</span>
            <button style={{ ...btn(), padding: "3px 8px" }} onClick={() => setLadderX(sel, curX - 0.5, lo, hi)}>－</button>
            <input type="number" step={0.5} value={+curX.toFixed(2)} onChange={(e) => setLadderX(sel, +e.target.value, lo, hi)} style={{ ...field, width: 54 }} />
            <button style={{ ...btn(), padding: "3px 8px" }} onClick={() => setLadderX(sel, curX + 0.5, lo, hi)}>＋</button>
          </div>
          <input type="range" min={lo} max={hi} step={0.25} value={Math.max(lo, Math.min(hi, curX))} onChange={(e) => setLadderX(sel, +e.target.value, lo, hi)} style={{ width: "100%", accentColor: T.accent }} />
        </div>
      );
    })() : null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: T.ink }}>
        <div style={{ fontWeight: 500, color: KIND_COL[sel.startsWith("ramp") ? "ramp" : "ladder"] }}>{sel.startsWith("ramp") ? t("РАМПА") : t("ЛЕСТНИЦА")} · {a} → {b}</div>
        {ladderCtl}
        <button onClick={() => deleteSel(sel)} style={btn(false, "danger")}>{t("удалить связь")}</button>
      </div>
    );
  }
  return <div style={{ color: T.dim, fontSize: 12 }}>{t("Опора - часть платформы (выбери платформу).")}</div>;
}

// MULTIPLAYER team spawn: mark a platform as team `blue` (yours) or `red` (enemy) start. doc.spawns is an ordered
// [blueSurfaceId, redSurfaceId]; genNav spreads real stand points along each → the server spawns there. A platform
// forced to background (rotated) can't hold a spawn, so ignore those.
function setTeamSpawn(id: string, team: "blue" | "red") {
  store.commit((d) => {
    const p = d.plats.find((x) => x.id === id);
    if (!p || p.ry) return;                        // only real walkable platforms
    const sp = [...(d.spawns || [])];
    const ix = team === "blue" ? 0 : 1;
    while (sp.length <= ix) sp.push(sp[0] ?? id);  // ensure both [blue, red] slots exist
    sp[ix] = id;
    d.spawns = sp;
  });
}
// spawn for playtest (shared with #playbox via localStorage, same keys as #platlab)
function setSpawnAt(x: number, topWorld: number) {
  const sx = Math.abs(x) < 1.2 ? 2 : x; const s: [number, number] = [sx, topWorld + 0.6];
  try { localStorage.setItem("pb_spawn", JSON.stringify(s)); localStorage.removeItem("pb_spawnRandom"); } catch { /* ignore */ }
  window.dispatchEvent(new Event("studio-spawn"));
}
function removeOne(d: LevelDoc, id: string) {
  if (id.startsWith("sup:")) { if (!d.hidden.includes(id)) d.hidden.push(id); } // supports are generated → hide, not delete
  else if (id.startsWith("ramp:") || id.startsWith("ladder:")) { const [, ab] = id.split(":"); const [a, b] = ab.split("-"); d.links = d.links.filter((l) => !(l.a === a && l.b === b)); }
  else if (id.startsWith("decor:")) { const did = id.slice(6); d.decor = d.decor.filter((x) => x.id !== did); delete d.skins[id]; }
  else { d.plats = d.plats.filter((p) => p.id !== id); d.links = d.links.filter((l) => l.a !== id && l.b !== id); d.spawns = d.spawns.filter((s) => s !== id); delete d.skins[id]; }
}
function deleteSel(id: string) { store.commit((d) => removeOne(d, id)); store.setSelection(null); }
// set a ladder's X (clamped between the platforms it connects) - persisted on the link so it stays put.
function setLadderX(sel: string, x: number, lo: number, hi: number) {
  const m = hi - lo > 1 ? 0.3 : 0; const cx = Math.max(lo + m, Math.min(hi - m, x));
  store.commit((d) => { const l = d.links.find((k) => k.kind === "ladder" && `ladder:${k.a}-${k.b}` === sel); if (l) l.x = +cx.toFixed(2); });
}
// delete ALL currently-selected objects (group)
function deleteSelection() {
  const ids = store.getState().selection; if (!ids.length) return;
  store.commit((d) => { for (const id of ids) removeOne(d, id); });
  store.setSelection(null);
}
// clone selected PLATFORMS into the BACKGROUND depth (a receding echo layer): non-walkable (z pushed back), no
// spawns/links, slightly narrowed so it reads as "further". Fast way to build the 2.5D depth like the art reference.
function cloneToDepth() {
  const ids = store.getState().selection.filter((s) => !s.includes(":"));
  if (!ids.length) return;
  const clones: string[] = [];
  store.commit((d) => {
    for (const id of ids) {
      const p = d.plats.find((x) => x.id === id); if (!p) continue;
      const nid = uid("bg"); clones.push(nid);
      const backZ = (p.z ?? 0) - 6; // push 6m further into the scene than the source
      d.plats.push({ ...p, id: nid, z: backZ, team: undefined, bh: p.bh });
      if (d.skins[id]) d.skins[nid] = d.skins[id];
    }
  });
  store.setSelectionMany(clones);
}
// duplicate selected PLATFORMS with a small offset; select the clones
function duplicateSelection() {
  const ids = store.getState().selection.filter((s) => !s.includes(":"));
  if (!ids.length) return;
  const clones: string[] = [];
  store.commit((d) => {
    for (const id of ids) { const p = d.plats.find((x) => x.id === id); if (!p) continue; const nid = uid("plat"); clones.push(nid); d.plats.push({ ...p, id: nid, x: p.x + 3, y: p.y }); if (d.skins[id]) d.skins[nid] = d.skins[id]; }
  });
  store.setSelectionMany(clones);
}
// align / distribute selected platforms
function alignSel(mode: "left" | "right" | "cx" | "top" | "distx") {
  const ids = store.getState().selection.filter((s) => !s.includes(":"));
  if (ids.length < 2) return;
  store.commit((d) => {
    const ps = ids.map((id) => d.plats.find((p) => p.id === id)!).filter(Boolean);
    if (mode === "left") { const m = Math.min(...ps.map((p) => p.x - p.w / 2)); ps.forEach((p) => (p.x = m + p.w / 2)); }
    else if (mode === "right") { const m = Math.max(...ps.map((p) => p.x + p.w / 2)); ps.forEach((p) => (p.x = m - p.w / 2)); }
    else if (mode === "cx") { const m = ps.reduce((s, p) => s + p.x, 0) / ps.length; ps.forEach((p) => (p.x = Math.round(m * 2) / 2)); }
    else if (mode === "top") { const m = Math.max(...ps.map((p) => p.y)); ps.forEach((p) => (p.y = m)); }
    else if (mode === "distx") { const sorted = [...ps].sort((a, b) => a.x - b.x); const lo = sorted[0].x, hi = sorted[sorted.length - 1].x; const step = (hi - lo) / (sorted.length - 1); sorted.forEach((p, i) => (p.x = Math.round((lo + step * i) * 2) / 2)); }
  });
}

// ── P3 DEPTH: parallax layers (FAR/MID/FORE) + MID decor props. Data-driven (doc.layers / doc.decor), edited by
// numeric fields + image upload. Fills the void behind/in-front of the play plane so the 2.5D scene has depth.
const LAYER_DEF: Record<ParallaxLayer["kind"], { z: number; parallax: number }> = {
  far: { z: -40, parallax: 0.02 }, mid: { z: -14, parallax: 0.16 }, fore: { z: 5, parallax: 0.55 },
};
function DepthPanel({ doc }: { doc: LevelDoc }) {
  const addLayer = (kind: ParallaxLayer["kind"]) => store.commit((d) => d.layers.push({ id: uid("lyr"), name: kind, kind, ...LAYER_DEF[kind], src: "" }));
  const addDecor = () => store.commit((d) => d.decor.push({ id: uid("dec"), x: 0, y: 6, z: -9, w: 4, h: 6, label: "декор" }));
  const setLayer = (id: string, fn: (l: ParallaxLayer) => void) => store.commit((d) => { const l = d.layers.find((x) => x.id === id); if (l) fn(l); });
  const setDecor = (id: string, fn: (p: DecorProp) => void) => store.commit((d) => { const p = d.decor.find((x) => x.id === id); if (p) fn(p); });
  const upload = (id: string, f: File) => { const r = new FileReader(); r.onload = () => setLayer(id, (l) => (l.src = String(r.result))); r.readAsDataURL(f); };
  return (
    <div style={{ fontFamily: font, fontSize: 11, color: T.ink }}>
      <div style={{ fontWeight: 400, color: T.accent, marginBottom: 6, fontFamily: T.ui }}>{t("Слои параллакса")}</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        <button style={btn()} onClick={() => addLayer("far")}>{t("＋ фон")}</button>
        <button style={btn()} onClick={() => addLayer("mid")}>{t("＋ задник")}</button>
        <button style={btn()} onClick={() => addLayer("fore")}>{t("＋ перед")}</button>
      </div>
      {doc.layers.map((l) => {
        const previewSrc = l.src || null;
        return (
        <div key={l.id} style={{ borderTop: `1px solid ${T.border}`, padding: "8px 0", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ color: T.accent2 }}>{l.kind === "far" ? t("фон") : l.kind === "mid" ? t("задник") : t("перед")} · {l.src ? t("картинка") : t("мок")}</b>
            <button onClick={() => store.commit((d) => (d.layers = d.layers.filter((x) => x.id !== l.id)))} style={{ cursor: "pointer", color: T.bad, background: "none", border: "none", fontSize: 13 }}>✕</button></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 54, height: 34, borderRadius: 6, border: `1px solid ${T.border}`, background: previewSrc ? `center/cover url(${previewSrc})` : `linear-gradient(160deg, ${T.bg2}, ${paletteOf(doc.meta.style).glow}22)`, flexShrink: 0 }} />
            <label style={{ cursor: "pointer", color: T.accent, fontSize: 11, ...btn(), padding: "5px 8px" }}>{t("⭱ загрузить")}<input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && upload(l.id, e.target.files[0])} /></label>
            {l.src && <button onClick={() => setLayer(l.id, (x) => (x.src = ""))} style={{ ...btn(), padding: "5px 8px", fontSize: 11 }}>{t("убрать")}</button>}
          </div>
          {/* sliders - the convenient background control */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: T.dim }}><span>{t("глубина Z")}</span><b style={{ color: T.ink }}>{l.z}</b></div>
          <input type="range" min={-60} max={10} step={1} value={l.z} onChange={(e) => setLayer(l.id, (x) => (x.z = +e.target.value))} style={{ width: "100%", accentColor: T.accent }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: T.dim }}><span>{t("параллакс (0 = далеко, 1 = близко)")}</span><b style={{ color: T.ink }}>{l.parallax.toFixed(2)}</b></div>
          <input type="range" min={0} max={1} step={0.02} value={l.parallax} onChange={(e) => setLayer(l.id, (x) => (x.parallax = +e.target.value))} style={{ width: "100%", accentColor: T.accent }} />
          {/* size (растянуть) */}
          {(() => { const dw = l.kind === "far" ? 120 : l.kind === "mid" ? 90 : 70, dh = l.kind === "far" ? 70 : l.kind === "mid" ? 44 : 40; return (<>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: T.dim }}><span>{t("ширина")}</span><b style={{ color: T.ink }}>{Math.round(l.w ?? dw)}</b></div>
            <input type="range" min={20} max={260} step={2} value={l.w ?? dw} onChange={(e) => setLayer(l.id, (x) => (x.w = +e.target.value))} style={{ width: "100%", accentColor: T.accent }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: T.dim }}><span>{t("высота")}</span><b style={{ color: T.ink }}>{Math.round(l.h ?? dh)}</b></div>
            <input type="range" min={15} max={160} step={2} value={l.h ?? dh} onChange={(e) => setLayer(l.id, (x) => (x.h = +e.target.value))} style={{ width: "100%", accentColor: T.accent }} />
            <div style={{ display: "flex", gap: 6, fontSize: 10.5, color: T.dim, alignItems: "center" }}>
              {t("сдвиг x")}<input type="number" step={2} value={l.ox ?? 0} onChange={(e) => setLayer(l.id, (x) => (x.ox = +e.target.value))} style={{ ...field, width: 44 }} />
              y<input type="number" step={2} value={l.oy ?? (l.kind === "far" ? 12 : l.kind === "fore" ? 2 : 8)} onChange={(e) => setLayer(l.id, (x) => (x.oy = +e.target.value))} style={{ ...field, width: 44 }} />
            </div>
          </>); })()}
        </div>
      ); })}
      <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b style={{ color: T.accent2 }}>{t("ДЕКОР (MID)")}</b><button style={btn()} onClick={addDecor}>{t("＋ декор")}</button></div>
      {doc.decor.map((p) => (
        <div key={p.id} style={{ padding: "4px 0", display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
          x<input type="number" step={0.5} value={p.x} onChange={(e) => setDecor(p.id, (d) => (d.x = +e.target.value))} style={{ ...field, width: 40 }} />
          y<input type="number" step={0.5} value={p.y} onChange={(e) => setDecor(p.id, (d) => (d.y = +e.target.value))} style={{ ...field, width: 40 }} />
          z<input type="number" step={0.5} value={p.z} onChange={(e) => setDecor(p.id, (d) => (d.z = +e.target.value))} style={{ ...field, width: 40 }} />
          w<input type="number" step={0.5} value={p.w} onChange={(e) => setDecor(p.id, (d) => (d.w = +e.target.value))} style={{ ...field, width: 40 }} />
          h<input type="number" step={0.5} value={p.h} onChange={(e) => setDecor(p.id, (d) => (d.h = +e.target.value))} style={{ ...field, width: 40 }} />
          <button onClick={() => store.commit((d) => (d.decor = d.decor.filter((x) => x.id !== p.id)))} style={{ cursor: "pointer", color: "#ff8a8a", background: "none", border: "none" }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── app-shell chrome (Blender/Photoshop-like): menu-bar dropdowns, tool rail, docked panels ─────────────────────
function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("mousedown", h); window.addEventListener("keydown", k);
    return () => { window.removeEventListener("mousedown", h); window.removeEventListener("keydown", k); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}
function Menu({ label, children, tour }: { label: string; children: (close: () => void) => React.ReactNode; tour?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button data-tour={tour} onClick={() => setOpen((o) => !o)} style={{ fontFamily: T.ui, fontSize: 12.5, fontWeight: 500, cursor: "pointer", background: open ? T.bg2 : "transparent", color: open ? T.accent : T.ink, border: `1px solid ${open ? T.border : "transparent"}`, borderRadius: 6, padding: "4px 10px" }}>{label}</button>
      {open && <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 214, background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: T.shadow, padding: 5, zIndex: 40, display: "flex", flexDirection: "column", gap: 1 }}>{children(() => setOpen(false))}</div>}
    </div>
  );
}
function MI({ onClick, children, kbd, danger, disabled }: { onClick: () => void; children: React.ReactNode; kbd?: string; danger?: boolean; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={onClick}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = T.bg2; }} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, textAlign: "left", cursor: disabled ? "default" : "pointer", background: "transparent", border: "none", borderRadius: 6, padding: "6px 9px", fontFamily: T.ui, fontSize: 12.5, color: disabled ? T.faint : danger ? T.bad : T.ink, opacity: disabled ? 0.5 : 1 }}>
      <span>{children}</span>{kbd && <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.faint }}>{kbd}</span>}
    </button>
  );
}
const MSep = () => <div style={{ height: 1, background: T.border, margin: "4px 6px" }} />;
function ToolBtn({ icon, label, active, onClick, tour }: { icon: string; label: string; active?: boolean; onClick: () => void; tour?: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <button data-tour={tour} onClick={onClick} style={{ width: 38, height: 38, display: "grid", placeItems: "center", cursor: "pointer", fontSize: 15, borderRadius: 8, background: active ? T.bg2 : "transparent", color: active ? T.accent : T.dim, border: `1px solid ${active ? T.accent : "transparent"}` }}>{icon}</button>
      {hov && <div style={{ position: "absolute", left: 46, top: 8, whiteSpace: "nowrap", background: T.panelSolid, color: T.ink, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", fontFamily: T.ui, fontSize: 11.5, boxShadow: T.shadow, zIndex: 30, pointerEvents: "none" }}>{label}</div>}
    </div>
  );
}
function TabBtn({ active, onClick, children, tour }: { active: boolean; onClick: () => void; children: React.ReactNode; tour?: string }) {
  return <button data-tour={tour} onClick={onClick} style={{ flex: 1, cursor: "pointer", background: active ? T.panel : "transparent", color: active ? T.accent : T.dim, border: "none", borderBottom: `2px solid ${active ? T.accent : "transparent"}`, padding: "8px 6px", fontFamily: T.ui, fontSize: 12, fontWeight: 500 }}>{children}</button>;
}

const HOTKEYS: { group: string; rows: [string, string][] }[] = [
  { group: "Камера", rows: [["Зажми ЛКМ на пустом ~сек", "начать вращать (летать по Z)"], ["Alt(⌥)+ЛКМ / СКМ / «⟲ орбита»", "вращать вид"], ["Правая кнопка + тяни", "панорама"], ["W A S D / стрелки", "лететь (от текущей камеры)"], ["Q / E / колесо", "зум · F - фокус"], ["⟳ / ⤢", "сброс в 2D / вместить"]] },
  { group: "Ракурсы (Z)", rows: [["1", "фронт (2D)"], ["2", "¾ слева"], ["3", "¾ справа"], ["4", "сверху"]] },
  { group: "Выделение", rows: [["Клик по блоку / метке", "выбрать один"], ["Тяни по пустому", "рамкой выделить несколько"], ["Shift + клик", "добавить/убрать из выбора"], ["Тяни выделенное", "двигать группой (снап 0.5м)"]] },
  { group: "Правка", rows: [["⌘Z / ⇧⌘Z", "отменить / повторить"], ["⌘D", "дублировать"], ["Del / Backspace", "удалить выбранное"], ["Рампа/лестница → 2 блока", "построить связь"]] },
  { group: "Отображение", rows: [["Текст. / Серо / Каркас", "режим геометрии"], ["подписи / фон", "скрыть метки / параллакс"]] },
  { group: "Прочее", rows: [["?  или  F1", "эта справка"], ["Справка → обучение", "интерактивный тур"]] },
];
function HotkeysModal({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#050810cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: "92vw", maxHeight: "84vh", overflow: "auto", background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: T.radius + 4, padding: "20px 22px", fontFamily: T.ui, color: T.ink, boxShadow: T.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, color: T.accent }}>{t("⌨ Горячие клавиши")}</div>
          <button onClick={onClose} style={{ ...btn(), padding: "4px 10px" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
          {HOTKEYS.map((g) => (
            <div key={g.group}>
              <div style={{ fontSize: 11, color: T.faint, letterSpacing: ".05em", marginBottom: 6, textTransform: "uppercase" }}>{t(g.group)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {g.rows.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}>
                    <span style={{ fontFamily: T.mono, color: T.accent2, whiteSpace: "nowrap" }}>{k}</span>
                    <span style={{ color: T.dim, textAlign: "right" }}>{t(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const GUIDELINES: [string, string][] = [
  ["Играбельность прежде всего", "Держи индикатор «✓ проходимо» зелёным. Красный - где-то не пройти."],
  ["Прыжок героя", "Апекс ~2.4м, по горизонтали достаёт ~4.8м. Дальше платформу не поставить - не допрыгнет."],
  ["Симметрия", "Делай карту зеркальной (лево = право) - бой честный для обеих команд."],
  ["Три яруса", "Низ / середина / верх дают вертикаль и манёвр."],
  ["Укрытия", "Ставь укрытие каждые 5-7м, чтобы карта не простреливалась насквозь."],
  ["Спавны", "По одному на команду, подальше друг от друга."],
  ["Глубина", "Слои фона FAR / MID / FORE дают объём. Декор на глубине (Z≠0) идёт без коллайдера."],
];
const FAQ: [string, string][] = [
  ["Как сохранить, чтобы не потерять?", "Уровень сам сохраняется в браузере на каждое действие. Но лучше подстраховаться: «Файл → Сохранить в библиотеку» держит несколько уровней, «Файл → Экспорт JSON» скачивает файл на диск (его не сотрёшь случайно), «Поделиться» даёт ссылку на карту. Совет: экспортируй JSON перед тем как чистить кэш браузера - автосейв живёт в нём."],
  ["Как загрузить свою текстуру?", "Выбери блок → справа слот текстуры → «загрузить свою». Для готового уровня положи файл в проект и впиши путь."],
  ["Почему красный «⚠»?", "Где-то нельзя пройти: не допрыгнуть, застрять или блок придавлен. Наведись на индикатор - подскажет где."],
  ["Как сыграть на своей карте?", "«▶ Тест» - пробежка физикой. «бой тут» - бой с ботами. «играть с другом» - ссылка на дуэль 1×1."],
  ["Всё сломал?", "Ctrl+Z - отмена, Ctrl+Shift+Z - повтор. Тур перезапускается в меню «Справка»."],
  ["Как смотреть в 3D?", "Клавиши 1-4 (фронт / ¾ слева / ¾ справа / сверху), Alt+ЛКМ - вращать, колесо - зум, F - фокус."],
];
function FaqModal({ onClose }: { onClose: () => void }) {
  const Col = ({ title, items }: { title: string; items: [string, string][] }) => (
    <div>
      <div style={{ fontSize: 11, color: T.faint, letterSpacing: ".05em", marginBottom: 9, textTransform: "uppercase" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map(([q, a]) => (
          <div key={q}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{t(q)}</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 2, lineHeight: 1.45 }}>{t(a)}</div>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#050810cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 740, maxWidth: "94vw", maxHeight: "86vh", overflow: "auto", background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: T.radius + 4, padding: "20px 24px", fontFamily: T.ui, color: T.ink, boxShadow: T.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, color: T.accent }}>{t("Гайдлайны и FAQ")}</div>
          <button onClick={onClose} style={{ ...btn(), padding: "4px 10px" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 30px" }}>
          <Col title={t("Как делать хорошие уровни")} items={GUIDELINES} />
          <Col title={t("Частые вопросы")} items={FAQ} />
        </div>
      </div>
    </div>
  );
}

// AI texture/background guide - the same flow we used, handed to users: what to generate, which tool,
// copy-paste prompt recipes, and how to bring the result into the editor.
const AI_PROMPTS: { label: string; hint: string; text: string }[] = [
  { label: "Верх платформы (дека)", hint: "вид строго сверху, бесшовно", text: "Seamless tileable texture of a sci-fi space-station metal floor, strict top-down orthographic view, ribbed panels with rivets, flat even lighting, no shadows, no perspective, 1024x1024" },
  { label: "Бок платформы", hint: "вид в лоб, опасная разметка", text: "Flat front-on texture of a platform side wall, dark brushed metal with yellow-black hazard stripes and a thin cyan neon underglow, straight-on, no perspective, seamless horizontally, 1024x1024" },
  { label: "Фон-задник (параллакс)", hint: "широкий 2:1, без переднего плана", text: "Distant sci-fi vista: red canyon planet under a purple sky with a soft nebula, atmospheric haze, cinematic wide 2:1 aspect, soft ambient light, no foreground objects, no characters" },
  { label: "Проп / декор (на чёрном)", hint: "чёрный фон = легко вырезать", text: "Game prop: a glowing energy container / crate, centered on a PURE BLACK background, even studio lighting, no floor, no shadow, sharp edges" },
];
function CopyPrompt({ label, hint, text }: { label: string; hint: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { try { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch { /* ignore */ } };
  return (
    <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div><span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{t(label)}</span> <span style={{ fontSize: 10.5, color: T.faint }}>{t(hint)}</span></div>
        <button onClick={copy} style={{ ...btn(false, copied ? "primary" : undefined), padding: "3px 9px", fontSize: 11, whiteSpace: "nowrap" }}>{copied ? t("✓ скопировано") : t("копировать")}</button>
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.dim, marginTop: 6, lineHeight: 1.4 }}>{text}</div>
    </div>
  );
}
function AiTexModal({ onClose }: { onClose: () => void }) {
  const Step = ({ n, children }: { n: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}><span style={{ fontFamily: T.mono, color: T.accent2, fontWeight: 600, fontSize: 12, minWidth: 16 }}>{n}</span><span style={{ fontSize: 12, color: T.dim, lineHeight: 1.5 }}>{children}</span></div>
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#050810cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 780, maxWidth: "95vw", maxHeight: "88vh", overflow: "auto", background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: T.radius + 4, padding: "20px 24px", fontFamily: T.ui, color: T.ink, boxShadow: T.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, color: T.accent }}>{t("Свои текстуры и фоны через AI")}</div>
          <button onClick={onClose} style={{ ...btn(), padding: "4px 10px" }}>✕</button>
        </div>
        <div style={{ fontSize: 12.5, color: T.dim, lineHeight: 1.55, marginBottom: 14 }}>
          {t("Любую текстуру или фон можно нарисовать нейросетью и загрузить сюда. Генератор:")} <b style={{ color: T.ink }}>Nano Banana</b> (Gemini), <b style={{ color: T.ink }}>ChatGPT / DALL·E</b>, {t("Midjourney или любой другой. Промт можно на русском, но на английском картинка обычно чётче - переведи ключевые слова.")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: "6px 26px" }}>
          <div>
            <div style={{ fontSize: 11, color: T.faint, letterSpacing: ".05em", marginBottom: 8, textTransform: "uppercase" }}>{t("Готовые промты (жми «копировать»)")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {AI_PROMPTS.map((p) => <CopyPrompt key={p.label} {...p} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.faint, letterSpacing: ".05em", marginBottom: 8, textTransform: "uppercase" }}>{t("Формула промта")}</div>
            <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.5, marginBottom: 16 }}>
              {t("[что] + [ракурс:")} <b style={{ color: T.ink }}>{t("сверху")}</b> {t("для деки /")} <b style={{ color: T.ink }}>{t("в лоб")}</b> {t("для боков] + [материал, стиль] + [")}<b style={{ color: T.ink }}>{t("бесшовно / tileable")}</b>{t("] + [освещение] + [")}<b style={{ color: T.ink }}>{t("без перспективы, плоско")}</b>{t("] + [размер 1024×1024 или 2:1 для фона].")}
            </div>
            <div style={{ fontSize: 11, color: T.faint, letterSpacing: ".05em", marginBottom: 8, textTransform: "uppercase" }}>{t("Важно")}</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: T.dim, lineHeight: 1.55 }}>
              <li>{t("Дека - «top-down», бока - «flat / front». Иначе поедет перспектива.")}</li>
              <li>{t("«Бесшовно / tileable» - чтобы не было швов при повторе.")}</li>
              <li>{t("Проп проси на ЧЁРНОМ фоне - легко отделить от фона.")}</li>
              <li>{t("Фон делай шире (2:1) и без переднего плана - он уходит в глубину.")}</li>
            </ul>
          </div>
        </div>

        <div style={{ height: 1, background: T.border, margin: "16px 0 14px" }} />
        <div style={{ fontSize: 11, color: T.faint, letterSpacing: ".05em", marginBottom: 9, textTransform: "uppercase" }}>{t("Как добавить в редактор")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Step n="1">{t("Сгенерируй картинку и скачай её.")}</Step>
          <Step n="2"><b style={{ color: T.ink }}>{t("Текстура:")}</b> {t("выбери платформу → справа слот «верх (дека)» или «бока / низ» → «загрузить свою».")}</Step>
          <Step n="3"><b style={{ color: T.ink }}>{t("Фон:")}</b> {t("вкладка «Фон» справа → «＋ задник» → загрузи картинку → подвинь слайдеры глубины и параллакса.")}</Step>
          <Step n="4">{t("Для постоянного уровня положи файл в проект и впиши путь - иначе картинка живёт только как превью (лимит браузера).")}</Step>
        </div>
      </div>
    </div>
  );
}

// Phone gate: the editor needs a mouse (place blocks, drag gizmo handles), so on a small/touch screen we suggest
// a computer (and rotating a tablet to landscape). Dismissible - «всё равно продолжить» lets the curious in.
function MobileGate({ portrait, onContinue }: { portrait: boolean; onContinue: () => void }) {
  const gbtn: React.CSSProperties = { fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer", borderRadius: 11, padding: "13px 18px", border: "1px solid transparent" };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100000, display: "grid", placeItems: "center", padding: 24, background: "radial-gradient(120% 90% at 50% 0%, #0b1a30, #05070d 62%)", color: "#eaf3ff", fontFamily: "'Space Grotesk', system-ui, sans-serif", textAlign: "center" }}>
      <div style={{ maxWidth: 380 }}>
        <img src="/studio/brand.webp" alt="" style={{ width: 54, height: 54, borderRadius: 12, margin: "0 auto 16px", display: "block", objectFit: "cover" }} />
        <div style={{ fontFamily: "'Russo One', system-ui, sans-serif", fontSize: 22, marginBottom: 10 }}>{t("Студия лучше на компьютере")}</div>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: "#9fb4d0", margin: 0 }}>{t("Редактор уровней собирается мышкой. На телефоне неудобно ставить блоки и тянуть за ручки. Открой")} <b style={{ color: "#eaf3ff" }}>studio.spaceattack.app</b> {t("с компьютера.")}</p>
        {portrait && <p style={{ fontSize: 14, color: "#5fd0ff", marginTop: 12 }}>{t("Планшет? Поверни экран горизонтально.")}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          <button onClick={() => { window.location.hash = "home"; window.location.reload(); }} style={{ ...gbtn, background: "linear-gradient(180deg,#4a8dff,#2f7cf6)", color: "#fff" }}>{t("На главную")}</button>
          <button onClick={onContinue} style={{ ...gbtn, background: "#0e1830", border: "1px solid #24324c", color: "#9fb4d0" }}>{t("Всё равно продолжить")}</button>
        </div>
      </div>
    </div>
  );
}

// tiny schematic of a level (platforms as bars, links dashed, side view) for the template cards.
function levelPreview(doc: LevelDoc): string {
  const ps = doc.plats; if (!ps.length) return "";
  const xs = ps.flatMap((p) => [p.x - p.w / 2, p.x + p.w / 2]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const maxY = Math.max(5, ...ps.map((p) => p.y));
  const pad = 3, vbW = (maxX - minX) + pad * 2, vbH = (maxY - 0) + pad * 2;
  const sy = (y: number) => (maxY - y) + pad;
  const rects = ps.map((p) => { const x = (p.x - p.w / 2) - minX + pad, y = sy(p.y); const col = p.team === "red" ? "#ff8a8a" : p.team === "blue" ? "#7fd8ff" : "#9fb6d8"; return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${p.w.toFixed(1)}" height="0.8" rx="0.3" fill="${col}"/>`; }).join("");
  const links = doc.links.map((l) => { const a = ps.find((p) => p.id === l.a), b = ps.find((p) => p.id === l.b); if (!a || !b) return ""; return `<line x1="${(a.x - minX + pad).toFixed(1)}" y1="${sy(a.y).toFixed(1)}" x2="${(b.x - minX + pad).toFixed(1)}" y2="${sy(b.y).toFixed(1)}" stroke="${l.kind === "ladder" ? "#c084ff" : "#37ff9a"}" stroke-width="0.4" stroke-dasharray="0.7 0.5"/>`; }).join("");
  return `<svg viewBox="0 0 ${vbW.toFixed(1)} ${vbH.toFixed(1)}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%">${links}${rects}</svg>`;
}
// first-run / «Файл → Начать с шаблона»: pick a ready level instead of a blank canvas.
function TemplatePicker({ onPick, onClose, canClose }: { onPick: (id: string) => void; onClose: () => void; canClose: boolean }) {
  const cards = [{ id: "empty", label: t("Пустая земля"), desc: t("Только пол. Полная свобода, строй что хочешь."), doc: starterDoc() }, ...TEMPLATES.map((tm) => ({ id: tm.id, label: t(tm.label), desc: t(tm.desc), doc: tm.make() }))];
  return (
    <div onClick={() => canClose && onClose()} style={{ position: "fixed", inset: 0, background: "#050810e6", display: "grid", placeItems: "center", zIndex: 90, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 860, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto", background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: T.radius + 4, padding: "22px 24px", fontFamily: T.ui, color: T.ink, boxShadow: T.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: T.display, fontSize: 19, fontWeight: 500, color: T.accent }}>{t("С чего начать?")}</div>
          {canClose && <button onClick={onClose} style={{ ...btn(), padding: "4px 10px" }}>✕</button>}
        </div>
        <div style={{ fontSize: 12.5, color: T.dim, marginBottom: 18 }}>{t("Выбери шаблон или начни с чистой земли. Всё можно поменять потом.")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {cards.map((c) => (
            <button key={c.id} onClick={() => onPick(c.id)} style={{ textAlign: "left", cursor: "pointer", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, color: T.ink, display: "flex", flexDirection: "column", gap: 8, transition: ".14s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; }}>
              <div style={{ height: 78, borderRadius: 8, background: "linear-gradient(180deg,#0a1526,#0d1a30)", border: `1px solid ${T.border}`, padding: 8, display: "grid", placeItems: "center" }} dangerouslySetInnerHTML={{ __html: levelPreview(c.doc) }} />
              <div><div style={{ fontFamily: T.display, fontSize: 14, fontWeight: 500 }}>{c.label}</div><div style={{ fontSize: 11, color: T.dim, marginTop: 3, lineHeight: 1.4 }}>{c.desc}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudioApp() {
  const { doc, selection, tool, linkFrom } = store.useStudio();
  useLang(); // re-render the whole editor when the language switches
  // SYNC: on open, load the CURRENT published main map from the backend so the studio shows exactly what the engine
  // plays — the SAME level on every origin (studio.spaceattack.app / localhost / iPad), not a per-origin localStorage
  // draft or the empty starter. Skips when ?new/?tpl deep-links a fresh project, or nothing is published yet.
  useEffect(() => {
    let alive = true;
    try { const q = new URLSearchParams(location.search); if (q.has("new") || q.has("tpl")) return; } catch { /* */ }
    fetchMainMap().then((m) => { if (alive && m && m.doc) store.replaceDoc(m.doc as typeof doc); }).catch(() => { /* backend down → keep local */ });
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [shade, setShade] = useState<"tex" | "solid" | "wire">("tex");
  const greybox = shade !== "tex";
  const [showVal, setShowVal] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showBg, setShowBg] = useState(true);
  const [showLabels, setShowLabels] = useState(false); // scene badges OFF by default - the hierarchy names everything; toggle «подписи» to show
  const [measure, setMeasure] = useState(false);
  const [route, setRoute] = useState(false);          // bot-route editor overlay (waypoints + nav graph)
  const [selNode, setSelNode] = useState<string | null>(null);
  const [, forceTheme] = useState(0);                 // re-render the whole editor when the light/dark theme flips
  useEffect(() => onTheme(() => forceTheme((n) => n + 1)), []);
  const [snapUi, setSnapUi] = useState(getSnap());    // grid snap step (coarse↔fine, or off for free placement)
  const [viewIdx, setViewIdx] = useState(0);
  const [orbitLock, setOrbitLock] = useState(false); // sticky "орбита" toggle
  const [altHeld, setAltHeld] = useState(false);      // Alt(⌥) held → temporary orbit
  const orbit = orbitLock || altHeld;
  const [gizmo, setGizmo] = useState<GizmoMode | null>("translate"); // 360° transform gizmo mode (null = off)
  const [tab, setTab] = useState<"obj" | "depth" | "level">("obj");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  // ?tour (or ?tour=1) force-shows the onboarding even if it was already seen - handy for a reset/demo.
  const [showTutor, setShowTutor] = useState(() => { try { if (new URLSearchParams(window.location.search).has("tour")) { localStorage.removeItem("studio_tutor_done"); return true; } } catch { /* ignore */ } return !tutorSeen(); });
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [showAiTex, setShowAiTex] = useState(false);
  const [gatePass, setGatePass] = useState(false);
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => { const on = () => setVp({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener("resize", on); window.addEventListener("orientationchange", on); return () => { window.removeEventListener("resize", on); window.removeEventListener("orientationchange", on); }; }, []);
  const isPhone = Math.min(vp.w, vp.h) < 560; // short side < 560 → a phone-class screen (any orientation)
  // template picker on a genuine first run (or ?new), but not when ?tour explicitly launches the walkthrough.
  const [showTpl, setShowTpl] = useState(() => { try { const q = new URLSearchParams(window.location.search); if (q.has("tour")) return false; if (q.has("new")) return true; return !localStorage.getItem("studio_doc"); } catch { return false; } });
  const pickTemplate = (id: string) => { store.replaceDoc(id === "empty" ? starterDoc() : (TEMPLATES.find((t) => t.id === id)?.make() ?? starterDoc())); setShowTpl(false); };
  const [genOpen, setGenOpen] = useState(false);              // random-map settings modal
  const [genOpts, setGenOpts] = useState<MapOpts>(DEFAULT_OPTS);
  const rollMap = (o: MapOpts) => { const d = genRandomMap({ ...o, seed: Math.floor(Math.random() * 1e9) }); store.replaceDoc(d); };
  const [spawn, setSpawn] = useState<[number, number] | null>(() => { try { const j = localStorage.getItem("pb_spawn"); return j ? JSON.parse(j) : null; } catch { return null; } });
  const fileRef = useRef<HTMLInputElement>(null);
  const dropResolver = useRef<DropFn | null>(null);
  const verdict = useMemo(() => validate(doc), [doc]);
  const unreachable = useMemo(() => new Set(verdict.unreachable), [verdict]);
  const objs = useMemo(() => levelObjects(layoutOf(doc)), [doc]);

  useEffect(() => {
    const sync = () => { try { const j = localStorage.getItem("pb_spawn"); setSpawn(j ? JSON.parse(j) : null); } catch { /* ignore */ } };
    window.addEventListener("studio-spawn", sync);
    const key = (e: KeyboardEvent) => {
      const t = (document.activeElement?.tagName || "").toLowerCase(); if (t === "input" || t === "select" || t === "textarea") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) store.redo(); else store.undo(); }
      if (e.key === "Delete" || e.key === "Backspace") { if (store.getState().selection.length) { e.preventDefault(); deleteSelection(); } }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") { e.preventDefault(); duplicateSelection(); }
      if (e.key.toLowerCase() === "f") { e.preventDefault(); view("focus"); }
      if (e.key === "?" || e.key === "F1") { e.preventDefault(); setShowHotkeys((v) => !v); }
      if (["1", "2", "3", "4"].includes(e.key)) { const idx = +e.key - 1; setViewIdx(idx); view("view:" + VIEWS[idx].id); }
      if (e.key.toLowerCase() === "g") { e.preventDefault(); setShowGrid((v) => !v); }
      // gizmo mode (Blender-style): W=move, E=rotate, R=scale, Q=off
      if (e.key.toLowerCase() === "w") { e.preventDefault(); setGizmo("translate"); }
      if (e.key.toLowerCase() === "e") { e.preventDefault(); setGizmo("rotate"); }
      if (e.key.toLowerCase() === "r") { e.preventDefault(); setGizmo("scale"); }
      if (e.key.toLowerCase() === "q") { e.preventDefault(); setGizmo(null); }
    };
    window.addEventListener("keydown", key);
    // orbit/pan modifiers (Alt/Ctrl/Space) are owned by <ViewportControls> now (imperative, no React-state lag).
    return () => { window.removeEventListener("studio-spawn", sync); window.removeEventListener("keydown", key); };
  }, []);

  // add a platform of a given kind at a sensible default height/width (used by the tool rail + the build ribbon cards).
  const PLAT_DEF: Record<Kind, { y: number; w: number }> = { ground: { y: 0, w: 42 }, low: { y: 1.8, w: 9 }, mid: { y: 2.4, w: 6 }, high: { y: 3.8, w: 7 }, island: { y: 2.0, w: 6 }, bridge: { y: 3.0, w: 8 } };
  // `at` (world x/y from a build-bar drop) overrides the default spot; ground stays a floor.
  const addPlat = (kind: Kind = "mid", at?: { x: number; y: number }) => {
    const id = uid("plat"); const def = PLAT_DEF[kind] ?? PLAT_DEF.mid;
    const x = at ? snap(at.x) : 0;
    const y = at && kind !== "ground" ? Math.max(0, +(at.y - GROUND_TOP).toFixed(1)) : def.y;
    store.commit((d) => d.plats.push({ id, x, y, w: def.w, kind })); store.setSelection(id); setTab("obj");
  };
  // add a STRUCTURAL platform in the BACKGROUND depth (z≠0): a real textured beam pushed into the scene, NON-walkable
  // (no collider, no reachability) - for building the level BACK in Z like the art reference. `at` = drop point.
  const addDepthPlat = (at?: { x: number; y: number }) => {
    const id = uid("bg");
    const x = at ? snap(at.x) : 0, y = at ? Math.max(0, +(at.y - GROUND_TOP).toFixed(1)) : 3;
    store.commit((d) => d.plats.push({ id, x, y, w: 8, kind: "mid", z: -6 })); store.setSelection(id); setTab("obj");
  };
  // add a FREE structural BEAM = a background platform (z≠0, non-walkable) with beam dims/tilt. Drags freely on X/Z.
  // Compound shapes (truss / arch) generate several tilted beams that read as one lattice / vault.
  const addBeam = (preset: BeamPreset, at?: { x: number; y: number }) => {
    const x = at ? snap(at.x) : 0, y = at ? Math.max(0, +(at.y - GROUND_TOP).toFixed(1)) : 3;
    type Piece = { dx: number; dy: number; w: number; rz?: number };
    const trussPieces = (span: number, h: number): Piece[] => {
      const bays = Math.max(3, Math.round(span / 3)), bw = span / bays;
      const out: Piece[] = [{ dx: 0, dy: h, w: span }, { dx: 0, dy: 0, w: span }]; // top + bottom chords
      const diag = Math.hypot(bw, h), ang = Math.atan2(h, bw);
      for (let i = 0; i < bays; i++) out.push({ dx: -span / 2 + i * bw + bw / 2, dy: h / 2, w: diag, rz: i % 2 === 0 ? ang : -ang }); // zig-zag web
      return out;
    };
    const archPieces = (span: number, rise: number): Piece[] => {
      const M = 7, R = span / 2, out: Piece[] = [];
      for (let k = 0; k < M; k++) {
        const t0 = Math.PI * (1 - k / M), t1 = Math.PI * (1 - (k + 1) / M);
        const x0 = R * Math.cos(t0), y0 = rise * Math.sin(t0), x1 = R * Math.cos(t1), y1 = rise * Math.sin(t1);
        out.push({ dx: (x0 + x1) / 2, dy: (y0 + y1) / 2, w: Math.hypot(x1 - x0, y1 - y0) * 1.06, rz: Math.atan2(y1 - y0, x1 - x0) });
      }
      return out;
    };
    const pieces: Piece[] = preset.shape === "truss" ? trussPieces(preset.w, preset.h ?? 2.4)
      : preset.shape === "arch" ? archPieces(preset.w, preset.h ?? 4)
      : preset.double ? [{ dx: 0, dy: 0, w: preset.w, rz: preset.rz }, { dx: 0, dy: -2.8, w: preset.w, rz: preset.rz }]
      : [{ dx: 0, dy: 0, w: preset.w, rz: preset.rz }];
    const first = uid("beam");
    store.commit((d) => {
      pieces.forEach((pc, i) => {
        const p: any = { id: i === 0 ? first : uid("beam"), x: +(x + pc.dx).toFixed(2), y: Math.max(0, +(y + pc.dy).toFixed(2)), w: +pc.w.toFixed(2), kind: (preset.kind ?? "mid") as Kind, z: preset.z ?? -4 };
        if (pc.rz) p.rz = +pc.rz.toFixed(4); if (preset.rx) p.rx = preset.rx; if (preset.ry) p.ry = preset.ry; if (preset.depth) p.depth = preset.depth; if (preset.round) p.round = true;
        d.plats.push(p);
      });
    });
    store.setSelection(first); setTab("obj");
  };
  // inject a curated DEPTH SCENE into the current level: receding echo decks + tall towers + stacked containers, all
  // NON-walkable (z≠0), scaled to the level width and mirror-symmetric - the 2.5D "level continues into depth" look
  // (like the art reference), on ONE click. Undoable. Purely visual, doesn't touch gameplay/reachability.
  const addDepthScene = () => {
    const tok = Math.random().toString(36).slice(2, 6);
    store.commit((d) => {
      const ground = d.plats.find((p) => p.kind === "ground");
      // echo the CURRENT walkable geometry into depth (connected shadow-roads), same algorithm as the generator
      const back = depthEcho(d.plats.filter((p) => !p.z && !p.ry), rng(Math.floor(Math.random() * 1e9)), ground ? ground.w : 60, 0);
      for (const p of back.plats) d.plats.push({ ...p, id: `${p.id}_${tok}` });
      for (const de of back.decor) d.decor.push({ ...de, id: `${de.id}_${tok}` });
    });
    setTab("obj");
  };
  // PROJECT the built arena INTO DEPTH: echo the walkable silhouette as several receding + rising NON-walkable layers,
  // so the world reads like it continues back into the distance (the game "diorama depth" trick). One click; re-clicking
  // rebuilds (clears the previous projection first). Purely visual - projected layers are z≠0 → out of nav/reach.
  const projectDepth = () => {
    store.commit((d) => {
      const kept = d.plats.filter((p) => !p.id.startsWith("proj_"));
      const walk = kept.filter((p) => !p.z && !p.rx && !p.ry && !p.rz && !p.round);
      d.plats = kept;
      if (!walk.length) return;
      const LAYERS = [{ z: -5, dy: 1.4, s: 0.98 }, { z: -11, dy: 3.0, s: 0.93 }, { z: -18, dy: 4.8, s: 0.86 }, { z: -27, dy: 7, s: 0.78 }];
      LAYERS.forEach((L, i) => {
        for (const p of walk) d.plats.push({ id: `proj_${i}_${p.id}`, x: p.x, y: Math.max(0, +(p.y + L.dy).toFixed(1)), w: +(p.w * L.s).toFixed(1), kind: p.kind, z: L.z, depth: 2.2 });
      });
    });
    setTab("obj");
  };
  const clearDepthProjection = () => store.commit((d) => { d.plats = d.plats.filter((p) => !p.id.startsWith("proj_")); });
  // add a KIT prop (pipe / crate / barrel / cable). `at` = world drop point from the build ribbon.
  const addKit = (type: DecorKind, variant: "signal" | "power" = "signal", at?: { x: number; y: number }) => {
    const id = uid(type); const gtop = worldTop(0);
    const p: DecorProp = type === "pipe" ? { id, label: "труба", type: "pipe", dir: "v", x: 0, y: 2, z: 2.4, w: 8, h: 0.34, r: 0.17 }
      : type === "crate" ? { id, label: "ящик", type: "crate", x: 0, y: gtop, z: 0.2, w: 1.05, h: 1.05, solid: true }
      : type === "barrel" ? { id, label: "бочка", type: "barrel", x: 1.5, y: gtop, z: 0.2, w: 0.96, h: 1.1, r: 0.48, solid: true }
      : type === "cable" ? { id, label: "кабели", type: "cable", x: 0, y: 5, z: 0.7, w: 0.4, h: 1.8, len: 1.8, count: variant === "power" ? 3 : 4, variant }
      : { id, label: "декор", type: "box", x: 0, y: 6, z: -9, w: 4, h: 6 };
    if (at) { p.x = +snap(at.x).toFixed(2); p.y = +at.y.toFixed(2); }
    store.commit((d) => d.decor.push(p)); store.setSelection(`decor:${id}`); setTab("obj");
  };
  // build-ribbon depth helpers (mirror the «Добавить» menu items so the bottom bar can place them too).
  const addLayer = (kind: ParallaxLayer["kind"]) => { store.commit((d) => d.layers.push({ id: uid("lyr"), name: kind, kind, ...LAYER_DEF[kind], src: "" })); setTab("depth"); };
  const addDepthDecor = (at?: { x: number; y: number }) => { store.commit((d) => d.decor.push({ id: uid("dec"), x: at ? +snap(at.x).toFixed(2) : 0, y: at ? +at.y.toFixed(2) : 6, z: -9, w: 4, h: 6, label: "декор" })); setTab("obj"); };
  // place / move the playtest spawn point (green flag). `at` = world drop point; default = above the island.
  const placeSpawn = (at?: { x: number; y: number }) => saveSpawn(at ? snap(at.x) : 2, at ? +at.y.toFixed(2) : worldTop(2.4) + 0.6);
  // seed the current level with the default prop set (pipes/cables/crates/barrels) - for blank levels or to make the auto decor editable.
  const seedDecor = () => { store.commit((d) => { const have = new Set(d.decor.map((x) => x.id)); for (const p of defaultDecor(d.plats)) if (!have.has(p.id)) d.decor.push(p); }); setTab("obj"); };
  // RANDOM crates + barrels scattered on every walkable deck (mix of cover crates, solid barrels, and  explosive /
  //  cryo barrels for combat). One click populates the whole level; run again to add more.
  const scatterProps = () => {
    store.commit((d) => {
      const walk = d.plats.filter((p) => !p.z && !p.ry);
      for (const p of walk) {
        const top = worldTop(p.y), n = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const x = +(p.x + (Math.random() * 2 - 1) * Math.max(0.4, p.w / 2 - 0.8)).toFixed(2);
          const id = `sc_${Math.random().toString(36).slice(2, 6)}`; const roll = Math.random();
          if (roll < 0.5) d.decor.push({ id, label: "ящик", type: "crate", x, y: top, z: 0.2, w: +(0.85 + Math.random() * 0.4).toFixed(2), h: 1, solid: Math.random() < 0.6 });
          else if (roll < 0.72) d.decor.push({ id, label: "бочка", type: "barrel", x, y: top, z: 0.2, w: 0.96, h: 1.1, r: 0.48, solid: true });
          else if (roll < 0.9) d.decor.push({ id, label: "бочка-взрыв", type: "barrel", x, y: top, z: 0.2, w: 0.96, h: 1.1, r: 0.5, solid: true, explosive: true });
          else d.decor.push({ id, label: "бочка-крио", type: "barrel", x, y: top, z: 0.2, w: 0.96, h: 1.1, r: 0.5, solid: true, cryo: true });
        }
      }
    });
    setTab("obj");
  };
  const clearDecor = () => { if (confirm(t("Убрать весь декор с уровня?"))) store.commit((d) => { d.decor = []; }); };
  const doExport = () => { const blob = new Blob([store.exportJSON()], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = (doc.meta.name || "level").replace(/\s+/g, "-") + ".json"; a.click(); };
  const doImport = (f: File) => { const r = new FileReader(); r.onload = () => { try { store.importJSON(String(r.result)); } catch { alert(t("не удалось прочитать JSON")); } }; r.readAsText(f); };
  const playtest = () => { if (!verdict.ok && !confirm(t(`Уровень не проходится (${verdict.summary}). Всё равно играть?`))) return; store.saveLevel(); window.location.hash = "playbox"; window.location.reload(); };
  // «Сделать главной картой» — publish THIS level as THE arena map used everywhere (deathmatch / «бой тут» / online).
  // Overwrites the two source files (defaultArena.json = geometry, cosmos-nav.json = bot nav + team spawns) via the
  // dev endpoint; the running servers reload → live at once, no manual export/navgen. For prod: commit + deploy after.
  const publishMain = async () => {
    if (!verdict.ok && !confirm(t(`Уровень не проходится (${verdict.summary}). Всё равно сделать его главной картой?`))) return;
    const full = genNav(doc);
    const nav = { surfaces: full.surfaces, portals: full.portals, blockers: full.blockers, obstacles: full.obstacles, waypoints: full.waypoints, spawns: (full as any).spawns };
    // 1) BACKEND = the real source of truth: works on EVERY origin (prod studio too) → the studio (everywhere) and
    //    the engine/game all read this same level. This is what makes «главная карта» sync instead of being a
    //    per-origin localStorage draft.
    const be = await publishMainMap(doc, nav);
    // 2) DEV convenience (localhost only): also rewrite the on-disk defaultArena.json + nav via the vite plugin so
    //    `npm run dev` reflects the change immediately without a backend round-trip. Best-effort; ignored in prod.
    let devSurfaces = 0; try { const r = await fetch("/__studio/publish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ doc, nav }) }); const j = await r.json(); if (j.ok) devSurfaces = j.surfaces; } catch { /* prod: no dev endpoint */ }
    if (be.ok) { store.saveLevel(); alert(t(`Готово — это теперь ГЛАВНАЯ карта (rev ${be.rev}). Используется в «бой тут» / deathmatch / онлайне на всех устройствах.`)); }
    else alert(t("Не удалось опубликовать в бэкенд: ") + (be.error || "?") + (devSurfaces ? t(` (локально сохранено: ${devSurfaces} платформ)`) : ""));
  };
  const [libTick, setLibTick] = useState(0);
  const levels = useMemo(() => store.listLevels(), [libTick, doc.meta.name]);
  const saveLevel = () => { store.saveLevel(); setLibTick((t) => t + 1); };

  const loadTemplate = (id: string) => { const tm = TEMPLATES.find((x) => x.id === id); if (tm && confirm(t(`Загрузить шаблон «${tm.label}»? Текущий уровень заменится.`))) store.replaceDoc(tm.make()); };
  const shownUnreachable = showVal ? unreachable : EMPTY_SET;
  const selObj = objs.find((o) => o.id === selection[selection.length - 1]);
  const primary = selection[selection.length - 1];
  const coord = (() => {
    if (!primary) return null;
    if (primary.startsWith("decor:")) { const d = doc.decor.find((x) => x.id === primary.slice(6)); return d ? `x ${d.x} · y ${d.y} · z ${d.z}` : null; }
    if (primary.startsWith("sup:")) { const p = doc.plats.find((x) => x.id === primary.slice(4)); return p ? `x ${p.x} · z 0` : null; }
    const p = doc.plats.find((x) => x.id === primary); if (p) return t(`x ${p.x} · выс ${p.y} · z 0`);
    return selObj ? `x ${selObj.x.toFixed(1)} · y ${selObj.y.toFixed(1)}` : null;
  })();
  const view = (d: string) => window.dispatchEvent(new CustomEvent("studio-view", { detail: d }));
  const buildApi: BuildApi = {
    style: doc.meta.style, setStyle: (s) => store.commit((d) => (d.meta.style = s)), tool,
    addPlat, addBeam, addRamp: () => store.setTool("add-ramp"), addLadder: () => store.setTool("add-ladder"),
    addKit, seedDecor, addLayer, addDepthDecor, projectDepth, clearProjection: clearDepthProjection, setSpawn: placeSpawn,
    resolveDrop: (cx, cy) => (dropResolver.current ? dropResolver.current(cx, cy) : null),
  };

  return (
    <div className="studio-root" style={{ position: "fixed", inset: 0, background: T.bg, color: T.ink, fontFamily: T.ui, fontWeight: 400, display: "grid", gridTemplateRows: "38px 1fr 26px", overflow: "hidden" }}>
      {/* ─ MENU BAR ─ */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 10px", background: T.panelSolid, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginRight: 12 }}>
          <img src="/studio/brand.webp" alt="" style={{ width: 21, height: 21, borderRadius: 5, objectFit: "cover" }} />
          <b style={{ color: T.ink, fontFamily: T.display, fontSize: 13, letterSpacing: ".04em" }}>STUDIO</b>
        </div>
        <Menu label={t("Файл")} tour="file-menu">{(close) => (<>
          <MI onClick={() => { setGenOpen(true); close(); }} kbd="">{t("Случайная карта…")}</MI>
          <MSep />
          <div style={{ padding: "4px 9px 2px", fontSize: 10, color: T.faint, fontFamily: T.ui }}>{t("ШАБЛОНЫ")}</div>
          {TEMPLATES.map((tm) => <MI key={tm.id} onClick={() => { loadTemplate(tm.id); close(); }}>{t(tm.label)}</MI>)}
          <MSep />
          <MI onClick={() => { saveLevel(); close(); }} kbd="">{t("Сохранить в библиотеку")}</MI>
          {levels.length > 0 && <div style={{ padding: "4px 9px 2px", fontSize: 10, color: T.faint }}>{t("ОТКРЫТЬ")}</div>}
          {levels.map((n) => <MI key={n} onClick={() => { store.loadLevel(n); setLibTick((x) => x + 1); close(); }}>{n}</MI>)}
          <MSep />
          <MI onClick={() => { doExport(); close(); }} kbd="⭳">{t("Экспорт JSON…")}</MI>
          <MI onClick={() => { fileRef.current?.click(); close(); }} kbd="⭱">{t("Импорт JSON…")}</MI>
          <MSep />
          <MI onClick={() => { setShowTpl(true); close(); }}>{t("▧ Начать с шаблона…")}</MI>
          <MI onClick={() => { if (confirm(t("Новый пустой уровень? Текущий заменится (можно ⌘Z)."))) store.replaceDoc(blankDoc()); close(); }}>{t("✦ Новый пустой уровень (с нуля)")}</MI>
          <MI danger onClick={() => { if (confirm(t("Сбросить к дефолтной арене?"))) store.resetDoc(); close(); }}>{t("Сбросить уровень")}</MI>
        </>)}</Menu>
        <Menu label={t("Правка")}>{(close) => (<>
          <MI disabled={!store.canUndo()} onClick={() => { store.undo(); close(); }} kbd="⌘Z">{t("Отменить")}</MI>
          <MI disabled={!store.canRedo()} onClick={() => { store.redo(); close(); }} kbd="⇧⌘Z">{t("Повторить")}</MI>
          <MSep />
          <MI disabled={!selection.length} onClick={() => { duplicateSelection(); close(); }} kbd="⌘D">{t("Дублировать")}</MI>
          <MI disabled={!selection.length} onClick={() => { deleteSelection(); close(); }} kbd="Del" danger>{t("Удалить выбранное")}</MI>
        </>)}</Menu>
        <Menu label={t("Добавить")}>{(close) => (<>
          <MI onClick={() => { addPlat(); close(); }}>{t("＋ Платформа")}</MI>
          <MI onClick={() => { store.setTool("add-ramp"); close(); }}>{t("╱ Рампа (клик 2 блока)")}</MI>
          <MI onClick={() => { store.setTool("add-ladder"); close(); }}>{t("≣ Лестница (клик 2 блока)")}</MI>
          <MSep />
          <MI onClick={() => { addKit("pipe"); close(); }}>{t("┃ Труба")}</MI>
          <MI onClick={() => { addKit("crate"); close(); }}>{t("▦ Ящик")}</MI>
          <MI onClick={() => { addKit("barrel"); close(); }}>{t("⬒ Бочка")}</MI>
          <MI onClick={() => { addKit("cable"); close(); }}>{t("≋ Кабели")}</MI>
          <MI onClick={() => { seedDecor(); close(); }}>{t("✦ Набор декора (трубы+ящики+кабели)")}</MI>
          <MI onClick={() => { scatterProps(); close(); }}>{t("Случайные ящики + бочки (взрыв/крио)")}</MI>
          <MI onClick={() => { clearDecor(); close(); }} danger>{t("Убрать весь декор")}</MI>
          <MSep />
          <MI onClick={() => { addDepthPlat(); close(); }}>{t("◨ Фон-платформа (структура в глубину, непроходимая)")}</MI>
          <MI onClick={() => { const id = uid("model"); store.commit((d) => d.decor.push({ id, label: "3D-модель", type: "model", x: 0, y: worldTop(0), z: -8, w: 3, h: 6, scale: 1, ry: 0 })); store.setSelection(`decor:${id}`); setTab("obj"); close(); }}>{t("3D-модель (GLB в глубину)")}</MI>
          <MI onClick={() => { addDepthScene(); close(); }}>{t("Добавить глубину (пример: вышки+деки+контейнеры)")}</MI>
          <MI onClick={() => { projectDepth(); close(); }}>{t("⧉ Спроецировать арену в глубину (мир продолжается)")}</MI>
          <MI onClick={() => { clearDepthProjection(); close(); }}>{t("⌫ Убрать проекцию глубины")}</MI>
          <MI onClick={() => { store.commit((d) => d.decor.push({ id: uid("dec"), x: 0, y: 6, z: -9, w: 4, h: 6, label: "декор" })); setTab("depth"); close(); }}>{t("◧ Декор глубины (фон)")}</MI>
          <MI onClick={() => { store.commit((d) => d.layers.push({ id: uid("lyr"), name: "far", kind: "far", z: -40, parallax: 0.02, src: "" })); setTab("depth"); close(); }}>{t("Слой фона")}</MI>
        </>)}</Menu>
        <Menu label={t("Вид")}>{(close) => (<>
          <div style={{ padding: "4px 9px 2px", fontSize: 10, color: T.faint }}>{t("РЕЖИМ")}</div>
          <MI onClick={() => { setShade("tex"); close(); }}>{shade === "tex" ? "◉" : "○"} {t("Текстуры")}</MI>
          <MI onClick={() => { setShade("solid"); close(); }}>{shade === "solid" ? "◉" : "○"} {t("Серо (гринбокс)")}</MI>
          <MI onClick={() => { setShade("wire"); close(); }}>{shade === "wire" ? "◉" : "○"} {t("Каркас (полигоны)")}</MI>
          <MSep />
          <MI onClick={() => { setShowLabels((v) => !v); close(); }}>{showLabels ? "☑" : "☐"} {t("Подписи блоков")}</MI>
          <MI onClick={() => { setShowBg((v) => !v); close(); }}>{showBg ? "☑" : "☐"} {t("Фон и параллакс")}</MI>
          <MI onClick={() => { setShowVal((v) => !v); close(); }}>{showVal ? "☑" : "☐"} {t("Подсветка проходимости")}</MI>
          <MI onClick={() => { setMeasure((v) => !v); close(); }}>{measure ? "☑" : "☐"} {t("Измерения (высоты / прыжки)")}</MI>
          <MI onClick={() => { setShowGrid((v) => !v); close(); }}>{showGrid ? "☑" : "☐"} {t("Сетка и оси (3D)")}</MI>
          <MSep />
          <div style={{ padding: "4px 9px 2px", fontSize: 10, color: T.faint }}>{t("РАКУРС")}</div>
          {VIEWS.map((v, idx) => <MI key={v.id} onClick={() => { setViewIdx(idx); view("view:" + v.id); close(); }} kbd={String(idx + 1)}>{viewIdx === idx ? "◉" : "○"} {t(v.label)}</MI>)}
          <MSep />
          <MI onClick={() => { view("fit"); close(); }} kbd="⤢">{t("Вместить уровень")}</MI>
          <MI onClick={() => { view("reset"); close(); }}>{t("Сбросить вид (2D)")}</MI>
          <MSep />
          <MI onClick={() => { setLeftOpen((v) => !v); close(); }}>{leftOpen ? "☑" : "☐"} {t("Панель «Иерархия»")}</MI>
          <MI onClick={() => { setRightOpen((v) => !v); close(); }}>{rightOpen ? "☑" : "☐"} {t("Панель «Свойства»")}</MI>
        </>)}</Menu>
        <Menu label={t("Справка")} tour="help-menu">{(close) => (<>
          <MI onClick={() => { setShowTutor(true); close(); }}>{t("▶ Пройти обучение (тур)")}</MI>
          <MI onClick={() => { setShowFaq(true); close(); }}>{t("Гайдлайны и FAQ")}</MI>
          <MI onClick={() => { setShowAiTex(true); close(); }}>{t("Свои текстуры и фоны (AI)")}</MI>
          <MI onClick={() => { setShowHotkeys(true); close(); }} kbd="?">{t("Горячие клавиши")}</MI>
          <MSep />
          <MI onClick={() => { window.location.hash = "kit"; window.location.reload(); }}>{t("Просмотр ассетов (текстуры на 3D)")}</MI>
          <MI onClick={() => { window.location.hash = "learn"; window.location.reload(); }}>{t("Обучение и библиотека")}</MI>
          <MI onClick={() => { window.location.hash = "dslab"; window.location.reload(); }}>{t("Дизайн-лаб (темы)")}</MI>
        </>)}</Menu>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <select value={getLang()} onChange={(e) => setLang(e.target.value as Lang)} title={t("Язык / Language")} style={{ ...field, width: "auto", padding: "5px 7px", cursor: "pointer" }}>
            {LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
          </select>
          <button onClick={toggleTheme} title={t("светлая / тёмная тема")} style={{ ...btn(), padding: "6px 9px", fontSize: 14 }}>{themeMode === "dark" ? "☀" : "☾"}</button>
          <input value={doc.meta.name} onChange={(e) => store.commit((d) => (d.meta.name = e.target.value))} style={{ ...field, width: 150, background: T.bg2, fontFamily: T.ui, fontSize: 12 }} />
          <span data-tour="validate" style={{ fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap" }}>{verdict.ok ? <span style={{ color: T.good }}>{t("✓ проходимо")}</span> : <span style={{ color: T.warn }}>⚠ {verdict.summary}</span>}</span>
          <button title={t("плейтест текущего уровня (бег/прыжки, без боя)")} data-tour="tool-play" style={btn()} onClick={playtest}>{t("▶ Тест")}</button>
          <button title={t("бой с ботами НА ЭТОМ уровне - маршрут строится из твоей геометрии")} style={btn(false, "primary")} onClick={() => { if (!verdict.ok && !confirm(t(`Уровень не проходится (${verdict.summary}). Всё равно в бой?`))) return; window.location.href = window.location.pathname + "?map=studio#play"; }}>{t("бой тут")}</button>
          {/* ИГРАТЬ С ДРУГОМ: pack the whole level into a share link (?doc=). Both open it → 1×1 duel ON YOUR MAP,
              no bots (a link IS the map). Uses the current origin, so open the studio via the shared tunnel URL to
              get a shareable link. */}
          <button title={t("ссылка на ЭТУ карту для друга - оба откроете → дуэль 1×1 на твоей карте (без ботов)")} style={btn()} onClick={() => {
            if (!verdict.ok && !confirm(t(`Уровень не проходится (${verdict.summary}). Всё равно сделать ссылку?`))) return;
            const link = `${window.location.origin}/?fight=duel&doc=${encodeDoc(doc)}`;
            if (link.length > 7500) { alert(t("Карта слишком большая для ссылки (" + link.length + " символов). Убери часть декора или упрости геометрию.")); return; }
            try { navigator.clipboard?.writeText(link); } catch { /* ignore */ }
            window.prompt(t("Ссылка на карту скопирована. Скинь другу - оба откройте → выбор героя → дуэль 1×1 на твоей карте:"), link);
          }}>{t("играть с другом")}</button>
          <button title={t("сыграть 4×4 против ботов на «Цитадели»")} style={btn()} onClick={() => { window.location.hash = "battle"; window.location.reload(); }}>4×4</button>
          {/* PUBLISH: make THIS level the main arena map used everywhere (writes defaultArena.json + cosmos-nav.json). */}
          <button title={t("сделать этот уровень ГЛАВНОЙ картой — он станет использоваться в «бой тут», deathmatch и онлайне")} style={btn(false, "primary")} onClick={publishMain}>{t("★ главная карта")}</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
      </div>
      {genOpen && <RandomMapModal opts={genOpts} setOpts={setGenOpts} onRoll={() => rollMap(genOpts)} onClose={() => setGenOpen(false)} />}

      {/* ─ MAIN: tool rail | left dock | viewport | right dock ─ */}
      <div style={{ display: "grid", gridTemplateColumns: `48px ${leftOpen ? "220px" : "0"} 1fr ${rightOpen ? "282px" : "0"}`, minHeight: 0 }}>
        {/* tool rail */}
        <div style={{ background: T.panelSolid, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 0" }}>
          <ToolBtn icon="▛" label={t("Выбор / двигать (V)")} active={tool === "select"} onClick={() => store.setTool("select")} />
          <ToolBtn icon="＋" label={t("Добавить платформу")} onClick={addPlat} tour="tool-add" />
          <ToolBtn icon="◨" label={t("Фон-платформа (в глубину, непроходимая)")} onClick={() => addDepthPlat()} />
          <ToolBtn icon="╱" label={t("Рампа - клик по 2 платформам")} tour="tool-ramp" active={tool === "add-ramp"} onClick={() => store.setTool("add-ramp")} />
          <ToolBtn icon="≣" label={t("Лестница - клик по 2 платформам")} tour="tool-ladder" active={tool === "add-ladder"} onClick={() => store.setTool("add-ladder")} />
          <div style={{ height: 1, width: 24, background: T.border, margin: "5px 0" }} />
          <ToolBtn icon="↶" label={t("Отменить (⌘Z)")} onClick={store.undo} />
          <ToolBtn icon="↷" label={t("Повторить (⇧⌘Z)")} onClick={store.redo} />
          <div style={{ marginTop: "auto" }} />
          <ToolBtn icon="?" label={t("Обучение")} onClick={() => setShowTutor(true)} />
        </div>

        {/* left dock - outliner */}
        {leftOpen && (
          <div data-tour="hierarchy" style={{ background: T.panel, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 500, color: T.dim, letterSpacing: ".04em", display: "flex", justifyContent: "space-between" }}>{t("ИЕРАРХИЯ")} <span style={{ color: T.faint }}>{objs.length}</span></div>
            <div style={{ overflow: "auto", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
              {objs.map((o) => (
                <button key={o.id} onClick={(e) => e.shiftKey ? store.toggleSelection(o.id) : store.setSelection(o.id)} style={{ textAlign: "left", cursor: "pointer", background: selection.includes(o.id) ? T.bg2 : "transparent", border: `1px solid ${selection.includes(o.id) ? T.accent : "transparent"}`, borderRadius: 6, padding: "4px 7px", fontFamily: T.mono, fontSize: 11, color: shownUnreachable.has(o.id) ? T.bad : T.ink, whiteSpace: "nowrap", overflow: "hidden" }}>
                  <span style={{ color: KIND_COL[o.kind] }}>▮</span> {o.label}{shownUnreachable.has(o.id) && " ⚠"}
                </button>
              ))}
              {/* DECOR props (pipes/crates/barrels/cables) - listed so every prop is reachable + selectable here too */}
              {doc.decor.length > 0 && <div style={{ margin: "6px 2px 2px", fontSize: 9.5, color: T.faint, letterSpacing: ".05em" }}>{t("ДЕКОР")} · {doc.decor.length}</div>}
              {doc.decor.map((d) => { const id = `decor:${d.id}`; const sd = selection.includes(id); return (
                <button key={id} onClick={(e) => e.shiftKey ? store.toggleSelection(id) : store.setSelection(id)} style={{ textAlign: "left", cursor: "pointer", background: sd ? T.bg2 : "transparent", border: `1px solid ${sd ? T.accent : "transparent"}`, borderRadius: 6, padding: "4px 7px", fontFamily: T.mono, fontSize: 11, color: T.ink, whiteSpace: "nowrap", overflow: "hidden" }}>
                  <span style={{ color: "#c084ff" }}>◆</span> {d.label} · {d.id}
                </button>
              ); })}
            </div>
          </div>
        )}

        {/* viewport */}
        <div style={{ position: "relative", minWidth: 0, minHeight: 0 }}>
          <Canvas gl={{ toneMappingExposure: 1 }} style={{ position: "absolute", inset: 0 }}>
            <StudioScene doc={doc} greybox={greybox} wire={shade === "wire"} selection={selection} unreachable={shownUnreachable} spawn={spawn} showGrid={showGrid} showBg={showBg} showLabels={showLabels} orbit={orbit} orbitLock={orbitLock} setOrbitActive={setAltHeld} measure={measure} check={showVal} verdict={verdict} route={route} selNode={selNode} setSelNode={setSelNode} gizmo={gizmo} />
            <Unproject target={dropResolver} />
          </Canvas>
          {/* 360° GIZMO tool palette - VERTICAL on the LEFT edge (Blender/Figma style) so it never collides with the
              top toolbars/legends. Pick a mode, then grab the rings/arrows/boxes on the SELECTED object. */}
          {!route && (
            <div style={{ position: "absolute", top: 56, left: 12, display: "flex", flexDirection: "column", gap: 4, padding: 4, borderRadius: 12, background: T.panel, border: `1px solid ${T.border}`, boxShadow: T.shadow, fontFamily: T.ui, zIndex: 5 }}>
              {([["translate", "✥", "Двигать", "W"], ["rotate", "⟳", "Вращать", "E"], ["scale", "⤢", "Масштаб", "R"]] as [GizmoMode, string, string, string][]).map(([m, icon, lbl, hk]) => (
                <button key={m} onClick={() => setGizmo(m)} title={`${t(lbl)} (${hk})`}
                  style={{ width: 40, height: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, borderRadius: 9, cursor: "pointer", fontFamily: T.ui, border: `1px solid ${gizmo === m ? "#37b0ff" : T.border}`, color: gizmo === m ? "#05121f" : T.ink, background: gizmo === m ? "#7ec8ff" : "transparent" }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span><span style={{ fontSize: 9, opacity: 0.65 }}>{hk}</span>
                </button>
              ))}
              <div style={{ height: 1, background: T.border, margin: "1px 3px" }} />
              <button onClick={() => setGizmo(gizmo ? null : "translate")} title={t("Гизмо вкл/выкл (Q)")}
                style={{ width: 40, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9, cursor: "pointer", fontFamily: T.ui, fontSize: 10, fontWeight: 700, border: `1px solid ${T.border}`, color: gizmo ? T.dim : "#05121f", background: gizmo ? "transparent" : "#ffcf6b" }}>{gizmo ? "off" : "off ✓"}</button>
            </div>
          )}
          {route && <RoutePanel doc={doc} selNode={selNode} setSelNode={setSelNode} onClose={() => { setRoute(false); setSelNode(null); }} />}
          {/* contextual CONTROLS legend (bottom-left) - teaches navigation + what the coloured handles do on the current
              selection. A senior-UX discoverability touch: the interactions announce themselves instead of hiding. */}
          {/* CONTEXTUAL selection hint only (nav keys live in the bottom status bar - no duplication). Sits above the
              axis widget so it never collides with the build bar. */}
          {!route && (
            <div style={{ position: "absolute", left: 78, bottom: 12, pointerEvents: "none", display: "flex", flexDirection: "column", gap: 5, fontFamily: T.ui, maxWidth: 360 }}>
              {(() => {
                const s = selection.length === 1 ? selection[0] : null;
                const pl = s && !s.includes(":") ? doc.plats.find((p) => p.id === s) : null;
                if (!pl) return null;
                const bg = pl.z || pl.ry;
                return (
                  <div style={{ background: T.panel, border: `1px solid ${T.accent}66`, borderRadius: 8, padding: "5px 10px", fontSize: 11, color: T.dim }}>
                    {bg
                      ? <>{t("тащи платформу -")} <b style={{ color: T.ink }}>{t("по глубине")}</b> {t("(X/Z) · поворот - слайдер в инспекторе")}</>
                      : <><span style={{ color: "#37ff9a" }}>■</span> {t("зелёные края - ширина ·")} <span style={{ color: "#4aa3ff" }}>■</span> {t("синяя сзади - глубина (жми")} <b style={{ color: T.ink }}>{t("◨ глубина")}</b>)</>}
                  </div>
                );
              })()}
            </div>
          )}
          {/* viewport header */}
          <div style={{ position: "absolute", top: 8, left: 10, right: 10, display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: 8, pointerEvents: "none" }}>
            <div style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 4, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 8px", fontSize: 11.5, color: T.dim }}>
              {!leftOpen && <button onClick={() => setLeftOpen(true)} style={{ ...btn(), padding: "3px 7px" }}>☰</button>}
              <button onClick={store.undo} disabled={!store.canUndo()} title={t("Отменить (⌘Z)")} style={{ ...btn(), padding: "3px 9px", fontSize: 14, opacity: store.canUndo() ? 1 : 0.4 }}>↩</button>
              <button onClick={store.redo} disabled={!store.canRedo()} title={t("Повторить (⇧⌘Z)")} style={{ ...btn(), padding: "3px 9px", fontSize: 14, opacity: store.canRedo() ? 1 : 0.4 }}>↪</button>
              <span style={{ width: 1, height: 16, background: T.border, margin: "0 3px" }} />
              <span style={{ color: T.ink, fontWeight: 500 }}>{selection.length > 1 ? t(`выбрано: ${selection.length}`) : selObj ? selObj.label : t("ничего не выбрано")}</span>
            </div>
            <div style={{ marginLeft: "auto", pointerEvents: "auto", display: "flex", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", gap: 6, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: "4px 6px" }}>
              {/* shading segmented: Текстуры / Серо / Каркас */}
              <div style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: 7, overflow: "hidden" }}>
                {([["tex", "текст."], ["solid", "серо"], ["wire", "каркас"]] as const).map(([m, lbl]) => (
                  <button key={m} onClick={() => setShade(m)} title={m === "wire" ? t("каркас / полигоны") : m === "solid" ? t("серый гринбокс") : t("текстуры")} style={{ cursor: "pointer", fontFamily: T.ui, fontSize: 11.5, padding: "5px 9px", border: "none", background: shade === m ? T.bg2 : "transparent", color: shade === m ? T.accent : T.dim }}>{t(lbl)}</button>
                ))}
              </div>
              <button style={btn(showBg)} onClick={() => setShowBg((v) => !v)} title={t("показать/скрыть фон и параллакс")}>{t("фон")}</button>
              <button style={btn(showLabels)} onClick={() => setShowLabels((v) => !v)} title={t("подписи блоков")}>{t("подписи")}</button>
              <button style={btn(showVal)} onClick={() => setShowVal((v) => !v)}>{t("проверка")}</button>
              <button style={btn(showGrid)} onClick={() => setShowGrid((v) => !v)} title={t("сетка и оси (G)")}>{t("▦ сетка")}</button>
              <button style={btn(snapUi !== 0.5)} onClick={() => { const seq = [1, 0.5, 0.25, 0]; const s = seq[(seq.indexOf(snapUi) + 1) % seq.length]; setSnapUi(s); setSnap(s); }} title={t("шаг привязки (клик - сменить)")}>{t("шаг")} {snapUi || "off"}</button>
              <button style={btn(measure)} onClick={() => setMeasure((v) => !v)} title={t("измерения: высоты, расстояния, пройдёт ли прыжок")}>{t("измерения")}</button>
              <button style={btn(route)} onClick={() => { setRoute((v) => !v); setSelNode(null); }} title={t("маршруты ботов: узлы патруля + переходы (граф навигации)")}>{t("маршруты")}</button>
              <button style={btn(viewIdx === 2)} onClick={() => { setViewIdx(2); view("view:isoR"); }} title={t("вид глубины: наклон ¾, чтобы видеть слои по Z (фон-платформы уходят вглубь)")}>{t("◨ глубина")}</button>
              <button style={btn(orbitLock)} onClick={() => setOrbitLock((v) => !v)} title={t("орбита: ЛКМ вращает вид по глубине Z (или держи Alt/⌥)")}>{t("⟲ орбита")}</button>
              <button style={btn()} onClick={() => { const n = (viewIdx + 1) % VIEWS.length; setViewIdx(n); view("view:" + VIEWS[n].id); }} title={t("сменить ракурс камеры (по глубине Z)")}>◳ {t(VIEWS[viewIdx].label)}</button>
              {!rightOpen && <button onClick={() => setRightOpen(true)} style={btn()}>{t("свойства ▸")}</button>}
            </div>
          </div>
          {(tool === "add-ramp" || tool === "add-ladder") && (
            <div style={{ position: "absolute", bottom: 182, left: "50%", transform: "translateX(-50%)", background: T.accent, color: T.accentInk, fontWeight: 400, fontSize: 12, padding: "6px 12px", borderRadius: 8, boxShadow: T.shadow }}>{linkFrom ? t(`от «${linkFrom}» - кликни вторую платформу`) : `${tool === "add-ramp" ? t("Рампа") : t("Лестница")}${t(": кликни первую платформу")}`}</div>
          )}
          {/* traversability legend - shown while «проверка» is on */}
          {showVal && (
            <div style={{ position: "absolute", top: 58, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 12, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 9, padding: "6px 12px", fontFamily: T.ui, fontSize: 11.5, boxShadow: T.shadow, pointerEvents: "none" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#2fe08a" }} />{t("проходимо")}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#ff4d5f" }} />{t("не добраться")}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 6, background: "#eafff4", boxShadow: "0 0 6px #7fffd0" }} />{t("бегунок")}</span>
              <span style={{ color: verdict.ok ? T.good : T.warn, fontWeight: 600 }}>{verdict.ok ? t("✓ проходимо всеми ролями") : `⚠ ${verdict.summary}`}</span>
            </div>
          )}
          {/* axis gizmo (bottom-left): X → orange, Y ↑ cyan, Z ↙ violet (depth) - matches the grid axes */}
          <div style={{ position: "absolute", left: 12, bottom: 12, pointerEvents: "none", background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 6 }}>
            <svg width="54" height="54" viewBox="0 0 54 54">
              <line x1="18" y1="40" x2="48" y2="40" stroke={T.accent} strokeWidth="2" />
              <path d="M48 40l-6-3v6z" fill={T.accent} />
              <text x="49" y="44" fill={T.accent} fontSize="10" fontFamily="monospace" fontWeight="700">X</text>
              <line x1="18" y1="40" x2="18" y2="10" stroke={T.accent2} strokeWidth="2" />
              <path d="M18 10l-3 6h6z" fill={T.accent2} />
              <text x="12" y="10" fill={T.accent2} fontSize="10" fontFamily="monospace" fontWeight="700">Y</text>
              <line x1="18" y1="40" x2="6" y2="50" stroke="#c084ff" strokeWidth="2" />
              <path d="M6 50l7-1-3-3z" fill="#c084ff" />
              <text x="0" y="52" fill="#c084ff" fontSize="10" fontFamily="monospace" fontWeight="700">Z</text>
              <circle cx="18" cy="40" r="2.5" fill={T.ink} />
            </svg>
          </div>
          {/* zoom widget (bottom-right) */}
          <div style={{ position: "absolute", right: 12, bottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
            {[["in", "＋", "приблизить"], ["out", "－", "отдалить"], ["fit", "⤢", "вместить уровень"], ["reset", "⟳", "сбросить вид"]].map(([cmd, ic, tip]) => (
              <button key={cmd} title={t(tip)} onClick={() => view(cmd)} style={{ width: 34, height: 34, display: "grid", placeItems: "center", cursor: "pointer", fontSize: 15, borderRadius: 8, background: T.panel, color: T.ink, border: `1px solid ${T.border}` }}>{ic}</button>
            ))}
          </div>
          {/* Cities-Skylines-style build ribbon (bottom center) */}
          <BuildBar api={buildApi} />
        </div>

        {/* right dock - properties tabs */}
        {rightOpen && (
          <div data-tour="right" style={{ background: T.panel, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
              <TabBtn active={tab === "obj"} onClick={() => setTab("obj")}>{t("Объект")}</TabBtn>
              <TabBtn active={tab === "depth"} onClick={() => setTab("depth")} tour="depth">{t("Фон")}</TabBtn>
              <TabBtn active={tab === "level"} onClick={() => setTab("level")}>{t("Уровень")}</TabBtn>
              <button onClick={() => setRightOpen(false)} title={t("скрыть панель")} style={{ cursor: "pointer", background: "transparent", border: "none", color: T.faint, padding: "0 10px" }}>✕</button>
            </div>
            <div style={{ overflow: "auto", padding: "12px 13px", minHeight: 0 }}>
              {tab === "obj" && <Inspector doc={doc} selection={selection} />}
              {tab === "depth" && <DepthPanel doc={doc} />}
              {tab === "level" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12, color: T.dim }}>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>{t("Название")}<input value={doc.meta.name} onChange={(e) => store.commit((d) => (d.meta.name = e.target.value))} style={{ ...field, width: 130, fontFamily: T.ui }} /></label>
                  <div style={{ height: 1, background: T.border }} />
                  {/* GLOBAL underside/side texture - flip it on EVERY platform at once to compare the new belly textures */}
                  <div style={{ color: T.faint, fontSize: 11 }}>{t("НИЗ / БОКА ПЛАТФОРМ (на все)")}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {([["", "дефолт"], ["/cosmos/kit/plat_under1.png", "трубы"], ["/cosmos/kit/plat_under2.png", "фермы"], ["/cosmos/kit/plat_under3.png", "трубопровод"]] as const).map(([tex, lbl]) => (
                      <button key={lbl} style={btn(doc.plats.some((p) => p.sideTex === tex) && tex !== "")} onClick={() => store.commit((d) => { for (const p of d.plats) { if (p.z || p.ry) continue; if (tex) p.sideTex = tex; else delete p.sideTex; } })}>{t(lbl)}</button>
                    ))}
                  </div>
                  <div style={{ height: 1, background: T.border }} />
                  <div style={{ color: T.faint, fontSize: 11 }}>{t("ШАБЛОН")}</div>
                  <select value="" onChange={(e) => e.target.value && loadTemplate(e.target.value)} style={{ ...field, width: "100%" }}><option value="">{t("загрузить шаблон…")}</option>{TEMPLATES.map((tm) => <option key={tm.id} value={tm.id}>{t(tm.label)}</option>)}</select>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...btn(), flex: 1 }} onClick={saveLevel}>{t("сохранить")}</button>
                    <button style={{ ...btn(), flex: 1 }} onClick={doExport}>⭳ JSON</button>
                    <button style={{ ...btn(), flex: 1 }} onClick={() => fileRef.current?.click()}>⭱ JSON</button>
                  </div>
                  {levels.length > 0 && <select value="" onChange={(e) => { if (e.target.value) { store.loadLevel(e.target.value); setLibTick((x) => x + 1); } }} style={{ ...field, width: "100%" }}><option value="">{t("открыть сохранённый…")}</option>{levels.map((n) => <option key={n} value={n}>{n}</option>)}</select>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─ STATUS BAR ─ */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 12px", background: T.panelSolid, borderTop: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11, color: T.dim }}>
        <span style={{ color: T.accent }}>{tool === "select" ? t("выбор/движение") : tool === "add-ramp" ? t("добавление рампы") : tool === "add-ladder" ? t("добавление лестницы") : t("инструмент")}</span>
        {selObj && <span>{t("выбрано:")} <span style={{ color: T.ink }}>{selObj.label}</span></span>}
        {coord && <span style={{ color: T.accent2 }}>{coord} <span style={{ color: T.faint }}>{t("м")}</span></span>}
        <span style={{ marginLeft: "auto" }}>{orbit ? <b style={{ color: T.accent }}>{t("⟲ ОРБИТА: тащи - вращать вид")}</b> : <>{t("тяни - рамка ·")} <b style={{ color: T.accent }}>{t("Alt+тащи - вращать")}</b> {t("· Space - панорама · ⌘D - дубль · F - фокус ·")} <b style={{ color: T.accent }}>?</b> {t("- клавиши")}</>}</span>
      </div>

      {showTpl && <TemplatePicker canClose={!!store.getState().doc.plats.length} onPick={pickTemplate} onClose={() => setShowTpl(false)} />}
      {showTutor && !showTpl && <Tutor onClose={() => setShowTutor(false)} />}
      {showHotkeys && <HotkeysModal onClose={() => setShowHotkeys(false)} />}
      {showFaq && <FaqModal onClose={() => setShowFaq(false)} />}
      {showAiTex && <AiTexModal onClose={() => setShowAiTex(false)} />}
      {isPhone && !gatePass && <MobileGate portrait={vp.h > vp.w} onContinue={() => setGatePass(true)} />}
    </div>
  );
}

const EMPTY_SET = new Set<string>();

// RANDOM MAP modal - pick what you want to see; we generate a VALID arena in our world (mirror-symmetric,
// real jump/ramp metrics, guaranteed reachable). "Ещё вариант" re-rolls with the same settings.
function RandomMapModal({ opts, setOpts, onRoll, onClose }: { opts: MapOpts; setOpts: (o: MapOpts) => void; onRoll: () => void; onClose: () => void }) {
  const Row = <K extends keyof MapOpts>({ label, k, choices }: { label: string; k: K; choices: [MapOpts[K], string][] }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, color: T.dim, letterSpacing: ".03em" }}>{t(label)}</span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {choices.map(([v, lbl]) => <button key={String(v)} style={btn(opts[k] === v)} onClick={() => setOpts({ ...opts, [k]: v })}>{t(lbl)}</button>)}
      </div>
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "grid", placeItems: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 460, background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 14, fontFamily: T.ui, color: T.ink, boxShadow: "0 24px 80px #000c" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <b style={{ color: T.accent, fontFamily: T.display, fontSize: 16 }}>{t("Случайная карта")}</b>
          <span style={{ marginLeft: "auto", cursor: "pointer", color: T.faint, fontSize: 18 }} onClick={onClose}>✕</span>
        </div>
        <div style={{ fontSize: 11.5, color: T.faint }}>{t("Выбери, что хочешь видеть - сгенерим арену по нашему миру: зеркальная, с настоящими прыжками/рампами, гарантированно проходимая.")}</div>
        <Row label="РАЗМЕР" k="size" choices={[["compact", "компакт"], ["medium", "средний"], ["large", "большой"]]} />
        <Row label="ВЕРТИКАЛЬНОСТЬ" k="verticality" choices={[["low", "пологая"], ["medium", "средняя"], ["high", "высокая"]]} />
        <Row label="ЦЕНТР" k="center" choices={[["island-bridge", "остров+мост"], ["island", "остров"], ["open", "открытый"]]} />
        <Row label="ЯРУСОВ НА СТОРОНУ" k="tiers" choices={[[0, "авто"], [2, "2"], [3, "3"], [4, "4"], [5, "5"]]} />
        <Row label="СВЯЗИ" k="links" choices={[["ramps", "рампы"], ["ramps-ladders", "рампы+лестницы"], ["ladders", "только лестницы"], ["mixed", "смешанные"]]} />
        <Row label="ГЛУБИНА (сеть вдаль)" k="depthBands" choices={[[-1, "нет"], [0, "авто"], [2, "2 слоя"], [3, "3 слоя"], [4, "4 слоя"]]} />
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <input type="checkbox" checked={!!opts.symmetric} onChange={(e) => setOpts({ ...opts, symmetric: e.target.checked })} /> {t("симметричная")}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <input type="checkbox" checked={opts.cover} onChange={(e) => setOpts({ ...opts, cover: e.target.checked })} /> {t("ящики/укрытия")}
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button style={{ ...btn(false, "primary"), flex: 1 }} onClick={onRoll}>{t("Сгенерировать")}</button>
          <button style={btn()} onClick={onRoll} title={t("другой вариант с теми же настройками")}>{t("↻ Ещё")}</button>
          <button style={btn()} onClick={onClose}>{t("Готово")}</button>
        </div>
      </div>
    </div>
  );
}
