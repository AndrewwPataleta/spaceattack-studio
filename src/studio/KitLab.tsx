// #kit — ASSET viewer for the generated kit textures (public/cosmos/kit/*). Shows a rotatable 3D CRATE built from
// our crate_side/crate_top (+ bumpMap) to prove the pipeline (flat PNG faces → procedural box), plus a library grid
// of every generated texture (read from _manifest.json — slot, model, size, cost) with a big preview on click.
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture, RoundedBox, Sparkles } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { T, btn, card } from "./theme";
import { AnimGate } from "../arena/AnimGate";
import { FarCity } from "../arena/FarCity";

type Item = { slot: string; model?: string; size?: string; costUSD?: number; ts?: string };

// a procedural box wearing our generated face textures (side on 4 walls, top on the lid) — the core pipeline demo.
function CrateBox({ bump }: { bump: boolean }) {
  const [side, top] = useTexture(["/cosmos/kit/crate_side.webp", "/cosmos/kit/crate_top.webp"]);
  const mats = useMemo(() => {
    for (const t of [side, top]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; }
    const mk = (map: THREE.Texture) => new THREE.MeshStandardMaterial({ map, bumpMap: bump ? map : null, bumpScale: bump ? 0.06 : 0, metalness: 0.15, roughness: 0.75 });
    const s = mk(side), tp = mk(top);
    return [s, s, tp, mk(side), s, s]; // BoxGeometry face order: +x,-x,+y,-y,+z,-z
  }, [side, top, bump]);
  return (
    <mesh material={mats} castShadow>
      <boxGeometry args={[2.2, 2.2, 2.2]} />
    </mesh>
  );
}

function TexturePlane({ slot }: { slot: string }) {
  const tex = useTexture(`/cosmos/kit/${slot}.png`);
  useMemo(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex; }, [tex]);
  return <mesh><planeGeometry args={[3, 3]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>;
}

// a LONG walkable BEAM (platform) — deck on top, side panel (cyan strip + hazard) tiled along the length, bump relief.
function BeamBox({ bump, len = 4.5 }: { bump: boolean; len?: number }) {
  const [deck, sideRaw] = useTexture(["/cosmos/kit/plat_deck.webp", "/cosmos/kit/plat_side.webp"]);
  const mats = useMemo(() => {
    const tile = (src: THREE.Texture, rx: number) => { const t = src.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, 1); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t; };
    const rep = Math.max(1, Math.round(len / 2));
    const top = tile(deck, rep), side = tile(sideRaw, rep), end = tile(sideRaw, 1);
    const mk = (map: THREE.Texture) => new THREE.MeshStandardMaterial({ map, bumpMap: bump ? map : null, bumpScale: bump ? 0.05 : 0, metalness: 0.2, roughness: 0.7 });
    const s = mk(side);
    return [mk(end), mk(end), mk(top), mk(tile(deck, rep)), s, s]; // +x,-x,+y(top),-y,+z,-z
  }, [deck, sideRaw, bump, len]);
  return <mesh material={mats} castShadow receiveShadow><boxGeometry args={[len, 0.9, 2.2]} /></mesh>;
}

const tune = (t: THREE.Texture, rx = 1, ry = 1) => { const c = t.clone(); c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rx, ry); c.colorSpace = THREE.SRGBColorSpace; c.anisotropy = 8; c.needsUpdate = true; return c; };
const std = (map: THREE.Texture, bump: boolean, m = 0.2, r = 0.7) => new THREE.MeshStandardMaterial({ map, bumpMap: bump ? map : null, bumpScale: bump ? 0.045 : 0, metalness: m, roughness: r });

// a flat painted DECAL with alpha (how 2.5D games do ladders / cables / pipes): the PNG is cut out on transparency
// and shown on a plane; in-game it sits in front of the play plane for foreground depth. ratio = width/height.
function Decal({ slot, ratio, h = 4.4 }: { slot: string; ratio: number; h?: number }) {
  const tex = useTexture(`/cosmos/kit/${slot}.png`);
  useMemo(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex; }, [tex]);
  return <mesh><planeGeometry args={[h * ratio, h]} /><meshBasicMaterial map={tex} transparent alphaTest={0.5} toneMapped={false} side={THREE.DoubleSide} /></mesh>;
}

// RAMP — a tilted beam: tread on the slope face, side panel on the flanks.
function RampBox({ bump }: { bump: boolean }) {
  const [tread, side] = useTexture(["/cosmos/kit/ramp_tread.webp", "/cosmos/kit/plat_side.webp"]);
  const len = 6;
  const mats = useMemo(() => { const rep = Math.max(1, Math.round(len / 2)); const s = std(tune(side, rep, 1), bump); return [s, s, std(tune(tread, rep, 1), bump), s, s, s]; }, [tread, side, bump]);
  return <mesh material={mats} rotation={[0, 0, -0.42]} castShadow receiveShadow><boxGeometry args={[len, 0.7, 2.2]} /></mesh>;
}

// PROCEDURAL PIPE — a real 3D tube along a bent path (elbow), wrapped with the tileable pipe texture + flange rings.
function ProcPipe({ bump }: { bump: boolean }) {
  const wrap = useTexture("/cosmos/kit/pipe_wrap.webp");
  const mat = useMemo(() => { const t = wrap.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 4); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, bumpMap: bump ? t : null, bumpScale: bump ? 0.02 : 0, metalness: 0.3, roughness: 0.6 }); }, [wrap, bump]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(-0.2, 2.4, 0), new THREE.Vector3(-0.2, 0.2, 0), new THREE.Vector3(0.2, -0.2, 0), new THREE.Vector3(2.4, -0.2, 0)], false, "catmullrom", 0.15), []);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 64, 0.2, 22, false), [curve]);
  const flanges = useMemo(() => [0.14, 0.46, 0.82].map((u) => { const p = curve.getPointAt(u); const tan = curve.getTangentAt(u); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan); return { p, q }; }), [curve]);
  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      {flanges.map((f, i) => <mesh key={i} position={f.p} quaternion={f.q} material={mat}><torusGeometry args={[0.37, 0.07, 12, 26]} /></mesh>)}
    </group>
  );
}
// PROCEDURAL CABLES — a bundle of drooping festoon wires (catenary tubes) wrapped in the cable texture.
function ProcCables() {
  const wrap = useTexture("/cosmos/kit/cable_wrap.webp");
  const mats = useMemo(() => Array.from({ length: 7 }, () => { const t = wrap.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 5); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, metalness: 0.1, roughness: 0.85 }); }), [wrap]);
  const geos = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const z = (i - 3) * 0.06, sag = 1.5 + (i % 3) * 0.55, spread = (i - 3) * 0.42;
    const a = new THREE.Vector3(-0.25, 1.9, z), b = new THREE.Vector3(spread, 1.9, z), mid = new THREE.Vector3((a.x + b.x) / 2, 1.9 - sag, z);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    return new THREE.TubeGeometry(curve, 40, 0.045 + (i % 2) * 0.02, 8, false);
  }), []);
  return <group>{geos.map((g, i) => <mesh key={i} geometry={g} material={mats[i]} castShadow />)}</group>;
}

// PILLAR — a tall structural support box wrapped in sup_side, tiled vertically (bolt pitch) along its height.
function PillarBox({ bump, h = 3.2 }: { bump: boolean; h?: number }) {
  const side = useTexture("/cosmos/kit/sup_side.webp");
  const mats = useMemo(() => {
    const ry = Math.max(1, Math.round(h / 2.5)); // vertical tile = height / bolt-pitch (~2.5m)
    const s = std(tune(side, 1, ry), bump, 0.25, 0.65);
    const cap = std(tune(side, 1, 1), bump, 0.25, 0.65);
    return [s, s, cap, cap, s, s]; // +x,-x,+y,-y,+z,-z
  }, [side, bump, h]);
  return <mesh material={mats} castShadow receiveShadow><boxGeometry args={[0.9, h, 0.9]} /></mesh>;
}

// RAILING DEPTH DEMO — shows the parallax layering: a front walkable platform, a guard RAILING sitting just
// behind it, and a muted second echelon further back (darkened railing + beam) — the "fence" that gives depth.
function RailPlane({ z, y, w, tint, opacity = 1 }: { z: number; y: number; w: number; tint: string; opacity?: number }) {
  const tex = useTexture("/cosmos/kit/bg_railing.webp");
  useMemo(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex; }, [tex]);
  return <mesh position={[0, y, z]}><planeGeometry args={[w, w]} /><meshBasicMaterial map={tex} transparent alphaTest={0.35} opacity={opacity} color={tint} toneMapped={false} side={THREE.DoubleSide} /></mesh>;
}
function RailingDepth({ bump }: { bump: boolean }) {
  return (
    <group>
      {/* far muted echelon — darkened structure behind (atmospheric perspective) */}
      <RailPlane z={-4.2} y={0.35} w={9} tint="#5a6572" opacity={0.85} />
      <group position={[0, -0.5, -3]} scale={0.9}><BeamBox bump={bump} len={5} /></group>
      {/* the guard railing STANDING on the back edge of the play platform (posts on the deck, not floating) */}
      <RailPlane z={-1.05} y={0.15} w={7} tint="#9aa6b4" />
      {/* front walkable platform (play plane) */}
      <group position={[0, -0.55, 0.4]}><BeamBox bump={bump} len={4.5} /></group>
    </group>
  );
}

