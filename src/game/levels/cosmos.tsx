// Level: "Cosmos" — the greybox arena (mirror-symmetric blockout). Pure static geometry: it renders the
// platforms/cover/struts and their colliders, nothing about players or combat. Lives here (not in the
// engine root) so a new map = a new file in this folder + one line in levels/index.tsx.
// Texture-first kit (see cosmos-arena memory): code box + flat ORTHO textures per face + bumpMap.
import { Edges, useTexture, useGLTF, Sparkles } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { ConvexHullCollider, CuboidCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { rampGeom, worldTop, THICK, BEAM, genLadderZones, edges, type Plat } from "./layout";
import { getDefaultDoc, defaultDecor, type LevelDoc, type ParallaxLayer, type DecorProp, type StyleId } from "./levelDoc";
import { setLadders } from "../../arena/ladders";
import { registerBarrel, unregisterBarrel, registerJumpPad, jumpPadFiredAt, registerTeleporter, teleporterReady, unregisterMover, tickMovers, registerLift, unregisterLift, liftY } from "../../arena/combat";
import { PALETTES, paletteOf, panelTexture, deckTexture, hazTexture, backdropTexture, textureFromSrc, type Palette } from "../../studio/mockTextures";

const STATION = PALETTES.station;

// BLOCKOUT mode: render pure untextured clay blocks + edge lines (greybox, like polygons in a 3D editor). #platlab
// flips this on to judge pure FORM. `decor` toggles the non-colliding depth geometry (supports) which is coloured
// differently (blue-grey) — it's just for depth, not gameplay.
export const blockout = { on: false, decor: true, hidden: [] as string[], spawn: null as [number, number] | null }; // hidden = removed ids; spawn = chosen [x,y] for #playbox
// a clay block. variant "play" = collidable gameplay (light grey), "decor" = non-colliding depth (blue-grey).
function Clay({ args, geometry, position, rotation, variant = "play" }: { args?: [number, number, number]; geometry?: THREE.BufferGeometry; position?: [number, number, number]; rotation?: [number, number, number]; variant?: "play" | "decor" }) {
  const col = variant === "decor" ? "#3d4763" : "#868fa6";
  const edge = variant === "decor" ? "#5a6a8c" : "#e6ecf7";
  return (
    <mesh geometry={geometry} position={position} rotation={rotation} castShadow receiveShadow>
      {args && <boxGeometry args={args} />}
      <meshStandardMaterial color={col} metalness={0} roughness={1} flatShading />
      <Edges threshold={1} color={edge} />
    </mesh>
  );
}

const D = 1.4; // thin deck so a hero clearly stands ON it (not floating in front)

// ── UNIFIED KIT LOOK: every piece (platform / floor / ramp) = plain PANEL body + a fixed-height HAZARD TRIM strip
// along the top walkable edge + a cyan glow line. The trim is the SAME real-world height everywhere → the hazard
// reads identical on thin ramps and thick floors (that inconsistency was the bug). Textures procedural = 0 credits.
const TRIM_H = 0.26;                 // hazard strip height in METERS — identical on all pieces

// panel material sized so the tile is a CONSTANT ~2m regardless of piece size (consistent everywhere), tinted by palette
function usePanel(wWorld: number, hWorld: number, pal: Palette) {
  return useMemo(() => {
    const t = panelTexture(pal).clone(); t.repeat.set(Math.max(1, wWorld / 2), Math.max(1, hWorld / 2)); t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, metalness: 0.3, roughness: 0.65 });
  }, [wWorld, hWorld, pal]);
}
// a horizontal HAZARD trim strip + glow line, sitting on the top-front edge of a piece (front face at z=zf).
function HazardStrip({ w, topY, zf, pal }: { w: number; topY: number; zf: number; pal: Palette }) {
  const tex = useMemo(() => { const t = hazTexture(pal).clone(); t.repeat.set(Math.max(1, Math.round(w / 0.7)), 1); t.needsUpdate = true; return t; }, [w, pal]);
  return (
    <group>
      <mesh position={[0, topY - TRIM_H / 2, zf + 0.02]}><planeGeometry args={[w, TRIM_H]} /><meshStandardMaterial map={tex} metalness={0.2} roughness={0.6} /></mesh>
      <mesh position={[0, topY - TRIM_H - 0.03, zf + 0.02]}><boxGeometry args={[w, 0.05, 0.02]} /><meshStandardMaterial color="#0b1a2a" emissive={pal.glow} emissiveIntensity={1.3} toneMapped={false} /></mesh>
    </group>
  );
}

// LADDER — a MODULAR "smart block" (see docs/level-kit-lore.md): PARTS = 2 rails + N rungs + 2 side MOUNTS
// (brackets bolting it to the platform top & bottom) + cyan glow. Each part is its own mesh so it can be detailed
// and later skinned per-face from generated textures (kit/ladder_rail|rung|mount.png).
const RAIL_X = 0.26; // half-spacing of the two rails
// Ladder DEPTH (z). Platforms are boxes 2 deep (front face at z=+1.0). The ladder must sit ON that FRONT face (toward
// the camera), like a real platformer ladder — NOT sunk into the middle of the deck. At the old z=0.6 the ladder
// plane was 0.4 INSIDE the box, so it intersected the deck and z-fought into the texture ("едет в текстуры") at any
// off-axis angle. 1.1 = a hair proud of the face so it reads as a near-side ladder and never clips the deck. The
// climbing character (z≈0.8) now reads just BEHIND it (visible between the open rungs) — the platformer look.
const LADDER_Z = 1.1;
function LadderMesh({ x, yb, yt, pal = STATION }: { x: number; yb: number; yt: number; pal?: Palette }) {
  const h = yt - yb; const rungs = Math.max(2, Math.round(h / 0.4));
  if (blockout.on) return (
    <group position={[x, yb, LADDER_Z]}>
      {[-RAIL_X, RAIL_X].map((rx, i) => <Clay key={i} args={[0.1, h, 0.1]} position={[rx, h / 2, 0]} />)}
      {Array.from({ length: rungs }).map((_, i) => <Clay key={"r" + i} args={[0.62, 0.08, 0.08]} position={[0, (i + 0.5) * (h / rungs), 0]} />)}
      {[0.1, h - 0.1].map((my, i) => <Clay key={"m" + i} args={[0.8, 0.24, 0.28]} position={[0, my, -0.06]} />)}
    </group>
  );
  // GENERATED ladder DECAL (painted, alpha cutout) on a plane in front of the platform face — the 2.5D approach.
  return <LadderDecal x={x} yb={yb} h={h} />;
}
// 3-SLICE ladder: fixed TOP + BOTTOM caps (brackets) + a VERTICALLY-TILED middle so rung spacing stays constant and
// the ladder never stretches — the rungs are dynamic (repeat by height), the caps are constant. All alpha decals.
function LadderDecal({ x, yb, h }: { x: number; yb: number; h: number }) {
  const [topT, botT, midT] = useTexture(["/cosmos/kit/ladder_top.webp", "/cosmos/kit/ladder_bot.webp", "/cosmos/kit/ladder_mid.webp"]);
  const W = 1.1, capH = 0.5, TILE = 0.55;
  const midH = Math.max(TILE, h - 2 * capH);
  const mid = useMemo(() => { const t = midT.clone(); t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, Math.max(1, Math.round(midH / TILE))); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; }, [midT, midH]);
  useMemo(() => { for (const t of [topT, botT]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; } }, [topT, botT]);
  const decal = { transparent: true, alphaTest: 0.5, toneMapped: false, side: THREE.DoubleSide } as const;
  return (
    // LADDER_Z: on the platform's FRONT face (toward camera) so the ladder never sinks into the deck / clips its
    // texture at an angle. The climber (z≈0.8) reads just behind the open rungs — the 2.5D platformer look.
    <group position={[x, 0, LADDER_Z]}>
      <mesh position={[0, yb + capH / 2, 0]}><planeGeometry args={[W, capH]} /><meshBasicMaterial map={botT} {...decal} /></mesh>
      <mesh position={[0, yb + capH + midH / 2, 0]}><planeGeometry args={[W, midH]} /><meshBasicMaterial map={mid} {...decal} /></mesh>
      <mesh position={[0, yb + capH + midH + capH / 2, 0]}><planeGeometry args={[W, capH]} /><meshBasicMaterial map={topT} {...decal} /></mesh>
    </group>
  );
}
function Ladders({ hidden = [], layout, paletteFor }: { hidden?: string[]; layout: { plats: any[]; links: any[] }; paletteFor: (id: string) => Palette }) {
  return <>{genLadderZones(hidden, layout).map((L) => <LadderMesh key={L.id} x={L.x} yb={L.yb} yt={L.yt} pal={paletteFor(L.id)} />)}</>;
}

