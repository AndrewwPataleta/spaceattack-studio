// Animated GATE block — world/corridor (gate_corridor, baked lit tunnel) behind two blast-door leaves (gate_leaf,
// octagon-half shape via alpha; right = mirror of left) that procedurally slide open/shut. Clipping planes bound the
// doorway (offset by the block's world centre) so the leaves tuck into pockets and never cover the frame. Reusable
// in #gatelab (controls), #kit (preview) and the arena backdrop. NON-collider decor. Needs gl.localClippingEnabled.
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type GateCtl = { period: number; closeDur: number; closedHold: number; mode: "auto" | "open" | "closed" };

export function gateOpenness(t: number, c: GateCtl) {
  if (c.mode === "open") return 1;
  if (c.mode === "closed") return 0;
  const P = Math.max(c.closeDur * 2 + c.closedHold + 0.3, c.period);
  const p = ((t % P) + P) % P;
  const openHold = P - (c.closeDur * 2 + c.closedHold);
  if (p < openHold) return 1;
  if (p < openHold + c.closeDur) return 1 - (p - openHold) / c.closeDur;
  if (p < openHold + c.closeDur + c.closedHold) return 0;
  return (p - openHold - c.closeDur - c.closedHold) / c.closeDur;
}

// tuning knobs so the leaf's beveled corners can be dialled onto the frame's beveled corners (set live in #gatelab)
export type GateFit = { openWFrac: number; openHFrac: number; leafWMul: number; leafHMul: number; leafYOff: number; overlap: number; bevel: number };
export const DEFAULT_FIT: GateFit = { openWFrac: 0.345, openHFrac: 0.375, leafWMul: 0.96, leafHMul: 1, leafYOff: -0.06, overlap: 0.05, bevel: 0.3 };
const LEAF_DEPTH = 0.24; // door thickness → real 3D front + sides (clipping cuts the whole prism into an octagon)

// build the LEFT-leaf outline = a rectangle with the OUTER (left) corners cut → the left half of an octagon.
function leafShape(leafW: number, leafH: number, cut: number) {
  const hw = leafW / 2, hh = leafH / 2, c = Math.min(cut, hw * 0.9, hh * 0.9);
  const s = new THREE.Shape();
  s.moveTo(hw, -hh); s.lineTo(hw, hh); s.lineTo(-hw + c, hh); s.lineTo(-hw, hh - c); s.lineTo(-hw, -hh + c); s.lineTo(-hw + c, -hh); s.closePath();
  return { s, hw, hh };
}
// normalize the cap UVs to 0..1 over the leaf bounding box so the front texture maps cleanly onto the octagon face.
function capUVGen(hw: number, hh: number) {
  const nx = (x: number) => (x + hw) / (2 * hw), ny = (y: number) => (y + hh) / (2 * hh);
  return {
    generateTopUV: (_g: any, v: number[], a: number, b: number, c: number) => [new THREE.Vector2(nx(v[a * 3]), ny(v[a * 3 + 1])), new THREE.Vector2(nx(v[b * 3]), ny(v[b * 3 + 1])), new THREE.Vector2(nx(v[c * 3]), ny(v[c * 3 + 1]))],
    generateSideWallUV: () => [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1)],
  };
}

function Leaf({ side, leafW, leafH, cut, cx, cz, yOff, overlap, shapeOnly, ctlRef, planes }: { side: 1 | -1; leafW: number; leafH: number; cut: number; cx: number; cz: number; yOff: number; overlap: number; shapeOnly?: boolean; ctlRef: React.MutableRefObject<GateCtl>; planes: THREE.Plane[] }) {
  const ref = useRef<THREE.Group>(null);
  const tex = useTexture("/cosmos/kit/gate_leaf.webp");
  const side_ = useTexture("/cosmos/kit/sup_side.webp");
  // REAL 3D door: extrude the octagon-half outline into a prism (front face + capped bevel + textured side walls).
  const geo = useMemo(() => {
    const { s, hw, hh } = leafShape(leafW, leafH, cut);
    return new THREE.ExtrudeGeometry(s, { depth: LEAF_DEPTH, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1, UVGenerator: capUVGen(hw, hh) as any });
  }, [leafW, leafH, cut]);
  const mats = useMemo(() => {
    const clip = { clippingPlanes: planes, clipShadows: true };
    if (shapeOnly) { const g = new THREE.MeshStandardMaterial({ color: "#5a6672", metalness: 0.3, roughness: 0.65, ...clip }); return [g, g]; }
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    side_.colorSpace = THREE.SRGBColorSpace; side_.wrapS = side_.wrapT = THREE.RepeatWrapping; side_.anisotropy = 8;
    const front = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.35, roughness: 0.6, ...clip });     // caps (front/back)
    const wall = new THREE.MeshStandardMaterial({ map: side_, color: "#8a95a4", metalness: 0.45, roughness: 0.55, ...clip }); // extruded side walls
    return [front, wall];
  }, [tex, side_, planes, shapeOnly]);
  useFrame((st) => {
    const g = ref.current; if (!g) return;
    const o = gateOpenness(st.clock.elapsedTime, ctlRef.current);
    const closedX = side * (leafW / 2 - overlap);
    g.position.x = cx + closedX + side * o * (leafW + overlap * 2);
  });
  return (
    <group ref={ref} position={[cx, yOff, cz + 0.05]} scale={[side === 1 ? -1 : 1, 1, 1]}>
      <mesh geometry={geo} material={mats} castShadow />
    </group>
  );
}