// PICKUP — a small SPINNING procedural cube (RoundedBox) wearing pickup_shell on every face; the centre holo-slot
// glows the effect COLOR (code-tinted) with a code-drawn effect ICON (cross/shield/bolt). One shell → every boost.
function PickupFaces({ kind }: { kind: string }) {
  const icon = useTexture(`/cosmos/kit/pickup_ic_${kind}.png`);
  useMemo(() => { icon.colorSpace = THREE.SRGBColorSpace; icon.anisotropy = 8; return icon; }, [icon]);
  const d = 0.437;
  const faces: [THREE.Vector3, THREE.Euler][] = [
    [new THREE.Vector3(0, 0, d), new THREE.Euler(0, 0, 0)],
    [new THREE.Vector3(0, 0, -d), new THREE.Euler(0, Math.PI, 0)],
    [new THREE.Vector3(d, 0, 0), new THREE.Euler(0, Math.PI / 2, 0)],
    [new THREE.Vector3(-d, 0, 0), new THREE.Euler(0, -Math.PI / 2, 0)],
    [new THREE.Vector3(0, d, 0), new THREE.Euler(-Math.PI / 2, 0, 0)],
    [new THREE.Vector3(0, -d, 0), new THREE.Euler(Math.PI / 2, 0, 0)],
  ];
  return (
    <group>
      {faces.map(([p, r], i) => (
        <mesh key={i} position={p} rotation={r}><planeGeometry args={[0.6, 0.6]} /><meshBasicMaterial map={icon} transparent alphaTest={0.08} opacity={1} toneMapped={false} depthWrite={false} /></mesh>
      ))}
    </group>
  );
}
function Pickup({ kind, color, x, bump }: { kind: string; color: string; x: number; bump: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const shell = useTexture("/cosmos/kit/pickup_shell.webp");
  // one material per face (like the crate) so the drawn holo-slot stays centred on every face and never "slides".
  // emissiveMap = the shell itself at low intensity so faces turned away from the key light never crush to black.
  const mat = useMemo(() => { shell.colorSpace = THREE.SRGBColorSpace; shell.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: shell, bumpMap: bump ? shell : null, bumpScale: bump ? 0.02 : 0, metalness: 0.25, roughness: 0.62, emissiveMap: shell, emissive: new THREE.Color(0.34, 0.37, 0.42) }); }, [shell, bump]);
  const mats = useMemo(() => [mat, mat, mat, mat, mat, mat], [mat]);
  useFrame((st) => { const g = ref.current; if (!g) return; const t = st.clock.elapsedTime; g.rotation.y = t * 0.8; g.position.y = Math.sin(t * 1.6 + x) * 0.08; });
  return (
    <group position={[x, 0, 0]}>
      <group ref={ref}>
        {/* plain box = texture maps flush per-face so the drawn slot stays centred; black corners removed in the texture itself */}
        <mesh material={mats} castShadow><boxGeometry args={[0.85, 0.85, 0.85]} /></mesh>
        <PickupFaces kind={kind} />
      </group>
      {/* soft coloured glow OUTSIDE the cube (in front), not inside — lifts the effect without blackening faces */}
      <pointLight color={color} intensity={0.9} distance={2.4} position={[0, 0.1, 1.1]} />
    </group>
  );
}
function PickupsRow({ bump }: { bump: boolean }) {
  return (
    <group>
      <Pickup kind="heal" color="#3ee06a" x={-1.5} bump={bump} />
      <Pickup kind="shield" color="#3aa6ff" x={0} bump={bump} />
      <Pickup kind="boost" color="#ffcf3a" x={1.5} bump={bump} />
    </group>
  );
}

// 3D guard RAIL — real geometry with kit TEXTURES on each part (posts wear sup_side metal, tube rails wear pipe_wrap),
// like the ladder was built part-by-part. Cyan-lit accent strip on the top rail.
function BridgeRail({ len, z, bump }: { len: number; z: number; bump: boolean }) {
  const [post, pipe] = useTexture(["/cosmos/kit/sup_side.webp", "/cosmos/kit/pipe_wrap.webp"]);
  const postMat = useMemo(() => std(tune(post, 1, 1), bump, 0.5, 0.55), [post, bump]);
  // tube rails: pipe_wrap AND emissiveMap = pipe_wrap → the texture's own cyan indicator glows (no flat colour strip).
  const railMat = useMemo(() => { const t = pipe.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(2, Math.round(len / 0.8)), 2); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color(0.6, 0.62, 0.66), bumpMap: bump ? t : null, bumpScale: bump ? 0.02 : 0, metalness: 0.5, roughness: 0.5 }); }, [pipe, bump, len]);
  const n = Math.max(2, Math.floor(len / 1.05));
  const posts = Array.from({ length: n + 1 }, (_, i) => -len / 2 + (i / n) * len);
  return (
    <group position={[0, 0, z]}>
      {posts.map((x, i) => <mesh key={i} position={[x, 0.42, 0]} material={postMat} castShadow><boxGeometry args={[0.038, 0.62, 0.038]} /></mesh>)}
      {/* tube rails (pipe_wrap, texture-lit) lying along the length */}
      <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI / 2]} material={railMat} castShadow><cylinderGeometry args={[0.04, 0.04, len, 12]} /></mesh>
      <mesh position={[0, 0.46, 0]} rotation={[0, 0, Math.PI / 2]} material={railMat}><cylinderGeometry args={[0.03, 0.03, len, 10]} /></mesh>
    </group>
  );
}
// DECO-2 row — 4 new pieces on simple procedural shapes: hex crate (6-side cylinder), round tank (cylinder), energy
// ORB (sphere, equirect emissive, spins), holo projector (cylinder base + spinning holo glow). Texture-on-primitives.
function HexCrate({ bump }: { bump: boolean }) {
  const [side, top] = useTexture(["/cosmos/kit/crate_hex.webp", "/cosmos/kit/crate_top.webp"]);
  const mats = useMemo(() => [std(tune(side, 1, 1), bump, 0.3, 0.6), std(top, bump, 0.3, 0.6), std(top, bump, 0.3, 0.6)], [side, top, bump]);
  return <mesh material={mats} castShadow receiveShadow><cylinderGeometry args={[0.75, 0.75, 1.1, 6]} /></mesh>;
}
function RoundTank({ bump }: { bump: boolean }) {
  const side = useTexture("/cosmos/kit/crate_round.webp");
  const [cap] = useTexture(["/cosmos/kit/barrel_top.webp"]);
  const mats = useMemo(() => [std(tune(side, 2, 1), bump, 0.35, 0.5), std(cap, bump, 0.35, 0.5), std(cap, bump, 0.35, 0.5)], [side, cap, bump]);
  return <mesh material={mats} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow><cylinderGeometry args={[0.6, 0.6, 1.6, 24]} /></mesh>;
}
function EnergyOrb() {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useTexture("/cosmos/kit/deco_sphere.webp");
  const mat = useMemo(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color(0.7, 0.75, 0.9), metalness: 0.3, roughness: 0.5 }); }, [tex]);
  useFrame((st) => { if (ref.current) ref.current.rotation.y = st.clock.elapsedTime * 0.5; });
  return (
    <group>
      <mesh ref={ref} material={mat} castShadow><sphereGeometry args={[0.85, 40, 32]} /></mesh>
      {/* support rings */}
      {[0, Math.PI / 2].map((r, i) => <mesh key={i} rotation={[Math.PI / 2, r, 0]}><torusGeometry args={[1.0, 0.05, 10, 40]} /><meshStandardMaterial color="#4a5461" metalness={0.5} roughness={0.5} /></mesh>)}
      <pointLight color="#6fd8ff" intensity={2.2} distance={5} />
    </group>
  );
}
function HoloProjector() {
  const ring = useRef<THREE.Group>(null);
  const face = useTexture("/cosmos/kit/deco_hologram.webp");
  const endc = useTexture("/cosmos/kit/sup_side.webp");
  const mats = useMemo(() => { face.colorSpace = THREE.SRGBColorSpace; const et = std(tune(endc, 2, 1), true, 0.4, 0.6); const top = new THREE.MeshStandardMaterial({ color: "#141c28", metalness: 0.5, roughness: 0.5 }); const front = new THREE.MeshStandardMaterial({ map: face, emissiveMap: face, emissive: new THREE.Color(0.5, 0.55, 0.62), metalness: 0.3, roughness: 0.6 }); return [et, top, front]; }, [face, endc]);
  useFrame((st) => { if (ring.current) ring.current.rotation.y = st.clock.elapsedTime * 0.9; });
  return (
    <group>
      <mesh material={mats} position={[0, -0.6, 0]} castShadow><cylinderGeometry args={[0.7, 0.8, 0.6, 24]} /></mesh>
      {/* holographic globe above */}
      <group ref={ring} position={[0, 0.35, 0]}>
        <mesh><sphereGeometry args={[0.5, 24, 16]} /><meshBasicMaterial color="#6fd8ff" wireframe transparent opacity={0.6} toneMapped={false} /></mesh>
      </group>
      <mesh position={[0, 0.35, 0]}><sphereGeometry args={[0.5, 20, 14]} /><meshBasicMaterial color="#3aa6ff" transparent opacity={0.12} toneMapped={false} /></mesh>
      <pointLight color="#6fd8ff" intensity={2} distance={4} position={[0, 0.3, 0]} />
    </group>
  );
}
function Deco2Row({ bump }: { bump: boolean }) {
  return (
    <group position={[-0.8, 0, 0]}>
      <group position={[-3.2, -0.3, 0]} scale={0.85}><HexCrate bump={bump} /></group>
      <group position={[-1.1, -0.3, 0]} scale={0.85}><RoundTank bump={bump} /></group>
      <group position={[1.1, 0, 0]} scale={0.85}><EnergyOrb /></group>
      <group position={[3.3, 0, 0]} scale={0.85}><HoloProjector /></group>
    </group>
  );
}