function Floor({ w = 40, x = 0, y = -1, h = 1 }: { w?: number; x?: number; y?: number; h?: number }) {
  const tex = useTexture("/cosmos/plat_floor.webp");
  const top = useMemo(() => { const t = tex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.round(w / 4), 1); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; }, [tex, w]);
  return (
    <RigidBody type="fixed" colliders={false} position={[x, y, 0]}>
      <CuboidCollider args={[w / 2, h / 2, D / 2]} />
      <mesh receiveShadow castShadow><boxGeometry args={[w, h, D]} /><meshStandardMaterial color="#1a2238" metalness={0.55} roughness={0.55} /></mesh>
      <mesh position={[0, h / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, D]} /><meshStandardMaterial map={top} metalness={0.4} roughness={0.6} /></mesh>
      <mesh position={[0, h / 2 - 0.05, D / 2 + 0.005]}><boxGeometry args={[w, 0.025, 0.02]} /><meshStandardMaterial color="#20304a" emissive="#5fd0ff" emissiveIntensity={0.5} /></mesh>
    </RigidBody>
  );
}

// CLEAN platform: plain PANEL body + deck top + a fixed-height HAZARD trim on the top edge (same trim everywhere).
// `pal` = the style palette (per-object skin override → each block can look different). Deck/panel/hazard procedural.
// COL = the fixed gameplay collider depth (the front play slab). The VISUAL depth can be bigger — the block then
// extends BACKWARD into the scene (−Z) while the collider + FRONT face stay put, so a chunky platform never changes
// where you stand or how jumps read. depth defaults to COL (a normal thin card).
const COL = 2;
function CleanBeam({ w = 16, h = 1.1, depth = COL, x = 0, y = -1, z = 0, rx = 0, ry = 0, rz = 0, round = false, solid = true, pal = STATION, deckTex, sideTex }: { w?: number; h?: number; depth?: number; x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; round?: boolean; solid?: boolean; pal?: Palette; deckTex?: string; sideTex?: string }) {
  const d = Math.max(COL, depth);
  const frontZ = COL / 2;          // keep the front face where a default (depth=2) beam's front was
  const cz = frontZ - d / 2;       // body/deck centre — grows backward as depth increases
  const colZ = frontZ - COL / 2;   // collider stays the front slab (centre 0 for default)
  // GENERATED kit art (plat_deck top, plat_side front/back) OR per-platform overrides (kit path / uploaded data-URL).
  const [deckK, sideK] = useTexture([deckTex || "/cosmos/kit/plat_deck.webp", sideTex || "/cosmos/kit/plat_side.webp"]);
  const top = useMemo(() => { const t = deckK.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(d / 2))); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; }, [deckK, w, d]);
  const sideMat = useMemo(() => { const t = sideK.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(w / 2)), 1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: 0.03, metalness: 0.2, roughness: 0.7 }); }, [sideK, w]);
  // a plain metal material for the LONG side walls that appear once the block is deep (the receding faces)
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: pal.body, metalness: 0.25, roughness: 0.72 }), [pal.body]);
  // ROUNDED beam: a capsule (cylinder + domed ends) running along X. Smooth structural tube for scenery — a pill
  // profile instead of the boxy slab. Collider stays a front box (approx, background beams have none anyway).
  if (round) {
    const r = Math.min(h, d) / 2, len = Math.max(0.05, w - 2 * r);
    return (
      <RigidBody type="fixed" colliders={false} position={[x, y, z]} rotation={[rx, ry, rz]}>
        {solid && <CuboidCollider args={[w / 2, h / 2, COL / 2]} position={[0, 0, colZ]} />}
        <mesh position={[0, 0, cz]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <capsuleGeometry args={[r, len, 6, 20]} />
          <meshStandardMaterial color={pal.body} metalness={0.4} roughness={0.5} />
        </mesh>
      </RigidBody>
    );
  }
  if (blockout.on) return (
    <RigidBody type="fixed" colliders={false} position={[x, y, z]} rotation={[rx, ry, rz]}>
      {solid && <CuboidCollider args={[w / 2, h / 2, COL / 2]} position={[0, 0, colZ]} />}
      <group position={[0, 0, cz]}><Clay args={[w, h, d]} /></group>
    </RigidBody>
  );
  return (
    <RigidBody type="fixed" colliders={false} position={[x, y, z]} rotation={[rx, ry, rz]}>
      {/* WALKABLE platforms collide (FRONT slab only); background depth-decor platforms (z≠0) have NO collider. */}
      {solid && <CuboidCollider args={[w / 2, h / 2, COL / 2]} position={[0, 0, colZ]} />}
      {/* body */}
      <mesh position={[0, 0, cz]} castShadow receiveShadow><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={pal.body} metalness={0.2} roughness={0.7} /></mesh>
      {/* deck (dominates the seam) */}
      <mesh position={[0, h / 2 + 0.005, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, d]} /><meshStandardMaterial map={top} bumpMap={top} bumpScale={0.04} metalness={0.1} roughness={0.75} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} /></mesh>
      {/* front (kept at the play plane) + back panel faces (neon + hazard baked into the texture) */}
      <mesh position={[0, 0, frontZ + 0.01]} material={sideMat}><planeGeometry args={[w, h]} /></mesh>
      <mesh position={[0, 0, frontZ - d - 0.01]} rotation={[0, Math.PI, 0]} material={sideMat}><planeGeometry args={[w, h]} /></mesh>
      {/* long side walls (left/right ends) — only matter once the block is DEEP, so it reads as a 3D volume not a card */}
      {d > COL + 0.1 && <>
        <mesh position={[w / 2 + 0.005, 0, cz]} rotation={[0, Math.PI / 2, 0]} material={wallMat}><planeGeometry args={[d, h]} /></mesh>
        <mesh position={[-w / 2 - 0.005, 0, cz]} rotation={[0, -Math.PI / 2, 0]} material={wallMat}><planeGeometry args={[d, h]} /></mesh>
      </>}
    </RigidBody>
  );
}

