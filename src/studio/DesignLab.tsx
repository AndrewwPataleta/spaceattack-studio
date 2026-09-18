// #dslab — DESIGN SYSTEM lab. Several full theme variants (tokens + fonts) rendered on the REAL studio component
// set (toolbar, panels, inspector fields, chips, validation badge, popover, typography). Pick one and we restyle
// the whole studio to those tokens. Purely presentational — no app state touched (except remembering your pick).
import { useState } from "react";

type Tokens = {
  id: string; label: string; mood: string;
  bg: string; bg2: string; panel: string; border: string; ink: string; dim: string; faint: string;
  accent: string; accentInk: string; accent2: string; good: string; warn: string; bad: string;
  chip: string; radius: number; shadow: string; ui: string; mono: string; display: string; glass?: boolean;
};

const F = {
  grotesk: "'Space Grotesk', system-ui, sans-serif",
  sora: "'Sora', system-ui, sans-serif",
  jakarta: "'Plus Jakarta Sans', system-ui, sans-serif",
  inter: "'Inter', system-ui, sans-serif",
  manrope: "'Manrope', system-ui, sans-serif",
  plexsans: "'IBM Plex Sans', system-ui, sans-serif",
  outfit: "'Outfit', system-ui, sans-serif",
  onest: "'Onest', system-ui, sans-serif",
  dmsans: "'DM Sans', system-ui, sans-serif",
  lexend: "'Lexend', system-ui, sans-serif",
  urbanist: "'Urbanist', system-ui, sans-serif",
  rubik: "'Rubik', system-ui, sans-serif",
  figtree: "'Figtree', system-ui, sans-serif",
  spacemono: "'Space Mono', ui-monospace, monospace",
  plexmono: "'IBM Plex Mono', ui-monospace, monospace",
};

const THEMES: Tokens[] = [
  { id: "cosmos", label: "Cosmos Blue", mood: "как сейчас, но чище — космический синий, cyan-акцент",
    bg: "#0b1526", bg2: "#0e1a2e", panel: "#0e1830ee", border: "#22406a", ink: "#e7ecf5", dim: "#9fb4d0", faint: "#5a6a8c",
    accent: "#7ee7ff", accentInk: "#05121f", accent2: "#37ff9a", good: "#37ff9a", warn: "#ffb14d", bad: "#ff6b7a",
    chip: "#173a2c", radius: 11, shadow: "0 18px 50px -18px rgba(0,0,0,.6)", ui: F.grotesk, mono: F.plexmono, display: F.grotesk },
  { id: "aurora", label: "Aurora Glass", mood: "тот же синий, но стеклянные панели и мягкое свечение — премиум",
    bg: "#070f1e", bg2: "#0c1a30", panel: "rgba(18,32,58,0.55)", border: "#2a4a78", ink: "#eaf2ff", dim: "#9db4d6", faint: "#5a7098",
    accent: "#63d3ff", accentInk: "#04121f", accent2: "#8affc1", good: "#7dffbf", warn: "#ffc15e", bad: "#ff7a88",
    chip: "#123047", radius: 14, shadow: "0 24px 70px -20px rgba(20,120,200,.35)", ui: F.sora, mono: F.plexmono, display: F.sora, glass: true },
  { id: "midnight", label: "Midnight Violet", mood: "нейтрально-тёмная, фиолетово-циан акценты — киберпанк-минимал",
    bg: "#0a0b10", bg2: "#14151e", panel: "#14161fee", border: "#262a38", ink: "#e9eaf2", dim: "#9a9fb2", faint: "#5c6072",
    accent: "#a78bfa", accentInk: "#100a22", accent2: "#22d3ee", good: "#4ade80", warn: "#fbbf24", bad: "#fb7185",
    chip: "#241a3a", radius: 12, shadow: "0 20px 60px -18px rgba(0,0,0,.7)", ui: F.jakarta, mono: F.plexmono, display: F.jakarta },
  { id: "light", label: "Light Studio", mood: "светлая как в редакторах — воздух, синий primary, мягкие тени",
    bg: "#eef2f8", bg2: "#e4eaf3", panel: "#ffffff", border: "#dbe3ee", ink: "#16202e", dim: "#5b6b82", faint: "#98a6bb",
    accent: "#2563eb", accentInk: "#ffffff", accent2: "#0ea5a0", good: "#0f9d58", warn: "#d97706", bad: "#dc2626",
    chip: "#e6f0ff", radius: 12, shadow: "0 14px 40px -12px rgba(20,40,80,.18)", ui: F.jakarta, mono: F.plexmono, display: F.jakarta },
  { id: "slate", label: "Slate Pro", mood: "строгая графит-сталь, оранжевый hazard-акцент — индустриальный",
    bg: "#101317", bg2: "#181c22", panel: "#181c22ee", border: "#2b323c", ink: "#e6e9ee", dim: "#98a1af", faint: "#5b6472",
    accent: "#f0a63a", accentInk: "#1a1206", accent2: "#5fd0ff", good: "#5ec98a", warn: "#f0a63a", bad: "#ef5f6b",
    chip: "#2a2214", radius: 8, shadow: "0 18px 50px -18px rgba(0,0,0,.65)", ui: F.manrope, mono: F.plexmono, display: F.manrope },
];