// BACK WALL — a muted decorative station panel filling the DEPTH behind the platforms (instead of black). Baked
// shadows in the texture read as 3D; sits back on Z, dimmed, tiled. Demo: platform in front, wall behind.
const WALL_SLOTS = ["back_panel", "back_hatch", "back_pipes", "back_cargo", "back_reactor", "back_vents"];
function BackWallDemo({ bump }: { bump: boolean }) {
  const texes = useTexture(WALL_SLOTS.map((s) => `/cosmos/kit/${s}.png`));
  const mats = useMemo(() => texes.map((raw) => { const t = raw.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 2.2); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return new THREE.MeshBasicMaterial({ map: t, toneMapped: false, color: "#8f9aa8" }); }), [texes]);
  const N = mats.length, seg = 4.6;
  return (
    <group>
      {mats.map((m, i) => <mesh key={i} position={[(i - (N - 1) / 2) * seg, 1.4, -3.2]} material={m}><planeGeometry args={[seg - 0.15, 8]} /></mesh>)}
      <group position={[0, -0.7, 0.4]}><BeamBox bump={bump} len={6} /></group>
    </group>
  );
}
// FULL BACKDROP — a cohesive depth stack: far station skyline → solid mid-depth station WALL (variants butted
// together) with deco/vents mounted on it → platforms in front. Shows how the assembled level background reads.
function SceneDemo({ bump }: { bump: boolean }) {
  const order = ["back_cargo", "back_pipes", "back_reactor", "back_hatch", "back_vents", "back_panel", "back_reactor", "back_pipes"];
  const texes = useTexture(order.map((s) => `/cosmos/kit/${s}.png`));
  const mats = useMemo(() => texes.map((raw) => { const t = raw.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.5, 2.4); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return new THREE.MeshBasicMaterial({ map: t, toneMapped: false, color: "#828d9c" }); }), [texes]);
  const seg = 5, N = mats.length;
  return (
    <group scale={0.22} position={[0, -0.3, 0]}>
      <FarCity z={-13} baseY={-9} n={11} spread={54} />
      {/* solid mid-depth station wall */}
      {mats.map((m, i) => <mesh key={i} position={[(i - (N - 1) / 2) * seg, 3, -4.2]} material={m}><planeGeometry args={[seg + 0.05, 12]} /></mesh>)}
      {/* deco mounted on the wall */}
      <group position={[-9, 3.5, -3.9]}><DecoPanel slot="deco_screen" w={3.2} h={2.4} pulse={0.14} speed={5} /></group>
      <group position={[9, 4.2, -3.9]}><DecoPanel slot="deco_beacon" w={2.2} h={2.9} pulse={0.4} speed={4} /></group>
      <group position={[3.5, 1.2, -3.9]}><WallPanel slot="vent_grille" w={2.6} h={2.6} /></group>
      <group position={[-3, 5.5, -3.9]}><WallPanel slot="sign" w={2.8} h={2.1} /></group>
      {/* play platforms in front */}
      <group position={[-5, -2.2, 0.4]}><BeamBox bump={bump} len={9} /></group>
      <group position={[7, 1.4, 0.4]}><BeamBox bump={bump} len={6} /></group>
    </group>
  );
}
// SIGNS/VENT — thin procedural 3D wall panel: FRONT face wears the generated texture with emissiveMap so its cyan
// (vent slits / sign arrow) self-glows; side ENDS wear sup_side metal. Wall-mounted readability decor.
function WallPanel({ slot, w, h }: { slot: string; w: number; h: number }) {
  const [face, endc] = useTexture([`/cosmos/kit/${slot}.png`, "/cosmos/kit/sup_side.webp"]);
  const mats = useMemo(() => {
    face.colorSpace = THREE.SRGBColorSpace; endc.colorSpace = THREE.SRGBColorSpace;
    const front = new THREE.MeshStandardMaterial({ map: face, emissiveMap: face, emissive: new THREE.Color(0.5, 0.56, 0.62), metalness: 0.3, roughness: 0.6 });
    const end = std(endc, true, 0.4, 0.6);
    return [end, end, end, end, front, end]; // +z = front
  }, [face, endc]);
  return <mesh material={mats} castShadow receiveShadow><boxGeometry args={[w, h, 0.14]} /></mesh>;
}
function SignsRow() {
  return (
    <group>
      <group position={[-1.15, 0, 0]}><WallPanel slot="vent_grille" w={1.5} h={1.5} /></group>
      <group position={[1.2, 0, 0]}><WallPanel slot="sign" w={1.7} h={1.28} /></group>
    </group>
  );
}
// animated wall DECO panel: emissiveMap self-glow + optional PULSE (beacon throbs, screen flickers) via useFrame.
function DecoPanel({ slot, w, h, pulse = 0, speed = 3 }: { slot: string; w: number; h: number; pulse?: number; speed?: number }) {
  const [face, endc] = useTexture([`/cosmos/kit/${slot}.png`, "/cosmos/kit/sup_side.webp"]);
  const frontRef = useRef<THREE.MeshStandardMaterial>(null!);
  const mats = useMemo(() => {
    face.colorSpace = THREE.SRGBColorSpace; endc.colorSpace = THREE.SRGBColorSpace;
    const front = new THREE.MeshStandardMaterial({ map: face, emissiveMap: face, emissive: new THREE.Color(0.55, 0.58, 0.62), metalness: 0.3, roughness: 0.6 });
    frontRef.current = front;
    const end = std(endc, true, 0.4, 0.6);
    return [end, end, end, end, front, end];
  }, [face, endc]);
  useFrame((st) => { if (pulse > 0 && frontRef.current) { const t = st.clock.elapsedTime; const g = 0.58 + Math.sin(t * speed) * pulse; frontRef.current.emissive.setRGB(g, g * 0.96, g * 0.92); } });
  return <mesh material={mats} castShadow receiveShadow><boxGeometry args={[w, h, 0.14]} /></mesh>;
}
function DecoRow() {
  return (
    <group>
      <group position={[-2.1, 0, 0]}><DecoPanel slot="deco_screen" w={1.7} h={1.28} pulse={0.14} speed={5} /></group>
      <group position={[0, 0, 0]}><DecoPanel slot="deco_beacon" w={1.25} h={1.65} pulse={0.4} speed={4} /></group>
      <group position={[2.05, 0, 0]}><DecoPanel slot="deco_porthole" w={1.5} h={1.5} /></group>
    </group>
  );
}

// BRIDGE — procedural 3D catwalk: a long thin deck box (grating on top, plat_side flanks, sup_side ends) with a REAL
// 3D guard rail down each long edge. Grating tiles along the length. Connects platforms / adds verticality.
function BridgeBox({ bump, len = 6 }: { bump: boolean; len?: number }) {
  const [grate, side, endc] = useTexture(["/cosmos/kit/bridge_grate.webp", "/cosmos/kit/plat_side.webp", "/cosmos/kit/sup_side.webp"]);
  const W = 1.4;
  const mats = useMemo(() => {
    for (const t of [grate, side, endc]) t.colorSpace = THREE.SRGBColorSpace;
    const rl = Math.max(1, Math.round(len / 1.6));
    const top = std(tune(grate, rl, 1), bump, 0.3, 0.6);
    const flank = std(tune(side, rl, 1), bump, 0.25, 0.65);
    const end = std(tune(endc, 1, 1), bump, 0.4, 0.6);
    return [end, end, top, flank, flank, flank]; // +x(end),-x(end),+y(grate),-y,+z(flank),-z
  }, [grate, side, endc, bump, len]);
  return (
    <group>
      <mesh material={mats} castShadow receiveShadow><boxGeometry args={[len, 0.22, W]} /></mesh>
      <BridgeRail len={len} z={W / 2 - 0.05} bump={bump} />
      <BridgeRail len={len} z={-W / 2 + 0.05} bump={bump} />
    </group>
  );
}