// Sloped ramp connecting two tiers. from/to = TOP-surface endpoints [x,y] (bottom-lower, top-higher). Built as a
// PARALLELOGRAM with VERTICAL end faces (not a tilted box with perpendicular cuts — those poke out and cross the
// platforms). The vertical ends sit flush against the platform vertical faces; ends embed slightly so the solid
// platform bodies occlude them. This is the geometry fix for the ramp↔platform junction.
function RampBeam({ from, to, depth = 2, thick = 0.55, pal = STATION }: { from: [number, number]; to: [number, number]; depth?: number; thick?: number; pal?: Palette }) {
  const dx0 = to[0] - from[0], dy0 = to[1] - from[1];
  const L0 = Math.hypot(dx0, dy0) || 1, ux = dx0 / L0, uy = dy0 / L0;
  // TOP corner lands EXACTLY on the higher platform corner (no overshoot). BOTTOM slides HORIZONTALLY into the
  // lower platform, keeping Y at the lower surface — so the ramp's bottom edge = the lower platform's bottom edge
  // exactly and NEVER pokes below the floor. (The earlier along-slope embed lowered Y → poke-through bug.)
  const bx = Math.sign(dx0) || 1;
  const f: [number, number] = [from[0] - bx * 0.6, from[1]];
  const t: [number, number] = [to[0], to[1]];
  const spanX = (t[0] - f[0]) || 1, slope = (t[1] - f[1]) / spanX;
  const geo = useMemo(() => {
    const s = new THREE.Shape();                 // side-view parallelogram: top slope edge, vertical ends
    s.moveTo(f[0], f[1]); s.lineTo(t[0], t[1]); s.lineTo(t[0], t[1] - thick); s.lineTo(f[0], f[1] - thick); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 1 });
    g.translate(0, 0, -depth / 2);
    // NORMALISE UVs to the ramp's own frame (along-slope 0..1, across-thickness 0..1) so the tread doesn't slide with
    // world position (ExtrudeGeometry's default cap UVs = world x/y → huge repeats at large x = the "sliding" bug).
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const px = pos.getX(i), py = pos.getY(i);
      const along = (px - f[0]) / (spanX || 1);
      const slopeY = f[1] + (px - f[0]) * slope;
      uv.setXY(i, along, (slopeY - py) / (thick || 1));
    }
    uv.needsUpdate = true;
    return g;
  }, [f[0], f[1], t[0], t[1], thick, depth, spanX, slope]);
  // GENERATED ramp tread (anti-slip + neon + hazard baked); tiles along the slope length.
  const treadK = useTexture("/cosmos/kit/ramp_tread.webp");
  // SQUARE tiles: 1 tile spans ~`thick` metres along the slope too, so the diagonal tread + hazard read at their
  // native aspect (no vertical squish = the "differs from the generated asset" bug). One tile across the thickness.
  const panelMat = useMemo(() => { const t = treadK.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(L0 / (thick * 1.6))), 1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: 0.03, metalness: 0.2, roughness: 0.7 }); }, [treadK, L0, thick]);
  // hazard strip runs along the TOP slope edge (fixed vertical height TRIM_H, same as platforms). Built as its own
  // parallelogram at the front face so it's consistent with platform trims.
  const stripGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(f[0], f[1]); s.lineTo(t[0], t[1]); s.lineTo(t[0], t[1] - TRIM_H); s.lineTo(f[0], f[1] - TRIM_H); s.closePath();
    const g = new THREE.ShapeGeometry(s);
    const pos = g.attributes.position, uv = g.attributes.uv;
    const repU = Math.max(1, Math.round(L0 / 0.7));
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), py = pos.getY(i);
      uv.setXY(i, ((px - f[0]) / spanX) * repU, (py - (f[1] + (px - f[0]) * slope) + TRIM_H) / TRIM_H);
    }
    uv.needsUpdate = true; return g;
  }, [f[0], f[1], t[0], t[1], L0, spanX, slope]);
  const haz = useMemo(() => { const tx = hazTexture(pal).clone(); tx.needsUpdate = true; return tx; }, [pal]);
  // COLLIDER = the SAME parallelogram as the mesh (convex hull), so the walk-surface is the slope f→t and the ends
  // are VERTICAL (flush inside the platform boxes). No rotated-box corner poking above the deck at the seam → no
  // depenetration bounce. (Was a tilted CuboidCollider whose corner overshot the slope.)
  const hull = useMemo(() => new Float32Array([
    f[0], f[1], -depth / 2, t[0], t[1], -depth / 2, t[0], t[1] - thick, -depth / 2, f[0], f[1] - thick, -depth / 2,
    f[0], f[1], depth / 2, t[0], t[1], depth / 2, t[0], t[1] - thick, depth / 2, f[0], f[1] - thick, depth / 2,
  ]), [f[0], f[1], t[0], t[1], thick, depth]);
  if (blockout.on) return (
    <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
      <ConvexHullCollider args={[hull]} />
      <Clay geometry={geo} />
    </RigidBody>
  );
  return (
    <RigidBody type="fixed" colliders={false} position={[0, 0, 0]}>
      <ConvexHullCollider args={[hull]} />
      <mesh geometry={geo} material={panelMat} castShadow receiveShadow />
    </RigidBody>
  );
}

