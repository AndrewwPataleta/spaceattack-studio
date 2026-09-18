// #gatelab — animated GATE lab: tune the living gateway (world/corridor behind procedurally sliding blast-doors).
// The rig itself lives in src/arena/AnimGate.tsx (shared with #kit + the arena). Here we just drive it + controls.
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Suspense, useRef, useState } from "react";
import { AnimGate, GateCtl, GateFit, DEFAULT_FIT } from "../arena/AnimGate";
import { T, btn } from "./theme";

export function GateLab() {
  const [ctl, setCtl] = useState<GateCtl>({ period: 5, closeDur: 0.35, closedHold: 0.5, mode: "closed" });
  const [fit, setFit] = useState<GateFit>(DEFAULT_FIT);
  const [shapeOnly, setShapeOnly] = useState(true);
  const go = (h: string) => { window.location.hash = h; window.location.reload(); };
  const setF = (k: keyof GateFit) => (v: number) => setFit({ ...fit, [k]: v });
  const Row = ({ label, val, min, max, step, set }: any) => (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.ink }}>
      <span style={{ width: 92, color: T.dim }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(parseFloat(e.target.value))} style={{ flex: 1 }} />
      <span style={{ width: 38, fontFamily: T.mono, color: T.faint }}>{val}</span>
    </label>
  );
  return (
    <div className="studio-root" style={{ position: "fixed", inset: 0, background: T.bg, color: T.ink, fontFamily: T.ui }}>
      <Canvas shadows camera={{ position: [2.1, 0.7, 7.2], fov: 40 }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }} style={{ position: "absolute", inset: 0 }}>
        <color attach="background" args={["#0e131a"]} />
        <ambientLight intensity={1.0} />
        <directionalLight intensity={1.3} position={[3, 4, 6]} />
        <Suspense fallback={null}>
          <AnimGate ctl={ctl} fit={fit} shapeOnly={shapeOnly} />
        </Suspense>
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.5} luminanceSmoothing={0.4} radius={0.6} />
        </EffectComposer>
        <OrbitControls enablePan enableDamping target={[0, 0, 0]} />
      </Canvas>
      <div style={{ position: "absolute", left: 14, top: 14, width: 300, background: T.panelSolid, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 9 }}>
        <b style={{ color: T.accent, fontFamily: T.display, fontSize: 14 }}>🚪 Ворота — анимация</b>
        <div style={{ display: "flex", gap: 6 }}>
          {(["auto", "open", "closed"] as const).map((m) => (
            <button key={m} style={btn(ctl.mode === m)} onClick={() => setCtl({ ...ctl, mode: m })}>{m === "auto" ? "цикл" : m === "open" ? "открыто" : "закрыто"}</button>
          ))}
        </div>
        <Row label="период, с" val={ctl.period} min={2} max={10} step={0.5} set={(v: number) => setCtl({ ...ctl, period: v })} />
        <Row label="скор. створ" val={ctl.closeDur} min={0.12} max={1.2} step={0.02} set={(v: number) => setCtl({ ...ctl, closeDur: v })} />
        <Row label="держ. закр" val={ctl.closedHold} min={0} max={2} step={0.1} set={(v: number) => setCtl({ ...ctl, closedHold: v })} />
        <div style={{ height: 1, background: T.border, margin: "2px 0" }} />
        <button style={btn(shapeOnly)} onClick={() => setShapeOnly((v) => !v)}>{shapeOnly ? "● только форма (без текстуры)" : "○ с текстурой"}</button>
        <span style={{ fontSize: 11, color: T.dim, letterSpacing: ".05em" }}>ПОСАДКА СТВОРОК (закрой ⇧ и подгони углы к раме)</span>
        <Row label="проём W" val={fit.openWFrac} min={0.24} max={0.42} step={0.005} set={setF("openWFrac")} />
        <Row label="проём H" val={fit.openHFrac} min={0.30} max={0.46} step={0.005} set={setF("openHFrac")} />
        <Row label="створка ×W" val={fit.leafWMul} min={0.8} max={1.25} step={0.01} set={setF("leafWMul")} />
        <Row label="створка ×H" val={fit.leafHMul} min={0.8} max={1.2} step={0.01} set={setF("leafHMul")} />
        <Row label="сдвиг Y" val={fit.leafYOff} min={-0.5} max={0.5} step={0.02} set={setF("leafYOff")} />
        <Row label="нахлёст" val={fit.overlap} min={0} max={0.35} step={0.01} set={setF("overlap")} />
        <Row label="срезка углов" val={fit.bevel} min={0} max={1.6} step={0.01} set={setF("bevel")} />
        <code style={{ fontSize: 10, color: T.faint, fontFamily: T.mono, wordBreak: "break-all", background: T.bg2, padding: "5px 6px", borderRadius: 6 }}>fit = {JSON.stringify(fit)}</code>
        <button style={btn()} onClick={() => go("kit?m=gate")}>← в кит</button>
      </div>
    </div>
  );
}