// COVER — procedural 3D battle cover box: FRONT face wears the generated cover panel, TOP = plat_deck, side ENDS =
// sup_side. lo = wide waist-high half-cover, hi = tall full-cover. Textures on every face (no flat 2D).
function CoverBlock({ kind, bump }: { kind: "lo" | "hi"; bump: boolean }) {
  const [front, deck, endc] = useTexture([`/cosmos/kit/cover_${kind}.png`, "/cosmos/kit/plat_deck.webp", "/cosmos/kit/sup_side.webp"]);
  const [w, hh, d] = kind === "lo" ? [2.4, 1.1, 0.55] : [1.5, 2.1, 0.55];
  const mats = useMemo(() => {
    for (const t of [front, deck, endc]) t.colorSpace = THREE.SRGBColorSpace;
    const end = std(tune(endc, Math.max(1, Math.round(d / 0.9)), Math.max(1, Math.round(hh / 2.5))), bump, 0.4, 0.6);
    const top = std(tune(deck, Math.max(1, Math.round(w / 1.3)), Math.max(1, Math.round(d / 1.3))), bump, 0.3, 0.65);
    const face = std(front, bump, 0.3, 0.6);
    return [end, end, top, top, face, end]; // +x,-x,+y(top),-y,+z(front),-z
  }, [front, deck, endc, bump, w, hh, d]);
  return <mesh material={mats} position={[0, hh / 2 - 0.9, 0]} castShadow receiveShadow><boxGeometry args={[w, hh, d]} /></mesh>;
}
function CoverRow({ bump }: { bump: boolean }) {
  return (
    <group>
      <group position={[-1.7, 0, 0]}><CoverBlock kind="lo" bump={bump} /></group>
      <group position={[1.4, 0, 0]}><CoverBlock kind="hi" bump={bump} /></group>
    </group>
  );
}

// BUILT PIPE — an EXTENDABLE pipe: a valve CAP (верхушка) on top + straight tube CONTINUATION with flange rings at
// segment joints, wrapped in a chosen pipe texture. Shows how the top + continuation stack. + a braided cable bundle.
function BuiltPipe({ bump, len = 5, wrap = "pipe_ribbed" }: { bump: boolean; len?: number; wrap?: string }) {
  const tex = useTexture(`/cosmos/kit/${wrap}.png`);
  const R = 0.24;
  const mat = useMemo(() => { const t = tex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, Math.max(2, Math.round(len / 1.2))); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, bumpMap: bump ? t : null, bumpScale: bump ? 0.02 : 0, metalness: 0.4, roughness: 0.55 }); }, [tex, bump, len]);
  const flangeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a333f", metalness: 0.5, roughness: 0.5 }), []);
  const cyan = useMemo(() => new THREE.MeshStandardMaterial({ color: "#123038", emissive: "#4fd8ff", emissiveIntensity: 1.1, metalness: 0.3, roughness: 0.4 }), []);
  const nJoint = Math.max(1, Math.round(len / 1.5));
  return (
    <group position={[0, -len / 2, 0]}>
      {/* straight continuation */}
      <mesh material={mat} position={[0, len / 2, 0]} castShadow><cylinderGeometry args={[R, R, len, 24]} /></mesh>
      {/* flange rings at segment joints */}
      {Array.from({ length: nJoint }, (_, i) => <mesh key={i} material={flangeMat} position={[0, (i + 1) * (len / (nJoint + 1)), 0]}><cylinderGeometry args={[R * 1.22, R * 1.22, 0.14, 24]} /></mesh>)}
      {/* top valve CAP (верхушка) */}
      <group position={[0, len + 0.05, 0]}>
        <mesh material={flangeMat}><cylinderGeometry args={[R * 1.3, R * 1.3, 0.22, 24]} /></mesh>
        <mesh material={mat} position={[0, 0.28, 0]}><cylinderGeometry args={[R * 0.7, R * 0.7, 0.34, 20]} /></mesh>
        <mesh material={cyan} position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.18, 0.045, 10, 28]} /></mesh>
      </group>
    </group>
  );
}
function CableHarness() {
  const wrap = useTexture("/cosmos/kit/cable_bundle.webp");
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.2, 2.2, 0), new THREE.Vector3(0.1, 0.4, 0.2), new THREE.Vector3(0.4, -1.8, 0)), []);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 40, 0.16, 16, false), [curve]);
  const mat = useMemo(() => { const t = wrap.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 6); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color(0.3, 0.34, 0.4), metalness: 0.2, roughness: 0.7 }); }, [wrap]);
  return <mesh geometry={geo} material={mat} castShadow />;
}
function BuiltPipeRow({ bump }: { bump: boolean }) {
  return (
    <group>
      <group position={[-1.6, 0.4, 0]}><BuiltPipe bump={bump} wrap="pipe_ribbed" /></group>
      <group position={[0, 0.4, 0]}><BuiltPipe bump={bump} wrap="pipe_wrap" /></group>
      <group position={[1.7, 0.6, 0]}><CableHarness /></group>
    </group>
  );
}

// HANGING DECOR — things that hang ABOVE a platform. Kept to simple primitives (boxes / cylinders / a partial-arc
// torus hook) so there are no mesh artifacts. Crane = beam + winch box (crane_winch) + cable + hook. Sign on chains sways.
function CraneHoist({ bump }: { bump: boolean }) {
  const [winch, beam, endc] = useTexture(["/cosmos/kit/crane_winch.webp", "/cosmos/kit/sup_side.webp", "/cosmos/kit/sup_side.webp"]);
  const winchMats = useMemo(() => {
    winch.colorSpace = THREE.SRGBColorSpace; endc.colorSpace = THREE.SRGBColorSpace;
    const front = new THREE.MeshStandardMaterial({ map: winch, emissiveMap: winch, emissive: new THREE.Color(0.4, 0.43, 0.48), metalness: 0.35, roughness: 0.6 });
    const end = std(endc, bump, 0.45, 0.6);
    return [end, end, end, end, front, end];
  }, [winch, endc, bump]);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a434f", metalness: 0.5, roughness: 0.5 }), []);
  const beamMat = useMemo(() => std(tune(beam, 3, 1), bump, 0.45, 0.6), [beam, bump]);
  const cableL = 1.7;
  return (
    <group>
      {/* overhead beam */}
      <mesh material={beamMat} position={[0, 2.3, 0]} castShadow><boxGeometry args={[2.6, 0.28, 0.4]} /></mesh>
      {/* winch box hanging under the beam */}
      <mesh material={winchMats} position={[0, 1.75, 0]} castShadow><boxGeometry args={[1.1, 0.8, 0.5]} /></mesh>
      {/* cable + hook */}
      <mesh material={metal} position={[0, 1.75 - cableL / 2 - 0.4, 0]}><cylinderGeometry args={[0.03, 0.03, cableL, 8]} /></mesh>
      <group position={[0, 1.75 - cableL - 0.4, 0]}>
        <mesh material={metal}><torusGeometry args={[0.06, 0.02, 8, 16]} /></mesh>{/* eye */}
        <mesh material={metal} position={[0, -0.18, 0]}><cylinderGeometry args={[0.03, 0.03, 0.3, 8]} /></mesh>
        <mesh material={metal} position={[0, -0.42, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.13, 0.035, 10, 20, Math.PI * 1.5]} /></mesh>{/* hook arc */}
      </group>
    </group>
  );
}
function HangSign() {
  const grp = useRef<THREE.Group>(null);
  const [face, endc] = useTexture(["/cosmos/kit/sign.webp", "/cosmos/kit/sup_side.webp"]);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a434f", metalness: 0.5, roughness: 0.5 }), []);
  const mats = useMemo(() => {
    face.colorSpace = THREE.SRGBColorSpace; endc.colorSpace = THREE.SRGBColorSpace;
    const front = new THREE.MeshStandardMaterial({ map: face, emissiveMap: face, emissive: new THREE.Color(0.5, 0.55, 0.62), metalness: 0.3, roughness: 0.6 });
    const end = std(endc, true, 0.4, 0.6);
    return [end, end, end, end, front, end];
  }, [face, endc]);
  useFrame((st) => { if (grp.current) grp.current.rotation.z = Math.sin(st.clock.elapsedTime * 0.9) * 0.06; });
  return (
    <group position={[0, 2.3, 0]}>
      <group ref={grp}>
        {/* two chains */}
        {[-0.6, 0.6].map((x, i) => <mesh key={i} material={metal} position={[x, -0.55, 0]}><cylinderGeometry args={[0.02, 0.02, 1.0, 6]} /></mesh>)}
        {/* the sign plate */}
        <mesh material={mats} position={[0, -1.35, 0]} castShadow><boxGeometry args={[1.7, 1.15, 0.12]} /></mesh>
      </group>
    </group>
  );
}
function HangRow({ bump }: { bump: boolean }) {
  return (
    <group>
      <group position={[-1.6, -0.6, 0]}><CraneHoist bump={bump} /></group>
      <group position={[1.6, -0.6, 0]}><HangSign /></group>
    </group>
  );
}