// Chest-high cover crate: stand=peek/shoot over, crouch=fully hidden.
function Cover({ x, floorTop, w = 1.7, h = 1.15, depth = 1.5 }: { x: number; floorTop: number; w?: number; h?: number; depth?: number }) {
  const [deck, sideRaw] = useTexture(["/cosmos/tex_deck.webp", "/cosmos/tex_side.webp"]);
  const top = useMemo(() => { const t = deck.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; }, [deck]);
  const side = useMemo(() => { const t = sideRaw.clone(); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; }, [sideRaw]);
  const sideMat = { map: side, emissiveMap: side, emissive: "#ffffff" as const, emissiveIntensity: 0.7, metalness: 0.2, roughness: 0.7, bumpMap: side, bumpScale: 3, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 };
  const cy = floorTop + h / 2;
  if (blockout.on) return (
    <RigidBody type="fixed" colliders={false} position={[x, cy, 0]}>
      <CuboidCollider args={[w / 2, h / 2, depth / 2]} />
      <Clay args={[w, h, depth]} />
    </RigidBody>
  );
  return (
    <RigidBody type="fixed" colliders={false} position={[x, cy, 0]}>
      <CuboidCollider args={[w / 2, h / 2, depth / 2]} />
      <mesh castShadow receiveShadow><boxGeometry args={[w, h, depth]} /><meshStandardMaterial color="#232c44" metalness={0.15} roughness={0.7} /></mesh>
      <mesh position={[0, h / 2 + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, depth]} /><meshStandardMaterial map={top} bumpMap={top} bumpScale={2} metalness={0.1} roughness={0.75} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} /></mesh>
      <mesh position={[0, 0, depth / 2 + 0.01]}><planeGeometry args={[w, h]} /><meshStandardMaterial {...sideMat} /></mesh>
      <mesh position={[0, 0, -depth / 2 - 0.01]} rotation={[0, Math.PI, 0]}><planeGeometry args={[w, h]} /><meshStandardMaterial {...sideMat} /></mesh>
      <mesh position={[w / 2 + 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[depth, h]} /><meshStandardMaterial {...sideMat} /></mesh>
      <mesh position={[-w / 2 - 0.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[depth, h]} /><meshStandardMaterial {...sideMat} /></mesh>
    </RigidBody>
  );
}

// Support pylon: visual-only structural column below a platform edge (masks seams / fills voids).
function Strut({ x, top, h = 7, w = 1.3, z = -0.15 }: { x: number; top: number; h?: number; w?: number; z?: number }) {
  return (
    <group position={[x, top - h / 2 - 0.1, z]}>
      <mesh castShadow><boxGeometry args={[w, h, 1.3]} /><meshStandardMaterial color="#161f36" metalness={0.5} roughness={0.65} /></mesh>
      <mesh position={[0, h / 2 - 0.4, 0.66]}><boxGeometry args={[w * 0.7, 0.1, 0.04]} /><meshStandardMaterial color="#0b1a2a" emissive="#37d0ff" emissiveIntensity={1.2} toneMapped={false} /></mesh>
    </group>
  );
}

// Simple grounded support column under a platform (fills the void so nothing floats). Generated per platform.
function Support({ x, top, floor = -8, w = 2, pal = STATION, tex }: { x: number; top: number; floor?: number; w?: number; pal?: Palette; tex?: string }) {
  const h = top - floor, cy = (top + floor) / 2;
  const endc = useTexture(tex || "/cosmos/kit/sup_side.webp");   // the platform's underside texture (else the default column skin)
  // structural METAL COLUMN under the platform (selectable/hideable as оп·<id>; extend it into a full wall via bh).
  const mat = useMemo(() => { const t = endc.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, Math.max(1, Math.round(h / 3))); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color(0.34, 0.37, 0.42), color: "#9aa4b2", metalness: 0.45, roughness: 0.62 }); }, [endc, h]);
  if (blockout.on) return blockout.decor ? <Clay args={[w, h, 1.4]} position={[x, cy, -0.7]} variant="decor" /> : null;
  return (
    <group position={[x, cy, -0.7]}>
      <mesh material={mat} castShadow receiveShadow><boxGeometry args={[w, h, 1.4]} /></mesh>
      <mesh position={[0, h / 2 - 0.5, 0.71]}><boxGeometry args={[w * 0.7, 0.09, 0.03]} /><meshStandardMaterial color="#0b1a2a" emissive={pal.glow} emissiveIntensity={1.0} toneMapped={false} /></mesh>
    </group>
  );
}
// wall variants available for the platform body / depth (selectable in #studio).
export const WALL_VARIANTS = ["plat_under1", "plat_under2", "plat_under3", "back_panel", "back_hatch", "back_pipes", "back_cargo", "back_reactor", "back_vents"];
const WALL_TILE = 2.7; // one texture MODULE = ~2.7m tall → the wall reads as stacked floor blocks, never stretched
// PLATFORM BODY — the platform's own solid block extended DOWNWARD by `bh` into a tall textured station structure
// (edited live in #studio). The chosen `wall` texture is tiled at a FIXED module density (WALL_TILE) so it never
// stretches — increasing the height just adds more identical modules. FRONT = wall (self-lit), ENDS = sup_side.
function PlatBody({ x, topY, w, bh, wall = "back_panel" }: { x: number; topY: number; w: number; bh: number; wall?: string }) {
  const [face, endc] = useTexture([`/cosmos/kit/${wall}.png`, "/cosmos/kit/sup_side.webp"]);
  const cy = topY - bh / 2;
  const mats = useMemo(() => {
    const ft = face.clone(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(Math.max(1, Math.round(w / 4.5)), Math.max(1, Math.round(bh / WALL_TILE))); ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = 8; ft.needsUpdate = true;
    const et = endc.clone(); et.wrapS = et.wrapT = THREE.RepeatWrapping; et.repeat.set(1, Math.max(1, Math.round(bh / 3))); et.colorSpace = THREE.SRGBColorSpace; et.needsUpdate = true;
    const front = new THREE.MeshStandardMaterial({ map: ft, emissiveMap: ft, emissive: new THREE.Color(0.5, 0.54, 0.6), color: "#aeb7c3", metalness: 0.25, roughness: 0.72 });
    const end = new THREE.MeshStandardMaterial({ map: et, emissiveMap: et, emissive: new THREE.Color(0.36, 0.39, 0.44), color: "#8f99a6", metalness: 0.42, roughness: 0.66 });
    return [end, end, end, end, front, end];
  }, [face, endc, w, bh]);
  return <mesh position={[x, cy, 0]} material={mats} castShadow receiveShadow><boxGeometry args={[w, bh, 1.7]} /></mesh>;
}
// ZERO DECK (нулевой этаж) — ONE cohesive station wall behind the whole lower area: a continuous base pattern across
// the full arena width (UV flows through → not "cards in разнобой") + a central REACTOR CORE zone. Self-lit so it
// reads in the shadowed underdeck. Support columns stand in front of it. NON-collider background.
// ── 2.5D DEPTH (P3): parallax backdrop planes (FAR/MID/FORE) + MID decor props, so the play plane isn't in a void.
// One plane per layer; parallax offsets it opposite the camera's x. Non-colliding, z ≠ 0 (level law L2).
function LayerPlane({ layer, pal }: { layer: ParallaxLayer; pal: Palette }) {
  const grp = useRef<THREE.Group>(null);
  const cam = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const tex = useMemo(() => {
    const t = textureFromSrc(layer.src) ?? backdropTexture(layer.kind, pal);
    // parallax mattes are viewed at a grazing angle + pan constantly → without anisotropy they SHIMMER and read
    // as low-res "shakal". Max anisotropy + mipmaps (TextureLoader default) + SRGB = a clean distant matte.
    if (t) { t.anisotropy = gl.capabilities.getMaxAnisotropy(); t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true; }
    return t;
  }, [layer.src, layer.kind, pal, gl]);
  const dw = layer.kind === "far" ? 120 : layer.kind === "mid" ? 90 : 70, dh = layer.kind === "far" ? 70 : layer.kind === "mid" ? 44 : 40;
  const w = layer.w ?? dw, h = layer.h ?? dh;
  const cy = (layer.oy ?? (layer.kind === "far" ? 12 : layer.kind === "fore" ? 2 : 8));
  useFrame(() => { if (grp.current) grp.current.position.x = -cam.position.x * layer.parallax; });
  return (
    <group ref={grp}>
      <mesh position={[layer.ox ?? 0, cy, layer.z]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent={layer.kind !== "far"} opacity={layer.kind === "fore" ? 0.9 : 1} depthWrite={layer.kind === "far"} toneMapped={false} color={layer.tint ?? "#ffffff"} />
      </mesh>
    </group>
  );
}
function ParallaxLayers({ layers, pal, kinds }: { layers: ParallaxLayer[]; pal: Palette; kinds: ParallaxLayer["kind"][] }) {
  return <>{layers.filter((l) => kinds.includes(l.kind)).map((l) => <LayerPlane key={l.id} layer={l} pal={pal} />)}</>;
}
// MID decor prop: a non-colliding paletted box with an accent light. Fills depth behind the play plane.
function DecorPropMesh({ d, pal }: { d: DecorProp; pal: Palette }) {
  return (
    <group position={[d.x, d.y, d.z]}>
      <mesh castShadow><boxGeometry args={[d.w, d.h, Math.min(d.w, d.h) * 0.8]} /><meshStandardMaterial color={pal.seam} metalness={0.4} roughness={0.7} /><Edges threshold={15} color={pal.glow} /></mesh>
      <mesh position={[0, d.h / 2 - 0.3, Math.min(d.w, d.h) * 0.42]}><boxGeometry args={[d.w * 0.6, 0.08, 0.03]} /><meshStandardMaterial color="#0b1a2a" emissive={pal.glow} emissiveIntensity={1.0} toneMapped={false} /></mesh>
    </group>
  );
}
// ── PROCEDURAL foreground/depth decor: SLENDER 3D pipes (bent tubes) + cable bundles that HANG UNDER platforms.
function ProcPipe({ points, radius = 0.18, z = 0 }: { points: [number, number, number][]; radius?: number; z?: number }) {
  const wrap = useTexture("/cosmos/kit/pipe_wrap.webp");
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, "catmullrom", 0.15), [points]);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 90, radius, 16, false), [curve, radius]);
  // TILE BY REAL LENGTH so the wrap never stretches: 1 tile ≈ one circumference along the run, 1 tile around.
  const mat = useMemo(() => { const t = wrap.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; const len = curve.getLength(); const along = Math.max(2, Math.round(len / (Math.PI * radius * 2))); t.repeat.set(1, along); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: 0.02, metalness: 0.4, roughness: 0.55 }); }, [wrap, curve, radius]);
  const flanges = useMemo(() => [0.25, 0.6, 0.9].map((u) => { const p = curve.getPointAt(u); const tan = curve.getTangentAt(u); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan); return { p, q }; }), [curve, radius]);
  return (
    <group position={[0, 0, z]}>
      <mesh geometry={geo} material={mat} castShadow />
      {flanges.map((f, i) => <mesh key={i} position={f.p} quaternion={f.q} material={mat}><torusGeometry args={[radius * 1.25, radius * 0.28, 8, 20]} /></mesh>)}
    </group>
  );
}
// cables that HANG DOWN from an anchor (under a platform edge), drooping into the gap below.
// variant "signal" = thin dark bundle (cable_wrap); "power" = a couple of thicker orange-hazard lines (cable_pwr).
function ProcCables({ x, y, z = 0.8, count = 4, len = 1.8, variant = "signal" }: { x: number; y: number; z?: number; count?: number; len?: number; variant?: "signal" | "power" }) {
  const [sig, pwr] = useTexture(["/cosmos/kit/cable_wrap.webp", "/cosmos/kit/cable_pwr.webp"]);
  const power = variant === "power";
  const wrap = power ? pwr : sig;
  const n = power ? Math.max(2, Math.round(count / 2)) : count;              // power runs are fewer + fatter
  const baseR = power ? 0.075 : 0.035, jitR = power ? 0.02 : 0.015;
  const items = useMemo(() => Array.from({ length: n }, (_, i) => {
    const ax = x + (i - (n - 1) / 2) * (power ? 0.24 : 0.14), dz = (i - n / 2) * 0.05, ll = len * (0.7 + (i % 3) * 0.22);
    const top = new THREE.Vector3(ax, y, z + dz), bot = new THREE.Vector3(ax + (i % 2 ? 0.28 : -0.22), y - ll, z + dz), mid = new THREE.Vector3((ax + bot.x) / 2 + 0.18, y - ll * (power ? 0.42 : 0.5), z + dz);
    const g = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(top, mid, bot), 26, baseR + (i % 2) * jitR, 7, false);
    const t = wrap.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, Math.max(2, Math.round(ll / (power ? 0.9 : 0.6)))); t.colorSpace = THREE.SRGBColorSpace;
    return { g, m: new THREE.MeshStandardMaterial({ map: t, metalness: power ? 0.2 : 0.1, roughness: 0.85 }) };
  }), [wrap, x, y, z, n, len, power, baseR, jitR]);
  return <group>{items.map((it, i) => <mesh key={i} geometry={it.g} material={it.m} castShadow />)}</group>;
}
// `solid` is the FOREGROUND/BACKGROUND switch for bump-props: SOLID sits on the play plane (z=0, full size, has a
// collider → you clearly bump into it); non-solid RECEDES into depth (−Z) and shrinks, so the player visually never
// looks like they're standing on a piece of pure decoration. So toggling «твёрдый» is instantly, obviously visible.
const DECOR_BACK_Z = -0.85;     // non-solid props sit at the BACK of the deck (behind the z=0 play line the player walks)
const DECOR_BACK_SCALE = 0.72;  // …and shrink, so they read as background and the player never looks like they stand on them
const PLAY_DEPTH = 1.9;         // a SOLID prop spans the play-plane depth (≈ platform deck depth 2) → it reads as an
                                // obstacle ON the walking line, full-width across the deck (not a thin decorative cube)