const FONT_CHOICES: { id: string; label: string; v: string }[] = [
  { id: "grotesk", label: "Space Grotesk", v: F.grotesk },
  { id: "sora", label: "Sora", v: F.sora },
  { id: "jakarta", label: "Plus Jakarta Sans", v: F.jakarta },
  { id: "inter", label: "Inter", v: F.inter },
  { id: "manrope", label: "Manrope", v: F.manrope },
  { id: "plexsans", label: "IBM Plex Sans", v: F.plexsans },
  { id: "outfit", label: "Outfit", v: F.outfit },
  { id: "onest", label: "Onest", v: F.onest },
  { id: "dmsans", label: "DM Sans", v: F.dmsans },
  { id: "lexend", label: "Lexend", v: F.lexend },
  { id: "urbanist", label: "Urbanist", v: F.urbanist },
  { id: "rubik", label: "Rubik", v: F.rubik },
  { id: "figtree", label: "Figtree", v: F.figtree },
];

// number/mono font choices — used for the code-like fields (coords, ids)
const MONO_CHOICES: { id: string; label: string; v: string }[] = [
  { id: "plexmono", label: "IBM Plex Mono", v: F.plexmono },
  { id: "spacemono", label: "Space Mono", v: F.spacemono },
];

// rounding presets — from sharp to pill
const RADII: { id: string; label: string; v: number }[] = [
  { id: "sharp", label: "0 острые", v: 0 },
  { id: "r4", label: "4", v: 4 },
  { id: "r6", label: "6", v: 6 },
  { id: "r8", label: "8", v: 8 },
  { id: "r10", label: "10", v: 10 },
  { id: "r12", label: "12", v: 12 },
  { id: "r16", label: "16", v: 16 },
  { id: "r20", label: "20 капсула", v: 20 },
];

// button treatment — solves "why is button text always black": pick white / dark / accent-on-dark / outline
type BtnStyle = "contrast" | "white" | "darkAccent" | "outline";
const BTN_STYLES: { id: BtnStyle; label: string }[] = [
  { id: "contrast", label: "яркая + контраст-текст" },
  { id: "white", label: "яркая + белый текст" },
  { id: "darkAccent", label: "тёмная + акцент-текст" },
  { id: "outline", label: "контур" },
];

const KIND = { plat: "#ffd24d", ramp: "#f0a63a", ladder: "#7ee7ff", sup: "#7aa0d8" };