// GROUND PROPS — simple floor pieces that just "sit" on a platform (like crates), built from EXISTING kit textures
// (0 gen): a terminal console (deco_screen), a glowing generator cell (boost_cell), a crate stack. Simple primitives.
function Terminal({ bump }: { bump: boolean }) {
  const [side, screen] = useTexture(["/cosmos/kit/crate_side.webp", "/cosmos/kit/deco_screen.webp"]);
  const baseMats = useMemo(() => { const s = std(side, bump, 0.2, 0.7); return [s, s, s, s, s, s]; }, [side, bump]);
  const scr = useMemo(() => { screen.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: screen, emissiveMap: screen, emissive: new THREE.Color(0.55, 0.6, 0.68), metalness: 0.3, roughness: 0.55 }); }, [screen]);
  return (
    <group>
      <mesh material={baseMats} position={[0, -0.35, 0]} castShadow receiveShadow><boxGeometry args={[1.1, 0.9, 0.7]} /></mesh>
      {/* tilted console screen on top */}
      <mesh material={scr} position={[0, 0.2, 0.05]} rotation={[-Math.PI / 4, 0, 0]} castShadow><planeGeometry args={[1.0, 0.62]} /></mesh>
      <pointLight color="#6fd8ff" intensity={0.7} distance={2.5} position={[0, 0.4, 0.5]} />
    </group>
  );
}
function GeneratorCell() {
  const ref = useRef<THREE.Mesh>(null);
  const [wrap, base] = useTexture(["/cosmos/kit/boost_cell.webp", "/cosmos/kit/sup_side.webp"]);
  const cellMat = useMemo(() => { const t = wrap.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color(0.6, 0.68, 0.8), metalness: 0.4, roughness: 0.4 }); }, [wrap]);
  const baseMat = useMemo(() => std(base, true, 0.45, 0.6), [base]);
  useFrame((st) => { if (ref.current) ref.current.rotation.y = st.clock.elapsedTime * 0.4; });
  return (
    <group>
      <mesh material={baseMat} position={[0, -0.55, 0]} castShadow><cylinderGeometry args={[0.5, 0.55, 0.3, 20]} /></mesh>
      <mesh ref={ref} material={cellMat} position={[0, 0.05, 0]} castShadow><cylinderGeometry args={[0.36, 0.36, 1.0, 6]} /></mesh>
      <pointLight color="#6fd8ff" intensity={2} distance={4} position={[0, 0.1, 0]} />
    </group>
  );
}
// a short vertical PIPE assembly (cell): pipe_wrap tube + flange rings + valve cap — a clean placeable unit.
function PipeStack({ bump }: { bump: boolean }) {
  const tex = useTexture("/cosmos/kit/pipe_wrap.webp");
  const R = 0.28, len = 2.0;
  const mat = useMemo(() => { const t = tex.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, Math.round(len / 1.2)); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, bumpMap: bump ? t : null, bumpScale: bump ? 0.02 : 0, metalness: 0.4, roughness: 0.55 }); }, [tex, bump]);
  const flange = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a333f", metalness: 0.5, roughness: 0.5 }), []);
  const cyan = useMemo(() => new THREE.MeshStandardMaterial({ color: "#123038", emissive: "#4fd8ff", emissiveIntensity: 1.1, metalness: 0.3, roughness: 0.4 }), []);
  return (
    <group>
      <mesh material={mat} position={[0, len / 2, 0]} castShadow><cylinderGeometry args={[R, R, len, 20]} /></mesh>
      {[0.5, 1.5].map((y, i) => <mesh key={i} material={flange} position={[0, y, 0]}><cylinderGeometry args={[R * 1.2, R * 1.2, 0.14, 20]} /></mesh>)}
      <mesh material={flange} position={[0, len + 0.1, 0]}><cylinderGeometry args={[R * 1.25, R * 1.25, 0.2, 20]} /></mesh>
      <mesh material={cyan} position={[0, len + 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.17, 0.04, 10, 24]} /></mesh>
    </group>
  );
}
// PLACEABLE SET — 5 clean units built from existing kit, each SEATED on the floor line (no clipping): crate stack,
// barrel pair, round tank on legs, energy-sphere rig, pipe cell.
function KitSetRow({ bump }: { bump: boolean }) {
  const legMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2f3843", metalness: 0.5, roughness: 0.55 }), []);
  return (
    <group scale={0.5} position={[0, -1, 0]}>
      {/* 1 · crate stack — big (0.62) then small (0.4) seated exactly on top */}
      <group position={[-4.4, 0, 0]}>
        <group position={[0, 1.1 * 0.62, 0]} scale={0.62}><CrateBox bump={bump} /></group>
        <group position={[0.15, 2 * 1.1 * 0.62 + 1.1 * 0.4, 0]} scale={0.4}><CrateBox bump={bump} /></group>
      </group>
      {/* 2 · barrel pair — spaced so the cylinders (r≈0.72) don't intersect */}
      <group position={[-2.1, 0, 0]}>
        <group position={[-0.85, 0.85, 0]}><BarrelMesh bump={bump} /></group>
        <group position={[0.82, 0.85 * 0.9, 0.15]} scale={0.9}><BarrelMesh bump={bump} /></group>
      </group>
      {/* 3 · round tank on legs (crate_round) */}
      <group position={[0.3, 0, 0]}>
        <group position={[0, 0.95, 0]}><RoundTank bump={bump} /></group>
        {[-0.5, 0.5].map((x, i) => <mesh key={i} material={legMat} position={[x, 0.35, 0]}><boxGeometry args={[0.16, 0.7, 0.5]} /></mesh>)}
      </group>
      {/* 4 · energy sphere rig */}
      <group position={[2.5, 0, 0]}>
        <mesh material={legMat} position={[0, 0.2, 0]}><cylinderGeometry args={[0.5, 0.6, 0.4, 20]} /></mesh>
        <group position={[0, 1.25, 0]} scale={0.72}><EnergyOrb /></group>
      </group>
      {/* 5 · pipe cell */}
      <group position={[4.4, 0, 0]}><PipeStack bump={bump} /></group>
    </group>
  );
}
// WALL CABLES — vertical power cables (cable_pwr) running down a wall, with junction boxes. Uses an under-used slot.
function WallCables({ slot = "cable_pwr", n = 3 }: { slot?: string; n?: number }) {
  const wrap = useTexture(`/cosmos/kit/${slot}.png`);
  const items = useMemo(() => Array.from({ length: n }, (_, i) => {
    const x = -0.5 + (i / (n - 1)) * 1.0, bow = 0.06 + (i % 2) * 0.05;
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 1.5, 0), new THREE.Vector3(x + bow, 0, 0.05), new THREE.Vector3(x, -1.5, 0));
    const t = wrap.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 8); t.colorSpace = THREE.SRGBColorSpace;
    return { geo: new THREE.TubeGeometry(curve, 30, 0.05 + (i % 2) * 0.02, 8, false), mat: new THREE.MeshStandardMaterial({ map: t, metalness: 0.2, roughness: 0.75 }), x };
  }), [wrap, n]);
  const box = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a333f", metalness: 0.5, roughness: 0.5 }), []);
  return (
    <group>
      {items.map((c, i) => <mesh key={i} geometry={c.geo} material={c.mat} castShadow />)}
      {[1.2, -0.4, -1.4].map((y, i) => <mesh key={"j" + i} material={box} position={[items[i % n].x, y, 0.06]}><boxGeometry args={[0.34, 0.28, 0.16]} /></mesh>)}
    </group>
  );
}
// WALL NEON — light design for the wall base: a thin cyan LED line + a very faint upward glow gradient + a gentle
// fill light, so the dark transition where props meet the wall reads with a subtle neon ambience (not black).
function WallNeon({ w, yBottom, color = "#4fd8ff" }: { w: number; yBottom: number; color?: string }) {
  return (
    <group>
      <mesh position={[0, yBottom + 0.02, 0.03]}><boxGeometry args={[w * 0.98, 0.04, 0.03]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      <mesh position={[0, yBottom + 0.55, -0.05]}><planeGeometry args={[w, 1.1]} /><meshBasicMaterial color={color} transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      <pointLight color={color} intensity={0.55} distance={2.8} position={[0, yBottom + 0.35, 0.55]} />
    </group>
  );
}
function WallWithCables({ bump, wall = "back_pipes" }: { bump: boolean; wall?: string }) {
  const back = useTexture(`/cosmos/kit/${wall}.png`);
  const mat = useMemo(() => { const t = back.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color(0.4, 0.44, 0.5), metalness: 0.25, roughness: 0.75 }); }, [back]);
  return (
    <group>
      <mesh material={mat} position={[0, 0, -0.12]}><planeGeometry args={[3.2, 3.6]} /></mesh>
      <WallNeon w={3.2} yBottom={-1.8} />
      <WallCables slot="cable_pwr" n={3} />
      <group position={[1.0, -0.7, 0.0]}><WallPanel slot="vent_grille" w={1.1} h={1.1} /></group>
      <group position={[-1.05, 0.75, 0.0]} scale={0.85}><WallPanel slot="sign" w={1.2} h={0.9} /></group>
    </group>
  );
}
function InfoWall({ wall = "back_panel" }: { wall?: string }) {
  const back = useTexture(`/cosmos/kit/${wall}.png`);
  const mat = useMemo(() => { const t = back.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color(0.42, 0.46, 0.52), metalness: 0.25, roughness: 0.72 }); }, [back]);
  return (
    <group>
      <mesh material={mat} position={[0, 0, -0.12]}><planeGeometry args={[3.4, 3.6]} /></mesh>
      <WallNeon w={3.4} yBottom={-1.8} />
      <group position={[-0.85, 0.55, 0.0]}><DecoPanel slot="deco_screen" w={1.5} h={1.15} pulse={0.14} speed={5} /></group>
      <group position={[0.95, 0.7, 0.0]} scale={0.9}><DecoPanel slot="deco_beacon" w={1.0} h={1.3} pulse={0.4} speed={4} /></group>
      {/* holo-projector (finally used) mounted low */}
      <group position={[0.7, -1.1, 0.02]} scale={0.7}><HoloProjector /></group>
      <group position={[-1.0, -0.9, 0.0]} scale={0.8}><WallPanel slot="sign" w={1.2} h={0.9} /></group>
    </group>
  );
}
function WallGroupRow({ bump, wall }: { bump: boolean; wall: string }) {
  return (
    <group scale={0.72}>
      <group position={[-2.4, 0.3, 0]}><WallWithCables bump={bump} wall={wall} /></group>
      <group position={[2.4, 0.3, 0]}><InfoWall wall={wall} /></group>
    </group>
  );
}