// reusable textured PROPS sitting on platform decks — a crate (box) and a fuel barrel (cylinder).
function KitCrate({ x, y, s = 1.05, solid = false, z = 0 }: { x: number; y: number; s?: number; solid?: boolean; z?: number }) {
  const [side, top] = useTexture(["/cosmos/kit/crate_side.webp", "/cosmos/kit/crate_top.webp"]);
  const mats = useMemo(() => { for (const t of [side, top]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; } const mk = (m: THREE.Texture) => new THREE.MeshStandardMaterial({ map: m, bumpMap: m, bumpScale: 0.03, metalness: 0.15, roughness: 0.75 }); const sd = mk(side), tp = mk(top); return [sd, sd, tp, mk(side), sd, sd]; }, [side, top]);
  const bg = z < -0.01; // pushed into depth → full-size scenery cube at that z, NO collider (not cover)
  if (bg) return <group position={[x, y + s / 2, z]}><mesh material={mats} castShadow receiveShadow><boxGeometry args={[s, s, s]} /></mesh></group>;
  // SOLID = obstacle on the play plane, stretched across the FULL deck depth (z ≈ platform) so you clearly bump it.
  if (solid) return <RigidBody type="fixed" colliders={false} position={[x, y + s / 2, 0]}><CuboidCollider args={[s / 2, s / 2, PLAY_DEPTH / 2]} /><mesh material={mats} castShadow receiveShadow><boxGeometry args={[s, s, PLAY_DEPTH]} /></mesh></RigidBody>;
  // non-solid = decoration: a small cube, receded to the BACK of the deck.
  const ss = s * DECOR_BACK_SCALE;
  return <group position={[x, y + ss / 2, DECOR_BACK_Z]} scale={DECOR_BACK_SCALE}><mesh material={mats} castShadow receiveShadow><boxGeometry args={[s, s, s]} /></mesh></group>;
}
function KitBarrel({ id, x, y, r = 0.48, h = 1.1, solid = false, explosive = false, bkind = "frag", z = 0 }: { id?: string; x: number; y: number; r?: number; h?: number; solid?: boolean; explosive?: boolean; bkind?: "frag" | "cryo"; z?: number }) {
  const [side, top] = useTexture(["/cosmos/kit/barrel_side.webp", "/cosmos/kit/barrel_top.webp"]);
  // The barrel TEXTURE already IS the hazard-red art — do NOT flat-recolor it (a `color` multiply washed the texture
  // into cheap plastic). frag keeps the texture TRUE (white tint) and reads as "shoot me" via an emissiveMap self-glow
  // that lights only the texture's OWN bright hazard marks (not a flat wash). cryo has no dedicated art yet → a light
  // icy tint + blue glow reskins the red barrel until a cryo texture exists.
  const mats = useMemo(() => {
    for (const t of [side, top]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; }
    const sd = side.clone(); sd.wrapS = sd.wrapT = THREE.RepeatWrapping; sd.repeat.set(2, 1); sd.colorSpace = THREE.SRGBColorSpace;
    const cryo = explosive && bkind === "cryo";
    const col = cryo ? "#a6ccff" : "#ffffff";                        // frag: texture speaks for itself; cryo: light icy tint
    const emi = !explosive ? "#000000" : cryo ? "#2f7bff" : "#ff3a1e"; // subtle red/blue self-glow
    const ei = explosive ? (cryo ? 0.42 : 0.28) : 0;
    const mk = (m: THREE.Texture) => new THREE.MeshStandardMaterial({ map: m, color: col, emissive: emi, emissiveMap: explosive ? m : null, emissiveIntensity: ei, metalness: 0.15, roughness: 0.75 });
    return [mk(sd), mk(top), mk(top)];
  }, [side, top, explosive, bkind]);
  const mesh = <mesh material={mats} castShadow receiveShadow><cylinderGeometry args={[r, r, h, 24]} /></mesh>;
  const cy = y + h / 2;
  if (z < -0.01) return <group position={[x, cy, z]}>{mesh}</group>; // pushed into depth → scenery, no collider
  // EXPLOSIVE/CRYO: solid + registered in combat so bullets detonate it. `alive` drives BOTH the mesh AND the collider
  // (React state) → after it blows up the collider UNMOUNTS too, so you can walk through the gap (was: mesh hidden but
  // the sibling collider stayed = invisible wall). It remounts on respawn.
  const barRef = useRef<ReturnType<typeof registerBarrel> | null>(null);
  const [alive, setAlive] = useState(true);
  const bid = id ?? `bar:${x.toFixed(2)}:${cy.toFixed(2)}`;
  useEffect(() => { if (!explosive) return; barRef.current = registerBarrel(bid, x, cy, Math.max(r, 0.55), bkind); return () => unregisterBarrel(bid); }, [explosive, bid, x, cy, r, bkind]);
  useFrame(() => { if (!explosive) return; const bar = barRef.current; if (!bar) return; if (!bar.alive && performance.now() >= bar.respawnAt) bar.alive = true; setAlive(bar.alive); /* setState bails out if unchanged → no re-render spam */ });
  if (explosive) return <RigidBody type="fixed" colliders={false} position={[x, cy, 0]}>{alive && <CuboidCollider args={[r, h / 2, PLAY_DEPTH / 2]} />}<group visible={alive}>{mesh}</group></RigidBody>;
  // SOLID barrel: keep it round but give the collider the full deck depth so you can't slip past it in Z.
  if (solid) return <RigidBody type="fixed" colliders={false} position={[x, cy, 0]}><CuboidCollider args={[r, h / 2, PLAY_DEPTH / 2]} />{mesh}</RigidBody>;
  const hh = h * DECOR_BACK_SCALE;
  return <group position={[x, y + hh / 2, DECOR_BACK_Z]} scale={DECOR_BACK_SCALE}>{mesh}</group>;
}
// each-frame tick that applies jump-pad launches + teleporter relocations to overlapping fighters (data flags → body).
function MoverTick() { useFrame(() => tickMovers()); return null; }