// A realistic mini-STUDIO rendered in the given tokens, so the choice is judged on the actual components.
function Preview({ t, ui, radius, btnStyle }: { t: Tokens; ui: string; radius: number; btnStyle: BtnStyle }) {
  const r = radius;
  // accent-filled treatment (primary + active): chosen text/bg style so it's not forced-dark-text
  const filled = (): React.CSSProperties =>
    btnStyle === "white" ? { background: t.accent, color: "#ffffff", border: `1px solid ${t.accent}` }
    : btnStyle === "darkAccent" ? { background: t.bg2, color: t.accent, border: `1px solid ${t.accent}` }
    : btnStyle === "outline" ? { background: "transparent", color: t.accent, border: `1px solid ${t.accent}` }
    : { background: t.accent, color: t.accentInk, border: `1px solid ${t.accent}` };
  const btn = (kind: "ghost" | "primary" | "danger" | "chip", active?: boolean): React.CSSProperties => ({
    fontFamily: ui, fontSize: 12.5, fontWeight: 700, cursor: "pointer", borderRadius: Math.max(0, r - 2), padding: "7px 12px", transition: "all .15s",
    ...(kind === "primary" ? filled()
      : kind === "danger" ? { background: "transparent", color: t.bad, border: `1px solid ${t.bad}55` }
      : active ? filled()
      : { background: t.glass ? "rgba(255,255,255,.06)" : t.bg2, color: t.ink, border: `1px solid ${t.border}` }),
  });
  const card: React.CSSProperties = { background: t.panel, border: `1px solid ${t.border}`, borderRadius: r, boxShadow: t.shadow, backdropFilter: t.glass ? "blur(14px)" : undefined };
  const inputS: React.CSSProperties = { fontFamily: t.mono, fontSize: 12, background: t.glass ? "rgba(0,0,0,.25)" : t.bg, color: t.ink, border: `1px solid ${t.border}`, borderRadius: Math.max(0, r - 4), padding: "5px 8px", width: 58 };
  const label: React.CSSProperties = { fontFamily: ui, fontSize: 12, color: t.dim, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 };
  return (
    <div style={{ background: t.glass ? `radial-gradient(900px 500px at 70% -10%, ${t.bg2}, ${t.bg})` : t.bg, borderRadius: r + 4, padding: 18, display: "flex", flexDirection: "column", gap: 14, minHeight: 520 }}>
      {/* toolbar */}
      <div style={{ ...card, padding: "9px 11px", display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
        <b style={{ fontFamily: t.display, color: t.accent, fontSize: 14, letterSpacing: ".04em" }}>STUDIO</b>
        <span style={btn("ghost", true)}>выбор</span>
        <span style={btn("ghost")}>＋ платформа</span>
        <span style={btn("ghost")}>╱ рампа</span>
        <span style={{ width: 1, height: 20, background: t.border }} />
        <span style={{ fontFamily: ui, fontSize: 11.5, color: t.dim }}>стиль</span>
        <span style={{ ...btn("ghost"), display: "inline-flex", gap: 6 }}>Станция ▾</span>
        <span style={{ marginLeft: "auto" }} />
        <span style={btn("primary")}>▶ играть</span>
      </div>

      <div style={{ display: "flex", gap: 14, flex: 1 }}>
        {/* hierarchy */}
        <div style={{ ...card, width: 190, padding: "10px 11px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ fontFamily: t.mono, fontSize: 12, color: t.ink, background: t.glass ? "rgba(0,0,0,.2)" : t.bg, border: `1px solid ${t.border}`, borderRadius: Math.max(0, r - 4), padding: "5px 7px" }}>Cosmos 4v4</div>
          <div style={{ fontFamily: ui, fontSize: 11, color: t.good, fontWeight: 700 }}>✓ проходимо всеми ролями</div>
          {[["plat", "1 ground"], ["plat", "2 island"], ["ramp", "рампа·ground→lowR"], ["ladder", "лестн·island-bridge"], ["sup", "оп·midR"]].map(([k, lbl], i) => (
            <div key={i} style={{ fontFamily: t.mono, fontSize: 11, color: t.ink, background: i === 1 ? t.chip : (t.glass ? "rgba(255,255,255,.04)" : t.bg2), border: `1px solid ${i === 1 ? t.accent2 : t.border}`, borderRadius: Math.max(0, r - 5), padding: "4px 7px" }}>
              <span style={{ color: (KIND as any)[k] }}>▮</span> {lbl}
            </div>
          ))}
        </div>

        {/* inspector */}
        <div style={{ ...card, width: 230, padding: "12px 13px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: t.display, fontWeight: 800, color: KIND.plat, fontSize: 13 }}>ПЛАТФОРМА · island</div>
          <label style={label}>тип <span style={{ ...inputS, width: "auto" }}>island ▾</span></label>
          <div style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: ui, fontSize: 12, color: t.dim }}>
            x <input readOnly value={0} style={inputS} /> выс <input readOnly value={1.8} style={inputS} /> шир <input readOnly value={6} style={inputS} />
          </div>
          <label style={label}>стиль (скин) <span style={{ ...inputS, width: "auto" }}>— как у карты — ▾</span></label>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={btn("ghost")}>◎ спавн</span>
            <span style={btn("danger")}>удалить</span>
          </div>
          {/* chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
            {["Станция", "Шахта", "Кристалл", "Обломки"].map((s, i) => (
              <span key={s} style={{ fontFamily: ui, fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 999, background: i === 0 ? t.accent : t.chip, color: i === 0 ? t.accentInk : t.ink, border: `1px solid ${t.border}` }}>{s}</span>
            ))}
          </div>
        </div>

        {/* right column: popover + typography */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...card, padding: "15px 16px" }}>
            <div style={{ fontFamily: t.display, fontSize: 15, fontWeight: 800, color: t.accent, marginBottom: 5 }}>1 · Двигай камеру</div>
            <div style={{ fontFamily: ui, fontSize: 12.5, lineHeight: 1.55, color: t.dim }}>Полетай по сцене: нажми W A S D. Пока не сделаешь — дальше не идём.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
              <span style={{ fontFamily: ui, fontSize: 11.5, color: t.faint }}>пропустить</span>
              <span style={{ fontFamily: t.mono, fontSize: 11, color: t.faint }}>2 / 9</span>
              <span style={{ marginLeft: "auto", fontFamily: ui, fontSize: 11.5, fontWeight: 700, color: t.warn }}>↳ сделай действие</span>
            </div>
          </div>
          <div style={{ ...card, padding: "15px 16px", flex: 1 }}>
            <div style={{ fontFamily: t.display, fontSize: 26, fontWeight: 800, color: t.ink, letterSpacing: "-.01em" }}>Level Studio</div>
            <div style={{ fontFamily: ui, fontSize: 13, color: t.dim, lineHeight: 1.6, marginTop: 4 }}>Собери свой уровень — двигай блоки, крась стилями, задавай глубину и сразу играй.</div>
            <div style={{ display: "flex", gap: 16, marginTop: 14, fontFamily: t.mono, fontSize: 12, color: t.dim }}>
              <span>x <b style={{ color: t.accent }}>10.5</b></span><span>выс <b style={{ color: t.accent }}>3.4</b></span><span>шир <b style={{ color: t.accent }}>6.0</b></span>
              <span style={{ color: t.good }}>✓ ok</span><span style={{ color: t.warn }}>⚠ crouch</span><span style={{ color: t.bad }}>✕ blocked</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <span style={btn("primary")}>Начать →</span>
              <span style={btn("ghost")}>назад</span>
              <span style={btn("ghost")}>💾 сохранить</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ctlBtn = (active: boolean, extra?: React.CSSProperties): React.CSSProperties => ({ cursor: "pointer", padding: "6px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: active ? "#7ee7ff" : "#141c2c", color: active ? "#05121f" : "#cfe0ff", border: "1px solid #24324c", ...extra });

export function DesignLab() {
  const [sel, setSel] = useState(0);
  const [fontId, setFontId] = useState<string>("");
  const [radiusId, setRadiusId] = useState<string>("");
  const [btnStyle, setBtnStyle] = useState<BtnStyle>("contrast");
  const [monoId, setMonoId] = useState<string>("plexmono");
  const t = { ...THEMES[sel], mono: MONO_CHOICES.find((m) => m.id === monoId)?.v ?? THEMES[sel].mono };
  const ui = fontId ? FONT_CHOICES.find((f) => f.id === fontId)!.v : t.ui;
  const radius = radiusId ? RADII.find((x) => x.id === radiusId)!.v : t.radius;
  const pick = () => {
    const fontLbl = fontId ? FONT_CHOICES.find((f) => f.id === fontId)!.label : "по теме";
    const btnLbl = BTN_STYLES.find((b) => b.id === btnStyle)!.label;
    try { localStorage.setItem("studio_theme", JSON.stringify({ theme: t.id, font: fontId || "auto", radius, btnStyle })); } catch { /* ignore */ }
    alert(`Выбрано:\n• тема: ${t.label}\n• шрифт: ${fontLbl}\n• скругление: ${radius}px\n• кнопки: ${btnLbl}\n\nСкажи мне — приведу всю студию к этим токенам.`);
  };
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "auto", background: "#0a0e17", fontFamily: F.jakarta }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Sora:wght@400;600;800&family=Plus+Jakarta+Sans:wght@400;600;800&family=Inter:wght@400;600;800&family=Manrope:wght@400;600;800&family=IBM+Plex+Sans:wght@400;600;700&family=Outfit:wght@400;600;800&family=Onest:wght@400;600;800&family=DM+Sans:wght@400;600;700&family=Lexend:wght@400;600;800&family=Urbanist:wght@400;600;800&family=Rubik:wght@400;600;700&family=Figtree:wght@400;600;800&family=IBM+Plex+Mono:wght@400;600&family=Space+Mono:wght@400;700&display=swap');`}</style>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "26px 22px 60px" }}>
        <h1 style={{ color: "#eaf2ff", fontFamily: F.grotesk, fontSize: 24, margin: "0 0 4px" }}>🎨 Design System Lab</h1>
        <p style={{ color: "#8b97b0", margin: "0 0 20px", fontSize: 14 }}>Выбери тему и шрифт — превью на реальных компонентах студии. Как решишь — приведу весь <code style={{ color: "#7ee7ff" }}>#studio</code> к ней.</p>

        {/* theme thumbnails */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          {THEMES.map((th, i) => (
            <button key={th.id} onClick={() => setSel(i)} style={{ cursor: "pointer", textAlign: "left", padding: "10px 12px", borderRadius: 12, minWidth: 180, background: th.glass ? "rgba(18,32,58,.55)" : th.panel, border: `2px solid ${i === sel ? th.accent : th.border}`, boxShadow: i === sel ? `0 0 0 3px ${th.accent}33` : "none" }}>
              <div style={{ display: "flex", gap: 5, marginBottom: 7 }}>{[th.bg, th.accent, th.accent2, th.ink].map((c, j) => <span key={j} style={{ width: 20, height: 14, borderRadius: 3, background: c, border: "1px solid #0004" }} />)}</div>
              <div style={{ fontFamily: th.display, fontWeight: 800, color: th.ink === "#16202e" ? "#16202e" : "#eaf2ff", fontSize: 13.5 }}>{th.label}</div>
              <div style={{ fontFamily: F.inter, fontSize: 10.5, color: "#8b97b0", marginTop: 2, lineHeight: 1.35 }}>{th.mood}</div>
            </button>
          ))}
        </div>

        {/* font row */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#9fb4d0", fontSize: 13, minWidth: 84 }}>Шрифт UI:</span>
          <button onClick={() => setFontId("")} style={ctlBtn(fontId === "")}>по теме</button>
          {FONT_CHOICES.map((f) => <button key={f.id} onClick={() => setFontId(f.id)} style={ctlBtn(fontId === f.id, { fontFamily: f.v })}>{f.label}</button>)}
        </div>

        {/* mono/number font row */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#9fb4d0", fontSize: 13, minWidth: 84 }}>Цифры:</span>
          {MONO_CHOICES.map((m) => <button key={m.id} onClick={() => setMonoId(m.id)} style={ctlBtn(monoId === m.id, { fontFamily: m.v })}>{m.label} 10.5</button>)}
        </div>

        {/* radius row */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{ color: "#9fb4d0", fontSize: 13, minWidth: 84 }}>Скругление:</span>
          <button onClick={() => setRadiusId("")} style={ctlBtn(radiusId === "")}>по теме ({t.radius})</button>
          {RADII.map((rr) => <button key={rr.id} onClick={() => setRadiusId(rr.id)} style={ctlBtn(radiusId === rr.id, { borderRadius: rr.v })}>{rr.label}</button>)}
        </div>

        {/* button style row */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ color: "#9fb4d0", fontSize: 13, minWidth: 84 }}>Кнопки:</span>
          {BTN_STYLES.map((b) => <button key={b.id} onClick={() => setBtnStyle(b.id)} style={ctlBtn(btnStyle === b.id)}>{b.label}</button>)}
          <button onClick={pick} style={{ marginLeft: "auto", cursor: "pointer", padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 800, background: "#37ff9a", color: "#052015", border: "1px solid #2a6a4a" }}>✓ выбрать «{t.label}»</button>
        </div>

        {/* big live preview */}
        <Preview t={t} ui={ui} radius={radius} btnStyle={btnStyle} />
      </div>
    </div>
  );
}