function GroundPropsRow({ bump }: { bump: boolean }) {
  return (
    <group>
      <group position={[-2, 0, 0]}><Terminal bump={bump} /></group>
      <group position={[0, 0, 0]}><GeneratorCell /></group>
      {/* crate stack */}
      <group position={[2, 0, 0]}>
        <group position={[0, -0.5, 0]} scale={0.9}><CrateBox bump={bump} /></group>
        <group position={[0.15, 0.55, -0.1]} scale={0.6}><CrateBox bump={bump} /></group>
      </group>
    </group>
  );
}

// JUMP PAD — a low procedural BOX: top face = jumppad_top membrane (emissive glow), sides = jumppad_side (or plat_side
// fallback) tiled by length. Square box → every face maps 1:1, nothing stretches.
function JumpPad({ bump }: { bump: boolean }) {
  const [top, side] = useTexture(["/cosmos/kit/jumppad_top.webp", "/cosmos/kit/plat_side.webp"]); // side = plat_side until jumppad_side is generated
  const W = 1.7, H = 0.34;
  const topRef = useRef<THREE.MeshStandardMaterial>(null!);
  const mats = useMemo(() => {
    top.colorSpace = THREE.SRGBColorSpace; side.colorSpace = THREE.SRGBColorSpace;
    const topMat = new THREE.MeshStandardMaterial({ map: top, emissiveMap: top, emissive: new THREE.Color(0.55, 0.75, 0.85), bumpMap: bump ? top : null, bumpScale: bump ? 0.03 : 0, metalness: 0.2, roughness: 0.55 });
    topRef.current = topMat;
    const sideMat = std(tune(side, Math.max(1, Math.round(W / 2)), 1), bump, 0.35, 0.6);
    const bot = new THREE.MeshStandardMaterial({ color: "#141c28", metalness: 0.4, roughness: 0.7 });
    return [sideMat, sideMat, topMat, bot, sideMat, sideMat]; // +x,-x,+y(top),-y,+z,-z
  }, [top, side, bump]);
  // animated CHARGE pulse: the cyan membrane brightens in a rising wave (reads as "loaded / about to launch")
  useFrame((st) => { if (topRef.current) { const p = 0.7 + 0.5 * (0.5 + 0.5 * Math.sin(st.clock.elapsedTime * 3)); topRef.current.emissiveIntensity = p; } });
  return (
    <group>
      <mesh material={mats} castShadow receiveShadow><boxGeometry args={[W, H, W]} /></mesh>
      {/* rising energy particles (drei Sparkles) — levitation shimmer over the pad */}
      <Sparkles count={26} scale={[W * 0.7, 1.4, W * 0.7]} position={[0, 0.8, 0]} size={4} speed={0.5} noise={0.4} color="#8fe8ff" />
      <pointLight color="#6fe0ff" intensity={1.6} distance={3.2} position={[0, 0.6, 0]} />
    </group>
  );
}

