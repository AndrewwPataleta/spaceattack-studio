// Distant STATION SKYLINE — procedural silhouette buildings (dark boxes) with lit window grids, for background
// parallax depth behind the arena (the "citadel" read from world_mock). Fully procedural, 0 textures. Deterministic
// (index hashes, no random) so it's stable. NON-collider decor — mount in the backdrop far layer. Reusable in #kit.
import { useMemo } from "react";
import * as THREE from "three";

const hash = (i: number, k: number, m: number) => ((i * 73 + k * 149 + 17) % m);

function Building({ x, y, z, w, h, depth, warm }: { x: number; y: number; z: number; w: number; h: number; depth: number; warm: boolean }) {
  // window grid on the front face (some lit, some dark) — cheap emissive planes
  const wins = useMemo(() => {
    const cols = Math.max(2, Math.round(w / 0.9)), rows = Math.max(3, Math.round(h / 1.1));
    const out: { wx: number; wy: number; on: boolean; c: string }[] = [];
    const mx = w * 0.42, my = h * 0.42;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const on = hash(r + 1, c + 3, 10) > 4; // ~half lit, deterministic
      const col = warm ? (hash(r, c, 7) > 4 ? "#ffcf8a" : "#ff9a4a") : (hash(r, c, 7) > 4 ? "#6fe0ff" : "#3aa6ff");
      out.push({ wx: cols > 1 ? -mx + (c / (cols - 1)) * mx * 2 : 0, wy: rows > 1 ? -my + (r / (rows - 1)) * my * 2 : 0, on, c: col });
    }
    return out;
  }, [w, h, warm]);
  return (
    <group position={[x, y, z]}>
      <mesh><boxGeometry args={[w, h, depth]} /><meshBasicMaterial color="#141a28" fog={false} /></mesh>
      {wins.filter((v) => v.on).map((v, i) => (
        <mesh key={i} position={[v.wx, v.wy, depth / 2 + 0.02]}><planeGeometry args={[0.16, 0.22]} /><meshBasicMaterial color={v.c} transparent opacity={0.85} toneMapped={false} fog={false} /></mesh>
      ))}
    </group>
  );
}

export function FarCity({ z = -14, baseY = -8, n = 13, spread = 76, warm = false }: { z?: number; baseY?: number; n?: number; spread?: number; warm?: boolean }) {
  const blds = useMemo(() => Array.from({ length: n }, (_, i) => {
    const w = 2.4 + hash(i, 1, 5) * 0.9;
    const h = 8 + hash(i, 3, 12);
    return { x: -spread / 2 + (i / (n - 1)) * spread + hash(i, 7, 3) - 1, h, w, z: z - hash(i, 5, 5), warm: warm || hash(i, 9, 6) > 4 };
  }), [z, n, spread, warm]);
  return (
    <group>
      {blds.map((b, i) => <Building key={i} x={b.x} y={baseY + b.h / 2} z={b.z} w={b.w} h={b.h} depth={2.2} warm={b.warm} />)}
    </group>
  );
}