// full octagon outline (4 corners cut by bev) — used as the hole in the wall so it matches the two closed leaves.
function octagonPath(hw: number, hh: number, bev: number) {
  const b = Math.min(bev, hw * 0.9, hh * 0.9);
  const p = new THREE.Path();
  p.moveTo(hw, hh - b); p.lineTo(hw - b, hh); p.lineTo(-hw + b, hh); p.lineTo(-hw, hh - b);
  p.lineTo(-hw, -hh + b); p.lineTo(-hw + b, -hh); p.lineTo(hw - b, -hh); p.lineTo(hw, -hh + b); p.closePath();
  return p;
}

// 3D recessed TUNNEL behind the doorway: an inward-facing box (BackSide walls/floor/ceiling) + a glowing back panel
// + light + haze → real depth "deeper into the station" that only shows when the doors slide open.
function Tunnel({ cx, cz, hw, hh, depth, wall, lightColor, glow }: { cx: number; cz: number; hw: number; hh: number; depth: number; wall: THREE.Texture; lightColor: string; glow: number }) {
  const wmat = useMemo(() => new THREE.MeshStandardMaterial({ map: wall, color: "#6b7480", metalness: 0.4, roughness: 0.7, side: THREE.BackSide, fog: false }), [wall]);
  return (
    <group position={[cx, 0, cz]}>
      <mesh material={wmat} position={[0, 0, -depth / 2]}><boxGeometry args={[hw * 2, hh * 2, depth]} /></mesh>
      <mesh position={[0, 0, -depth + 0.02]}><planeGeometry args={[hw * 2, hh * 2]} /><meshBasicMaterial color={lightColor} toneMapped={false} fog={false} /></mesh>
      <pointLight color={lightColor} intensity={2.4 * glow} distance={depth * 3} position={[0, 0, -depth * 0.7]} />
      {[-depth * 0.65, -depth * 0.3].map((z, i) => (
        <mesh key={i} position={[0, 0, z]}><planeGeometry args={[hw * 1.7, hh * 1.7]} /><meshBasicMaterial color={lightColor} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} /></mesh>
      ))}
    </group>
  );
}

export function AnimGate({ cx = 0, cy = 0, cz = 0, w = 3.4, h = 5.1, ctl, fit = DEFAULT_FIT, shapeOnly = false, glow = 0.95, lightColor = "#ffb26a" }: { cx?: number; cy?: number; cz?: number; w?: number; h?: number; ctl: GateCtl; fit?: GateFit; shapeOnly?: boolean; glow?: number; lightColor?: string }) {
  const ctlRef = useRef(ctl); ctlRef.current = ctl;
  const HW = fit.openWFrac * w, HH = fit.openHFrac * h;
  const leafW = HW * fit.leafWMul, leafH = HH * 2 * fit.leafHMul;
  const wallTex = useTexture("/cosmos/kit/plat_deck.webp"); // neutral metal panels for the wall face
  const tunTex = useTexture("/cosmos/kit/sup_side.webp");   // ribbed metal for the tunnel interior walls
  // hole matches the two CLOSED leaves exactly (a hair smaller so the doors overlap it → no light leak / gaps).
  const holeHW = leafW - fit.overlap - 0.02, holeHH = leafH / 2 - 0.02;
  // FRONT WALL = a metal panel with that OCTAGON HOLE; UVs normalized to 0..1 over the panel then tiled cleanly.
  const wallTexN = useMemo(() => { const t = wallTex.clone(); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 3.5); t.anisotropy = 8; t.needsUpdate = true; return t; }, [wallTex]);
  const wallGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
    s.holes = [octagonPath(holeHW, holeHH, fit.bevel)];
    const g = new THREE.ShapeGeometry(s);
    g.computeBoundingBox(); const bb = g.boundingBox!; const uv = g.attributes.uv, pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
    uv.needsUpdate = true; return g;
  }, [w, h, holeHW, holeHH, fit.bevel]);
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: wallTexN, color: "#7a8492", metalness: 0.4, roughness: 0.65, fog: false }), [wallTexN]);
  // clipping is only the 2 VERTICAL doorway edges → leaves vanish into their side pockets when they slide open.
  const planes = useMemo(() => [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), HW - cx),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), HW + cx),
  ], [HW, cx]);
  return (
    <group position={[0, cy, 0]}>
      <Tunnel cx={cx} cz={cz - 0.05} hw={holeHW * 0.96} hh={holeHH * 0.96} depth={2.0} wall={tunTex} lightColor={lightColor} glow={glow} />
      <mesh geometry={wallGeo} material={wallMat} position={[cx, 0, cz]} />
      <Leaf side={-1} leafW={leafW} leafH={leafH} cut={fit.bevel} cx={cx} cz={cz} yOff={fit.leafYOff} overlap={fit.overlap} shapeOnly={shapeOnly} ctlRef={ctlRef} planes={planes} />
      <Leaf side={1} leafW={leafW} leafH={leafH} cut={fit.bevel} cx={cx} cz={cz} yOff={fit.leafYOff} overlap={fit.overlap} shapeOnly={shapeOnly} ctlRef={ctlRef} planes={planes} />
    </group>
  );
}