// LIFT GUIDE RAIL — detailed procedural stanchion: main sup_side profile + a RACK of teeth (the lift climbs it) +
// a cyan power channel + horizontal mounting brackets at intervals. Reads as real machinery, not a bare box.
function LiftRail({ x, h, railMat, bump }: { x: number; h: number; railMat: THREE.Material; bump: boolean }) {
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: "#39434f", metalness: 0.55, roughness: 0.5 }), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#222a33", metalness: 0.5, roughness: 0.55 }), []);
  const cyan = useMemo(() => new THREE.MeshStandardMaterial({ color: "#123038", emissive: "#4fd8ff", emissiveIntensity: 1.0, metalness: 0.3, roughness: 0.4 }), []);
  const teeth = Math.max(4, Math.round(h / 0.3)), brs = Math.max(2, Math.round(h / 1.4));
  return (
    <group position={[x, 0, 0]}>
      <mesh material={railMat} position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[0.32, h, 0.5]} /></mesh>
      {/* recessed rack channel (dark) + teeth the lift climbs */}
      <mesh material={dark} position={[0, h / 2, 0.24]}><boxGeometry args={[0.2, h, 0.06]} /></mesh>
      {Array.from({ length: teeth }, (_, i) => <mesh key={"t" + i} material={metal} position={[0, 0.2 + i * (h / teeth), 0.28]}><boxGeometry args={[0.16, 0.12, 0.1]} /></mesh>)}
      {/* cyan power channel down one edge */}
      <mesh material={cyan} position={[0.14, h / 2, 0.26]}><boxGeometry args={[0.04, h, 0.03]} /></mesh>
      {/* mounting brackets */}
      {Array.from({ length: brs }, (_, i) => <mesh key={"b" + i} material={metal} position={[0, 0.4 + i * (h / brs), 0]} castShadow><boxGeometry args={[0.52, 0.18, 0.66]} /></mesh>)}
    </group>
  );
}
// LIFT — procedural model (step 1): a deck platform that rides between two guide RAILS, with a chamfer rim to
// soften the box. Faces textured from the kit for now (deck=plat_deck, sides=plat_side, rails=sup_side); later each
// face gets a dedicated lift texture (lift_deck with motion arrows, lift_rail with rack teeth).
function LiftRig({ bump }: { bump: boolean }) {
  const [deck, side, rail] = useTexture(["/cosmos/kit/lift_deck.webp", "/cosmos/kit/plat_side.webp", "/cosmos/kit/sup_side.webp"]);
  const W = 3, DEP = 1.6, railH = 4.6, deckTh = 0.5;
  const deckMats = useMemo(() => {
    for (const t of [deck, side]) t.colorSpace = THREE.SRGBColorSpace;
    const s = std(tune(side, Math.max(1, Math.round(W / 2)), 1), bump, 0.3, 0.65);
    const top = std(deck, bump, 0.3, 0.6); // lift_deck = single composition (arrows), map 1:1, no tiling
    const end = std(tune(side, 1, 1), bump, 0.3, 0.65);
    return [end, end, top, s, s, s]; // +x,-x,+y(deck),-y,+z(front),-z
  }, [deck, side, bump]);
  const rim = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a333f", metalness: 0.5, roughness: 0.5 }), []);
  return (
    <group position={[0, 0.3, 0]}>
      {/* FLOATING deck (anti-grav platform) with a soft chamfer rim */}
      <group position={[0, 0, 0]}>
        <RoundedBox args={[W, deckTh, DEP]} radius={0.06} smoothness={3} material={deckMats} castShadow receiveShadow />
        <mesh material={rim} position={[0, deckTh / 2, 0]}><boxGeometry args={[W + 0.08, 0.06, DEP + 0.08]} /></mesh>
      </group>
      {/* underside anti-grav THRUSTER: a soft glow disc + rising energy sparkles that hold the deck up */}
      <mesh position={[0, -deckTh / 2 - 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[W * 0.9, DEP * 0.9]} /><meshBasicMaterial color="#5fd0ff" transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      <Sparkles count={40} scale={[W * 0.8, 1.6, DEP * 0.8]} position={[0, -1.1, 0]} size={4} speed={0.7} noise={0.5} color="#8fe8ff" />
      <pointLight color="#5fd0ff" intensity={2.2} distance={4} position={[0, -0.7, 0]} />
    </group>
  );
}

// BARREL — cylinder wrapped in the barrel side + lid on top.
function BarrelMesh({ bump }: { bump: boolean }) {
  const [side, top] = useTexture(["/cosmos/kit/barrel_side.webp", "/cosmos/kit/barrel_top.webp"]);
  const mats = useMemo(() => [std(tune(side, 2, 1), bump, 0.15, 0.75), std(top, bump, 0.15, 0.75), std(top, bump, 0.2, 0.8)], [side, top, bump]); // cylinder: side, top, bottom
  return <mesh material={mats} castShadow receiveShadow><cylinderGeometry args={[0.72, 0.72, 1.7, 30]} /></mesh>;
}

// asset viewer categories (подгруппы) — keeps the toolbar short: pick a group → its modes appear.
const MODE_LABEL: Record<string, string> = {
  crate: "ящик", beam: "балка", ladder: "лестница", ramp: "рампа", barrel: "бочка", pillar: "колонна",
  railing: "ограждение", pickup: "пикапы", gate: "врата", jumppad: "батут", cover: "укрытия", bridge: "мостик", city: "строения",
  signs: "знаки", deco: "экран/маяк", backwall: "фон-стена", scene: "задник", deco2: "шар/кофр", cables: "провода",
  pipe: "труба", pipes: "трубы", flat: "плоско", lift: "лифт", built: "труба+жгут", all: "🗂 ВСЁ (контактка)",
};

// a texture thumbnail that resolves the real file extension (manifest stores only the slot name, files are a mix of
// .webp and .png) by trying webp first, then falling back to png on error — so nothing shows up black. Default fills
// its box (cover); pass style={{height:"auto"}} to keep the texture's NATURAL aspect ratio (Pinterest board tiles).
function KitThumb({ slot, style }: { slot: string; style?: React.CSSProperties }) {
  const [ext, setExt] = useState<"webp" | "png">("webp");
  return <img src={`/cosmos/kit/${slot}.${ext}`} alt={slot} loading="lazy" onError={() => ext === "webp" && setExt("png")} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", ...style }} />;
}
// classify a manifest slot into a board CATEGORY. backdrop (sky/city/mock) + hero (shields) are NOT level kit and are
// excluded from the board; the rest is what actually dresses a LEVEL, split into struct / props / play / detail so it
// can be filtered. The board is "everything used in the level", nothing else.
function slotCat(slot: string): "backdrop" | "hero" | "struct" | "props" | "play" | "detail" {
  if (/^(bg_|world_)/.test(slot)) return "backdrop";
  if (/^shield/.test(slot)) return "hero";
  if (/^(plat|ramp|ladder|sup_side|bridge|pipe|cable|lift|crane|beam)/.test(slot)) return "struct";
  if (/^(crate|barrel|cover|boost)/.test(slot)) return "props";
  if (/^(gate|jumppad|pickup)/.test(slot)) return "play";
  return "detail"; // deco_* / sign / vent / back_* wall panels
}
const BOARD_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "всё" }, { id: "struct", label: "структура" }, { id: "props", label: "пропсы" }, { id: "play", label: "игровое" }, { id: "detail", label: "детали" },
];
// load a kit texture as an <img>, resolving webp→png (manifest has no extension). Resolves null if neither exists.
function loadKitImg(slot: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image(); let triedPng = false;
    img.onload = () => resolve(img);
    img.onerror = () => { if (!triedPng) { triedPng = true; img.src = `/cosmos/kit/${slot}.png`; } else resolve(null); };
    img.src = `/cosmos/kit/${slot}.webp`;
  });
}
// EXPORT the whole board to a single PNG/JPEG file (no manual screenshot). Lays every texture out masonry-style on a
// canvas at full resolution, draws optional filename labels, then downloads. Same-origin images → canvas stays clean.
async function exportBoard(slots: string[], labels: boolean, format: "png" | "jpeg") {
  const imgs = (await Promise.all(slots.map(async (s) => ({ s, img: await loadKitImg(s) })))).filter((x) => x.img) as { s: string; img: HTMLImageElement }[];
  const cols = Math.max(3, Math.min(7, Math.round(Math.sqrt(imgs.length) * 1.1)));
  const colW = 340, gap = 16, pad = 24, labelH = labels ? 30 : 0;
  const colH: number[] = new Array(cols).fill(pad);
  const place = imgs.map(({ s, img }) => {
    const c = colH.indexOf(Math.min(...colH));
    const h = img.height * (colW / img.width);
    const y = colH[c], x = pad + c * (colW + gap);
    colH[c] = y + h + labelH + gap;
    return { s, img, x, y, w: colW, h };
  });
  const W = pad * 2 + cols * colW + (cols - 1) * gap, H = Math.max(...colH) + pad - gap;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!; ctx.fillStyle = "#0b0e13"; ctx.fillRect(0, 0, W, H);
  for (const p of place) {
    ctx.drawImage(p.img, p.x, p.y, p.w, p.h);
    if (labels) {
      ctx.fillStyle = "#0b0e13"; ctx.fillRect(p.x, p.y + p.h, p.w, labelH);
      ctx.fillStyle = "#eaf3ff"; ctx.font = "16px ui-monospace, monospace"; ctx.textBaseline = "middle";
      ctx.fillText(p.s, p.x + 6, p.y + p.h + labelH / 2, p.w - 12);
    }
  }
  const url = cv.toDataURL(format === "jpeg" ? "image/jpeg" : "image/png", 0.92);
  const a = document.createElement("a"); a.href = url; a.download = `cosmos-kit.${format === "jpeg" ? "jpg" : "png"}`; a.click();
}
// CONTACT BOARD — every kit texture as a PINTEREST-style masonry board: each tile keeps its NATURAL shape (wide deck
// strips stay wide, icons stay square, nothing cropped), laid out in columns of varied height. Click a tile to open
// it big (lightbox). Backdrops excluded. ⬇ buttons export the whole board to one PNG/JPEG for an image generator.
function AllTextures({ items, labels }: { items: Item[]; labels: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filt, setFilt] = useState("all");
  // only LEVEL kit (drop backdrops + hero shields), then apply the active category filter
  const levelSlots = useMemo(() => items.map((i) => i.slot).map((s) => ({ s, c: slotCat(s) })).filter((x) => x.c !== "backdrop" && x.c !== "hero"), [items]);
  const slots = useMemo(() => levelSlots.filter((x) => filt === "all" || x.c === filt).map((x) => x.s), [levelSlots, filt]);
  const save = async (fmt: "png" | "jpeg") => { setBusy(true); try { await exportBoard(slots, labels, fmt); } finally { setBusy(false); } };
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0b0e13", overflow: "auto", padding: 12 }}>
      {/* toolbar — category filters (left) + export (right), floats over the board */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 8, pointerEvents: "none" }}>
        <div style={{ display: "flex", gap: 5, pointerEvents: "auto", background: "#0b0e13cc", border: "1px solid #1b2230", borderRadius: 9, padding: "4px 6px" }}>
          {BOARD_FILTERS.map((f) => <button key={f.id} style={btn(filt === f.id)} onClick={() => setFilt(f.id)}>{f.label}</button>)}
        </div>
        <div style={{ display: "flex", gap: 6, pointerEvents: "auto", background: "#0b0e13cc", border: "1px solid #1b2230", borderRadius: 9, padding: "4px 6px" }}>
          <span style={{ alignSelf: "center", fontFamily: T.mono, fontSize: 10.5, color: T.faint, padding: "0 4px" }}>{slots.length} шт.{busy ? " · собираю…" : ""}</span>
          <button style={btn(false, "primary")} disabled={busy || !slots.length} onClick={() => save("png")}>⬇ PNG</button>
          <button style={btn()} disabled={busy || !slots.length} onClick={() => save("jpeg")}>⬇ JPG</button>
        </div>
      </div>
      {/* masonry via CSS columns — tiles flow top-to-bottom then wrap, keeping natural heights */}
      <div style={{ columns: "184px", columnGap: 10 }}>
        {slots.map((s) => (
          <div key={s} onClick={() => setOpen(s)} style={{ breakInside: "avoid", marginBottom: 10, position: "relative", borderRadius: 8, overflow: "hidden", background: "#000", border: "1px solid #1b2230", cursor: "zoom-in" }}>
            <KitThumb slot={s} style={{ height: "auto" }} />
            {labels && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, fontFamily: T.mono, fontSize: 10, lineHeight: 1.3, color: "#eaf3ff", background: "linear-gradient(transparent,#000d 60%)", padding: "14px 6px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s}</div>}
          </div>
        ))}
      </div>
      {/* lightbox — click opens the texture big; click anywhere to close */}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 50, background: "#000d", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: 30 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, maxWidth: "90%", maxHeight: "92%" }}>
            <div style={{ maxWidth: "100%", maxHeight: "82vh", borderRadius: 10, overflow: "hidden", border: "1px solid #2b3547", boxShadow: "0 20px 60px #000a" }}><KitThumb slot={open} style={{ height: "auto", maxHeight: "82vh", width: "auto", maxWidth: "100%", objectFit: "contain" }} /></div>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: "#eaf3ff" }}>{open}</div>
          </div>
        </div>
      )}
    </div>
  );
}
const WALL_LBL: Record<string, string> = { plat_side: "борт", back_panel: "панели", back_hatch: "люки", back_pipes: "трубы", back_cargo: "трюм", back_reactor: "реактор", back_vents: "вентиляция", hang: "кран/указатель", ground: "терминал/генератор", set: "набор (5)", wallgroup: "стены-группы",
};
const KIT_GROUPS: { key: string; label: string; modes: string[] }[] = [
  { key: "struct", label: "Структура", modes: ["beam", "ramp", "bridge", "lift", "pillar", "ladder", "railing"] },
  { key: "props", label: "Пропсы", modes: ["crate", "barrel", "cover", "deco2", "ground", "set"] },
  { key: "play", label: "Игровое", modes: ["pickup", "gate", "jumppad"] },
  { key: "depth", label: "Глубина/фон", modes: ["city", "backwall", "scene"] },
  { key: "detail", label: "Детали", modes: ["signs", "deco", "wallgroup", "hang", "built", "cables", "pipe", "pipes"] },
  { key: "misc", label: "Плоско", modes: ["flat", "all"] },
];