// ── MAP MOVERS: jump-pad (launch up), teleporter (pad → partner), lift (moving platform). ──────────────────────
// JUMP-PAD: a wide ROUNDED spring CUSHION (a squashed dome membrane on a rim base). It idle-LEVITATES (breathes), and
// on launch it SQUASHES then springs back with a rising SHOCKWAVE ring + chevron burst. Toned-down glow (no blowout).
// Wider than a platform beam so it reads as a clear "bounce here" zone. Launch logic unchanged (registerJumpPad).
function JumpPad({ id, x, y, r = 1.3, vy = 20 }: { id: string; x: number; y: number; r?: number; vy?: number }) {
  const spring = useRef<THREE.Group>(null);   // squash/stretch container (cushion + chevrons)
  const shock = useRef<THREE.Mesh>(null);      // expanding launch ring
  const domeMat = useRef<THREE.MeshStandardMaterial>(null!);
  const chevs = useRef<THREE.Group>(null);
  const [top, side] = useTexture(["/cosmos/kit/jumppad_top.webp", "/cosmos/kit/jumppad_side.webp"]);
  useEffect(() => { registerJumpPad(id, x, y, r, vy); return () => unregisterMover(id); }, [id, x, y, r, vy]);
  const W = r * 1.6, DEPTH = r * 1.25, rimH = 0.26, cushH = 0.55;
  const domeMatM = useMemo(() => { top.colorSpace = THREE.SRGBColorSpace; const m = new THREE.MeshStandardMaterial({ map: top, emissiveMap: top, emissive: new THREE.Color("#5fd0ff"), emissiveIntensity: 0.35, bumpMap: top, bumpScale: 0.03, metalness: 0.15, roughness: 0.45 }); domeMat.current = m; return m; }, [top]);
  const rimMat = useMemo(() => { side.colorSpace = THREE.SRGBColorSpace; const t = side.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(2, Math.round(W / 1.4)), 1); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: 0.02, metalness: 0.4, roughness: 0.6 }); }, [side, W]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime(), since = (performance.now() - jumpPadFiredAt(id)) / 1000;
    // idle levitate breathing + spring squash-then-overshoot on fire (damped)
    let sy = 1 + 0.06 * Math.sin(t * 2.4);
    if (since < 0.7) { const s = since / 0.7; sy = 1 - 0.45 * Math.exp(-9 * s) + 0.3 * Math.exp(-4 * s) * Math.cos(s * 20); }
    if (spring.current) spring.current.scale.y = Math.max(0.35, sy);
    if (domeMat.current) domeMat.current.emissiveIntensity = 0.28 + 0.12 * (0.5 + 0.5 * Math.sin(t * 3)) + (since < 0.5 ? (0.5 - since) * 1.6 : 0);
    // chevron telegraph rising + fading (idle)
    if (chevs.current) { const p = (t * 0.8) % 1; chevs.current.position.y = 0.55 + p * 0.28; chevs.current.children.forEach((c, i) => ((c as any).material.opacity = (0.72 - i * 0.16) * (0.5 + 0.5 * Math.cos((p - 0.15 * i) * Math.PI * 2)))); }
    // shockwave ring: expands upward + fades on launch
    if (shock.current) {
      const on = since < 0.55; shock.current.visible = on;
      if (on) { const s = since / 0.55, sc = 0.55 + s * 1.35; shock.current.scale.set(sc, sc, sc); shock.current.position.y = 0.08 + s * 0.55; (shock.current.material as any).opacity = (1 - s) * (1 - s) * 0.5; }
    }
  });
  return (
    <group position={[x, y + 0.02, 0.5]}>
      {/* rim / spring base */}
      <mesh material={rimMat} castShadow receiveShadow position={[0, rimH / 2, 0]}><cylinderGeometry args={[W / 2, W / 2 * 1.08, rimH, 28]} /></mesh>
      {/* springy container: cushion dome + chevrons squash together */}
      <group ref={spring} position={[0, rimH, 0]}>
        {/* ROUNDED cushion = a wide squashed hemisphere (curved top) */}
        <mesh material={domeMatM} castShadow receiveShadow scale={[W / 2, cushH, DEPTH / 2]}><sphereGeometry args={[1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <group ref={chevs}>
          {[0, 0.18, 0.36].map((dy, i) => <mesh key={i} position={[0, dy, 0.05]} rotation={[0, 0, 0]}><coneGeometry args={[0.19, 0.26, 3]} /><meshBasicMaterial color="#8fe8ff" toneMapped={false} transparent opacity={0.72 - i * 0.16} /></mesh>)}
        </group>
      </group>
      {/* launch shockwave ring */}
      <mesh ref={shock} visible={false} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.6, 0.68, 32]} /><meshBasicMaterial color="#8fe8ff" toneMapped={false} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <pointLight color="#5fd0ff" intensity={1.1} distance={3.5} position={[0, 0.6, 0]} />
    </group>
  );
}
// TELEPORTER: a glowing portal that relocates a fighter to its partner pad. BALANCE: after a use the pad (+ its
// partner) recharge for a few seconds → the portal DIMS + its swirl stops while offline, then brightens back. So you
// can't bounce back and forth; it's a periodic route, not a spam button.
function Teleporter({ id, x, y, tx, ty, pair, r = 1.0, accent = "#c084ff" }: { id: string; x: number; y: number; tx: number; ty: number; pair: string; r?: number; accent?: string }) {
  const swirl = useRef<THREE.Mesh>(null);
  const grp = useRef<THREE.Group>(null);
  const gate = useRef<THREE.Mesh>(null);
  const ring = useRef<any>(null);
  const light = useRef<any>(null);
  const off = useMemo(() => new THREE.Color("#3a3550"), []);
  const accentCol = useMemo(() => new THREE.Color(accent), [accent]); // PERF: hoisted — was `new THREE.Color` every frame
  useEffect(() => { registerTeleporter(id, x, y, r, tx, ty, pair); return () => unregisterMover(id); }, [id, x, y, r, tx, ty, pair]);
  useFrame((_, dt) => {
    const ready = teleporterReady(id);
    if (swirl.current && ready) swirl.current.rotation.y += dt * 2.2; // swirl only when charged
    const em = ready ? 1.0 : 0.15;
    if (gate.current) { (gate.current.material as any).emissive.copy(ready ? accentCol : off); (gate.current.material as any).emissiveIntensity = em; }
    const op = ready ? 0.9 : 0.22;
    if (ring.current) ring.current.material.opacity = op;
    if (light.current) light.current.intensity = ready ? 2.4 : 0.4;
  });
  return (
    <group ref={grp} position={[x, y + 0.02, 0.4]}>
      <mesh ref={gate} rotation={[-Math.PI / 2, 0, 0]}><cylinderGeometry args={[r, r * 1.05, 0.1, 24]} /><meshStandardMaterial color="#0b0a1a" emissive={accent} emissiveIntensity={1.0} metalness={0.3} roughness={0.5} /></mesh>
      <mesh ref={swirl} position={[0, 1.1, 0]}><torusGeometry args={[r * 0.7, 0.08, 10, 32]} /><meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.9} /></mesh>
      <mesh ref={ring} position={[0, 1.1, -0.02]}><circleGeometry args={[r * 0.62, 24]} /><meshBasicMaterial color={accent} toneMapped={false} transparent opacity={0.32} side={THREE.DoubleSide} /></mesh>
      <pointLight ref={light} color={accent} intensity={2.4} distance={4.5} position={[0, 1.1, 0]} />
    </group>
  );
}
// LIFT: motion TIMING is owned by combat.tickMovers (always runs → never stalls; writes combat.liftY[id]). The deck
// carries a real MOVING KINEMATIC collider that follows liftY, so the physics does the work: the rider rides via the
// Fighter's surface-track (the down-ray sees the deck like a ramp), a jumper bonks his head on the underside, and the
// side blocks — all from the solver. combat only detects the descending CRUSH (kill). No carry-snap (that + a collider
// was what catapulted the rider — the collider ALONE is fine).
function Lift({ id, x, y, w = 4, rise = 3.4, speed = 0.9, pal = STATION }: { id: string; x: number; y: number; w?: number; rise?: number; speed?: number; pal?: Palette }) {
  const rb = useRef<RapierRigidBody>(null);
  const thr = useRef<THREE.Group>(null);  // underside thruster — only shown while airborne (hidden on the ground)
  const th = 0.6, baseY = worldTop(y) + th; // deck TOP rests a deck-thickness above the floor → its body sits ON the ground, never sinks below it
  const [deck, side] = useTexture(["/cosmos/kit/lift_deck.webp", "/cosmos/kit/plat_side.webp"]);
  useEffect(() => { registerLift(id, x, w, baseY, rise, speed); return () => unregisterLift(id); }, [id, x, baseY, w, rise, speed]);
  useFrame(() => {
    const deckTop = liftY[id]; if (deckTop == null) return;
    rb.current?.setNextKinematicTranslation({ x, y: deckTop - th / 2, z: 0 }); // kinematic body drives the collider + visual
    if (thr.current) thr.current.visible = deckTop > baseY + 0.35; // hide the under-deck glow/particles when resting on the floor (else they poke through the ground)
  });
  // DECK faces: lift_deck (top, 1:1 arrows) + plat_side (flanks) + sup_side (ends). RAILS: static sup_side stanchions.
  const deckMats = useMemo(() => {
    for (const t of [deck, side]) t.colorSpace = THREE.SRGBColorSpace;
    const s = side.clone(); s.wrapS = s.wrapT = THREE.RepeatWrapping; s.repeat.set(Math.max(1, Math.round(w / 2)), 1); s.needsUpdate = true;
    const topM = new THREE.MeshStandardMaterial({ map: deck, bumpMap: deck, bumpScale: 0.03, metalness: 0.3, roughness: 0.6 });
    const sideM = new THREE.MeshStandardMaterial({ map: s, bumpMap: s, bumpScale: 0.02, metalness: 0.35, roughness: 0.6 });
    const end = new THREE.MeshStandardMaterial({ map: side, metalness: 0.35, roughness: 0.6 });
    return [end, end, topM, sideM, sideM, sideM]; // +x,-x,+y(deck),-y,+z(front),-z
  }, [deck, side, w]);
  // ANTI-GRAV floating platform — no stanchions (they read cheap). MOVING deck (lift_deck top) + underside thruster
  // glow + rising energy sparkles that "hold it up". Everything moves with the kinematic body.
  return (
    <RigidBody ref={rb} type="kinematicPosition" colliders={false} position={[x, baseY - th / 2, 0]}>
      {/* MOVING collider = the deck box (matches boxGeometry) → real ride / head-bonk / side block via the solver. */}
      <CuboidCollider args={[w / 2, th / 2, PLAY_DEPTH / 2]} />
      <mesh material={deckMats} castShadow receiveShadow><boxGeometry args={[w, th, PLAY_DEPTH]} /></mesh>
      <mesh position={[0, th / 2 + 0.02, 0]}><boxGeometry args={[w + 0.08, 0.06, PLAY_DEPTH + 0.08]} /><meshStandardMaterial color="#2a333f" metalness={0.5} roughness={0.5} /></mesh>
      {/* underside anti-grav thruster (hidden on the ground) — glow disc + sparkles hugging the deck bottom */}
      <group ref={thr}>
        <mesh position={[0, -th / 2 - 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w * 0.9, PLAY_DEPTH * 0.9]} /><meshBasicMaterial color={pal.glow} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
        <Sparkles count={30} scale={[w * 0.8, 0.9, PLAY_DEPTH * 0.8]} position={[0, -0.55, 0]} size={4} speed={0.7} noise={0.5} color={pal.glow} />
        <pointLight color={pal.glow} intensity={2} distance={3.5} position={[0, -0.4, 0]} />
      </group>
    </RigidBody>
  );
}

// atmosphere decor: slim pipes at the frame edges + a depth pipe, cable bundles hanging UNDER raised platforms,
// and reusable crates/barrels standing on the platform decks — now all as editable doc props (see defaultDecor + KitProp).
// ── GLB LANDMARK model (background scenery: towers / dishes / cranes generated in Meshy) ──────────────────────────
// Loads a compressed .glb by path OR an uploaded data-URL. Non-colliding — it's a backdrop prop, not gameplay cover.
// Clone per instance so the same model can be placed many times (shared geometry = cheap). Missing/broken file →
// a wireframe placeholder in the EDITOR (so it's still selectable/movable), nothing in-game.
function GlbModel({ url, scale, ry }: { url: string; scale: number; ry: number }) {
  const { scene } = useGLTF(url);
  const obj = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={obj} scale={scale} rotation={[0, ry, 0]} />;
}
class ModelErr extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() { return this.state.err ? this.props.fallback : this.props.children; }
}
function ModelProp({ d, editable }: { d: DecorProp; editable?: boolean }) {
  const ph = editable ? (
    <mesh><boxGeometry args={[d.w || 3, d.h || 6, (d.w || 3) * 0.6]} /><meshStandardMaterial color="#4a5666" wireframe transparent opacity={0.5} /></mesh>
  ) : null;
  return (
    <group position={[d.x, d.y, d.z]}>
      {d.src
        ? <ModelErr key={d.src} fallback={ph}><Suspense fallback={ph}><GlbModel url={d.src} scale={d.scale ?? 1} ry={d.ry ?? 0} /></Suspense></ModelErr>
        : ph}
    </group>
  );
}
// renders ONE decor prop by its type — every one of these is a draggable/editable doc object (nothing hard-coded).
function KitProp({ d, pal, editable }: { d: DecorProp; pal: Palette; editable?: boolean }) {
  switch (d.type) {
    case "model": return <ModelProp d={d} editable={editable} />;
    case "crate": return <KitCrate x={d.x} y={d.y} s={d.w} solid={d.solid} z={d.z} />;
    case "barrel": return <KitBarrel id={d.id} x={d.x} y={d.y} r={d.r ?? 0.48} h={d.h ?? 1.1} solid={d.solid || d.explosive || d.cryo} explosive={d.explosive || d.cryo} bkind={d.cryo ? "cryo" : "frag"} z={d.z} />;
    case "pipe": { const half = (d.w || 6) / 2; const pts: [number, number, number][] = d.dir === "v" ? [[d.x, d.y - half, 0], [d.x, d.y + half, 0]] : [[d.x - half, d.y, 0], [d.x + half, d.y, 0]]; return <ProcPipe points={pts} radius={d.r ?? 0.18} z={d.z} />; }
    case "cable": return <ProcCables x={d.x} y={d.y} z={d.z} count={d.count ?? 4} len={d.len ?? 1.8} variant={d.variant ?? "signal"} />;
    case "jumppad": return <JumpPad id={d.id} x={d.x} y={d.y} r={d.r ?? 1.1} vy={d.power ?? 20} />;
    case "teleport": return <Teleporter id={d.id} x={d.x} y={d.y} tx={d.r ?? d.x} ty={d.len ?? d.y} pair={d.pair ?? d.id} r={0.9} accent={pal.glow} />;
    case "lift": return <Lift id={d.id} x={d.x} y={d.y} w={d.w || 4} rise={d.rise ?? 3.6} speed={d.speed ?? 1.6} pal={pal} />;
    default: return <DecorPropMesh d={d} pal={pal} />;
  }
}
function DecorProps({ decor, defStyle, editable }: { decor: DecorProp[]; defStyle: StyleId; editable?: boolean }) {
  return <>{decor.map((d) => <KitProp key={d.id} d={d} pal={paletteOf(d.style ?? defStyle)} editable={editable} />)}</>;
}