export function KitLab() {
  const [cat, setCat] = useState<string>(() => KIT_GROUPS.find((g) => g.modes.includes((new URLSearchParams(location.search).get("m") as string) || "beam"))?.key ?? "struct");
  const [wallTex, setWallTex] = useState("plat_side");
  const [items, setItems] = useState<Item[]>([]);
  const [big, setBig] = useState<string | null>(null);
  const [mode, setMode] = useState<"crate" | "beam" | "ladder" | "ramp" | "barrel" | "pillar" | "railing" | "pickup" | "gate" | "cover" | "bridge" | "city" | "signs" | "deco" | "backwall" | "scene" | "deco2" | "built" | "hang" | "ground" | "set" | "wallgroup" | "jumppad" | "lift" | "cables" | "pipe" | "pipes" | "flat" | "all">(() => { try { return (new URLSearchParams(location.search).get("m") as any) || "crate"; } catch { return "crate"; } });
  const [bump, setBump] = useState(true);
  const [sheetLabels, setSheetLabels] = useState(true); // contact-sheet filename labels (off = clean screenshot)
  const go = (h: string) => { window.location.hash = h; window.location.reload(); };

  useEffect(() => {
    fetch("/cosmos/kit/_manifest.json").then((r) => r.json())
      .then((m) => setItems(Object.entries(m).map(([slot, v]: any) => ({ slot, ...v }))))
      .catch(() => setItems([]));
  }, []);
  const total = items.reduce((s, i) => s + (i.costUSD || 0), 0);

  return (
    <div className="studio-root" style={{ position: "fixed", inset: 0, background: T.bg, color: T.ink, fontFamily: T.ui, display: "grid", gridTemplateColumns: "1fr 300px", gridTemplateRows: "40px 1fr" }}>
      {/* top bar — category groups → modes (подгруппы, чтобы не было длинного ряда) */}
      <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", background: T.panelSolid, borderBottom: `1px solid ${T.border}`, overflow: "hidden" }}>
        <b style={{ color: T.accent, fontFamily: T.display, fontSize: 14, whiteSpace: "nowrap" }}>📦 Ассеты</b>
        {/* category tabs */}
        <div style={{ display: "flex", gap: 5, marginLeft: 4 }}>
          {KIT_GROUPS.map((g) => (
            <button key={g.key} style={btn(g.modes.includes(mode as string))} onClick={() => { setCat(g.key); setMode(g.modes[0] as any); }}>{g.label}</button>
          ))}
        </div>
        <span style={{ width: 1, height: 18, background: T.border }} />
        {/* modes inside the active category */}
        <div style={{ display: "flex", gap: 5, minWidth: 0, overflowX: "auto" }}>
          {(KIT_GROUPS.find((g) => g.key === cat) ?? KIT_GROUPS[0]).modes.map((m) => (
            <button key={m} style={btn(mode === m)} onClick={() => setMode(m as any)}>{MODE_LABEL[m] ?? m}{m === "flat" && big ? ` · ${big}` : ""}</button>
          ))}
        </div>
        {mode === "wallgroup" && (
          <>
            <span style={{ width: 1, height: 18, background: T.border }} />
            <span style={{ fontSize: 10, color: T.dim, whiteSpace: "nowrap" }}>стена:</span>
            <div style={{ display: "flex", gap: 4 }}>
              {["plat_side", "back_panel", "back_hatch", "back_pipes", "back_cargo", "back_reactor", "back_vents"].map((w) => (
                <button key={w} style={btn(wallTex === w)} onClick={() => setWallTex(w)}>{WALL_LBL[w] ?? w}</button>
              ))}
            </div>
          </>
        )}
        {mode === "all" && (
          <>
            <span style={{ width: 1, height: 18, background: T.border }} />
            <button style={btn(sheetLabels)} onClick={() => setSheetLabels((v) => !v)} title="имена файлов на плитках (выключи для чистого скриншота)">подписи</button>
          </>
        )}
        <button style={{ ...btn(bump), marginLeft: "auto", whiteSpace: "nowrap" }} onClick={() => setBump((v) => !v)}>рельеф</button>
        <span style={{ color: T.faint, fontFamily: T.mono, fontSize: 11, whiteSpace: "nowrap" }}>{items.length} · ~${total.toFixed(2)}</span>
        <button style={btn()} onClick={() => go("studio")}>← студия</button>
      </div>

      {/* 3D viewport */}
      <div style={{ position: "relative", minWidth: 0 }}>
        <Canvas shadows camera={{ position: [3, 2.4, 4.2], fov: 42 }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }} style={{ position: "absolute", inset: 0 }}>
          <color attach="background" args={["#20262e"]} />
          <ambientLight intensity={1.15} />
          <hemisphereLight args={["#cfe6ff", "#3a4048", 0.9]} />
          <directionalLight intensity={1.9} position={[4, 6, 4]} castShadow />
          <directionalLight intensity={0.9} position={[-4, 3, -2]} />
          <directionalLight intensity={0.7} position={[0, 2, 6]} />
          <Suspense fallback={null}>
            {mode === "crate" ? <CrateBox bump={bump} /> : mode === "beam" ? <BeamBox bump={bump} /> : mode === "ladder" ? <Decal slot="ladder" ratio={768 / 1376} h={5} /> : mode === "ramp" ? <RampBox bump={bump} /> : mode === "barrel" ? <BarrelMesh bump={bump} /> : mode === "pillar" ? <PillarBox bump={bump} /> : mode === "railing" ? <RailingDepth bump={bump} /> : mode === "pickup" ? <PickupsRow bump={bump} /> : mode === "gate" ? <AnimGate ctl={{ period: 5, closeDur: 0.35, closedHold: 0.5, mode: "auto" }} w={2.8} h={4.2} /> : mode === "cover" ? <CoverRow bump={bump} /> : mode === "bridge" ? <BridgeBox bump={bump} /> : mode === "city" ? <group scale={0.12} position={[0, 0.2, 0]}><FarCity z={0} baseY={-3} n={10} spread={44} /></group> : mode === "signs" ? <SignsRow /> : mode === "deco" ? <DecoRow /> : mode === "backwall" ? <BackWallDemo bump={bump} /> : mode === "scene" ? <SceneDemo bump={bump} /> : mode === "deco2" ? <Deco2Row bump={bump} /> : mode === "built" ? <BuiltPipeRow bump={bump} /> : mode === "hang" ? <HangRow bump={bump} /> : mode === "ground" ? <GroundPropsRow bump={bump} /> : mode === "set" ? <KitSetRow bump={bump} /> : mode === "wallgroup" ? <WallGroupRow bump={bump} wall={wallTex} /> : mode === "jumppad" ? <JumpPad bump={bump} /> : mode === "lift" ? <LiftRig bump={bump} /> : mode === "cables" ? <ProcCables /> : mode === "pipe" ? <ProcPipe bump={bump} /> : mode === "pipes" ? <Decal slot="pipes" ratio={3 / 4} h={4.6} /> : big ? <TexturePlane slot={big} /> : <CrateBox bump={bump} />}
          </Suspense>
          <gridHelper args={[20, 20, "#2b323c", "#1e242c"]} position={[0, -1.3, 0]} />
          <OrbitControls enablePan enableDamping dampingFactor={0.1} target={[0, 0, 0]} />
        </Canvas>
        <div style={{ position: "absolute", left: 12, bottom: 12, color: T.faint, fontFamily: T.mono, fontSize: 11, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 9px" }}>ЛКМ — вращать · колесо — зум · ПКМ — панорама</div>
        {mode === "all" && <AllTextures items={items} labels={sheetLabels} />}
      </div>

      {/* library */}
      <div style={{ background: T.panel, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "9px 11px", borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.dim, letterSpacing: ".05em" }}>БИБЛИОТЕКА ТЕКСТУР</div>
        <div style={{ overflow: "auto", padding: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {items.length === 0 && <div style={{ gridColumn: "1 / -1", color: T.faint, fontSize: 12, padding: 8 }}>Пока пусто. Сгенерируй текстуры: <code>tools/gen-kit-texture.mjs</code>.</div>}
          {items.map((it) => (
            <button key={it.slot} onClick={() => { setBig(it.slot); setMode("flat"); }} style={{ cursor: "pointer", textAlign: "left", background: big === it.slot ? T.bg2 : "transparent", border: `1px solid ${big === it.slot ? T.accent : T.border}`, borderRadius: 8, padding: 6, color: T.ink }}>
              <div style={{ width: "100%", aspectRatio: "1", borderRadius: 5, overflow: "hidden", background: "#0008", marginBottom: 5 }}><KitThumb slot={it.slot} /></div>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.slot}</div>
              <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.faint }}>{it.size ?? ""} {it.costUSD ? `· $${it.costUSD.toFixed(2)}` : ""}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