// The playable blockout — GENERATED from the single-source layout (src/game/levels/layout.ts). What #ld validates
// as reachable is exactly what renders here: platforms, ramps and ladders all come from the same data, so there
// are no impossible gaps by construction. Assets (bases/banner/decals/backdrop) are layered on top later.
// editable (studio): render EXACTLY the doc's objects — no phantom auto-decor. So what you see is what you can select
// and delete (WYSIWYG). The game (editable=false) keeps the auto-default decor fallback for arenas that seed none.
// ARENA BOUNDS — invisible SOLID walls just outside the level's left/right extent, tall enough you can't jump out.
// Keeps the player inside the playable area (no falling off the sides into the void). In-game only (not the editor).
function ArenaBounds({ plats }: { plats: Plat[] }) {
  const walk = plats.filter((p) => !p.z && !p.ry);
  if (!walk.length) return null;
  const minX = Math.min(...walk.map((p) => p.x - p.w / 2)) - 0.6;
  const maxX = Math.max(...walk.map((p) => p.x + p.w / 2)) + 0.6;
  const H = 28, cy = worldTop(0) + H / 2 - 3;                     // from just below the floor up ~25m
  const Wall = ({ x }: { x: number }) => (
    <RigidBody type="fixed" colliders={false} position={[x, cy, 0]}><CuboidCollider args={[0.4, H / 2, 2.2]} /></RigidBody>
  );
  return <><Wall x={minX} /><Wall x={maxX} /></>;
}
export function CosmosArena({ doc = getDefaultDoc(), editable = false }: { doc?: LevelDoc; editable?: boolean }) {
  const all = { plats: doc.plats, links: doc.links };
  const hidden = [...blockout.hidden, ...(doc.hidden ?? [])];              // blockout debug hides + user-hidden generated parts (supports)
  const plats = all.plats.filter((p) => !hidden.includes(p.id));           // debug: skip hidden blocks (+ their supports)
  const bg = new Set(plats.filter((p) => p.z).map((p) => p.id));           // background depth-decor platforms (not walkable)
  // decor props come from the doc (all draggable/editable). In the EDITOR, never fall back to auto-decor (those props
  // aren't doc objects → couldn't be selected/deleted = the "фантомные бочки" bug). In-game, empty decor → auto set.
  const decor = doc.decor.length || editable ? doc.decor : defaultDecor(plats);
  // ramps/ladders only connect WALKABLE platforms — never draw a link into a background depth platform.
  const links = all.links.filter((l) => !hidden.includes(l.a) && !hidden.includes(l.b) && !bg.has(l.a) && !bg.has(l.b));
  // publish THIS level's ladder climb-zones to the Fighter (so ladders climb on custom maps, not just the default).
  setLadders(genLadderZones(hidden, { plats, links }));
  const byId = new Map(plats.map((p) => [p.id, p]));
  // per-object palette: skin override (doc.skins[id]) else the level's meta.style → each block can look different.
  const paletteFor = (id: string): Palette => paletteOf((doc.skins[id] as StyleId) ?? doc.meta.style);
  return (
    <>
      {/* FAR + MID backdrop behind the play plane */}
      <ParallaxLayers layers={doc.layers} pal={paletteOf(doc.meta.style)} kinds={["far", "mid"]} />
      <MoverTick />
      <DecorProps decor={decor} defStyle={doc.meta.style} editable={editable} />
      {!editable && <ArenaBounds plats={plats} />}
      <Ladders hidden={hidden} layout={{ plats, links }} paletteFor={paletteFor} />
      {/* platforms + their grounding supports */}
      {plats.map((p) => {
        const th = THICK[p.kind ?? "mid"] ?? 0.6;
        const top = worldTop(p.y), bottom = top - th;
        const walk = !p.z;                       // z≠0 → background depth-decor platform (no collider, no supports)
        const sw = p.kind === "high" ? 5 : p.kind === "ground" ? 6 : Math.min(p.w * 0.5, 2.6);
        const floor = p.kind === "island" ? worldTop(0) : -8; // island pillar stands on the ground; others reach down
        const noSupport = !walk || p.kind === "bridge"; // bridge/background: no central pillar
        const supHidden = hidden.includes(`sup:${p.id}`);
        const pal = paletteFor(p.id);
        return (
          <group key={p.id}>
            {walk && p.bh ? <PlatBody x={p.x} topY={bottom + 0.05} w={p.w} bh={p.bh} wall={p.wall} /> : null}
            <CleanBeam w={p.w} h={th} x={p.x} y={top - th / 2} z={p.z ?? 0} rx={p.rx} ry={p.ry} rz={p.rz} round={p.round} depth={p.depth} solid={walk} pal={pal} deckTex={p.deckTex} sideTex={p.sideTex} />
            {!noSupport && !supHidden && !p.bh && <Support x={p.x} top={bottom + 0.05} floor={floor} w={sw} pal={pal} tex={p.sideTex} />}
            {walk && p.kind === "ground" && !supHidden && !p.bh && [-13, 13].map((fx) => <Support key={fx} x={fx} top={bottom + 0.05} w={2.6} pal={pal} tex={p.sideTex} />)}
          </group>
        );
      })}
      {/* ramps from the ramp links — bottom rests ON the lower platform, rises across the gap onto the higher
          platform's near edge at a gentle ~26° slope (like the reference). This IS the height transition. */}
      {links.filter((l) => l.kind === "ramp" && !hidden.includes(`ramp:${l.a}-${l.b}`)).map((l, i) => {
        const a = byId.get(l.a), b = byId.get(l.b);
        if (!a || !b) return null;
        const g = rampGeom(a, b);
        const f: [number, number] = [g.from[0], worldTop(g.from[1])], t: [number, number] = [g.to[0], worldTop(g.to[1])];
        return <RampBeam key={"r" + i} from={f} to={t} thick={BEAM} pal={paletteFor(`ramp:${l.a}-${l.b}`)} />;
      })}
      {/* procedural atmosphere decor (pipes + hanging cables) — textured mode only, framed to the arena width */}
      {/* FORE framing in front of the play plane */}
      <ParallaxLayers layers={doc.layers} pal={paletteOf(doc.meta.style)} kinds={["fore"]} />
    </>
  );
}

// exported so future maps can reuse the kit
export { Floor, CleanBeam, RampBeam, Cover, Strut, LadderMesh, Lift, MoverTick };

