// Interactive onboarding for #studio. NOT gated - every step has a "дальше" button so the action is OPTIONAL; if you
// DO perform it we show a green "✓ сделано" (nice feedback) but never auto-advance, so you can e.g. add a background
// AND upload an image at your own pace. DOUBLE guidance: popover (WHAT) + pulsing ring / "жми сюда" callout on the
// target (WHERE), or big WASD keycaps / mouse hint for canvas steps.
import { useEffect, useRef, useState } from "react";
import { T } from "./theme";
import * as store from "./store";
import { t, useLang } from "./i18n";

const DONE_KEY = "studio_tutor_done";
type Cleanup = () => void;
type Step = {
  id: string; title: string; body: string; anchor?: string; where?: string; keys?: string[]; mouse?: string;
  last?: boolean; onEnter?: () => void; watch?: (fire: () => void) => Cleanup;
};

const onStore = (check: () => boolean, done: () => void): Cleanup => {
  const run = () => { if (check()) done(); };
  const un = store.subscribe(run); run(); return un;
};
const ySig = () => store.getState().doc.plats.map((p) => `${p.id}:${p.y}`).join("|");
const view = (d: string) => window.dispatchEvent(new CustomEvent("studio-view", { detail: d }));
const onEvent = (name: string, fire: () => void): Cleanup => { const h = () => fire(); window.addEventListener(name, h); return () => window.removeEventListener(name, h); };

// hands-on FIRST-LEVEL walkthrough that actually MOVES the scene: rotate the camera (auto-demo) → add a
// platform → raise it → connect a ladder → check → play. Every build step advances its ✓ on the real action.
export const STEPS: Step[] = [
  { id: "welcome", title: "Соберём первый уровень",
    body: "Несколько простых действий, и у тебя своя карта. На каждом шаге подсвечу, куда нажать. Не хочешь - жми «дальше»." },
  { id: "camera", title: "1 · Покрути камеру", anchor: "canvas",
    onEnter: () => view("view:isoR"),   // demo: the scene visibly turns to 3/4 so the 3D depth is obvious right away
    body: "Смотри, сцена повернулась и стала объёмной. Покрути сам: зажми Alt и тяни мышью. Клавиши 1-4 - готовые ракурсы: фронт, сбоку, сверху.",
    watch: (fire) => onEvent("studio-view", fire) },
  { id: "add", title: "2 · Поставь платформу", anchor: "tool-add", where: "жми «＋ платформа»",
    body: "Нажми «＋ платформа» слева (подсвечена) - в сцене появится новый блок. Хватай его мышью и двигай куда нужно.",
    watch: (fire) => { const n = store.getState().doc.plats.length; return onStore(() => store.getState().doc.plats.length > n, fire); } },
  { id: "height", title: "3 · Подними её выше", anchor: "canvas", mouse: "Тяни платформу вверх",
    body: "Схвати платформу мышью и потяни вверх - она поднимется. Так и строится высота и второй ярус.",
    watch: (fire) => { const base = ySig(); return onStore(() => ySig() !== base, fire); } },
  { id: "ladder", title: "4 · Соедини лестницей", anchor: "tool-ladder", where: "жми «лестница», потом 2 блока",
    body: "Нажми инструмент «лестница» слева (подсвечен), потом кликни две платформы по очереди - между ними встанет лестница, и наверх можно будет залезть.",
    watch: (fire) => { const n = store.getState().doc.links.length; return onStore(() => store.getState().doc.links.length > n, fire); } },
  { id: "save", title: "5 · Сохрани, чтобы не потерять", anchor: "file-menu", where: "открой «Файл»",
    body: "Уровень сам сохраняется в браузере, но лучше подстраховаться: открой «Файл» и жми «Сохранить в библиотеку». «Экспорт JSON» скачает файл, «Поделиться» даст ссылку на карту. Так работу точно не потеряешь." },
  { id: "validate", title: "6 · Проверка проходимости", anchor: "validate", where: "смотри сюда",
    body: "Индикатор вверху: зелёный «✓ проходимо» значит все герои честно проходят карту. Красный ⚠ значит где-то не залезть или придавлено." },
  { id: "play", title: "7 · Играй!", anchor: "tool-play", where: "жми, чтобы играть",
    body: "Жми «▶ Тест» и пробегись по своей карте настоящей физикой." },
  { id: "help", title: "8 · Где помощь", anchor: "help-menu", where: "всё тут", last: true,
    body: "Застрял? Открой «Справка»: как сохранить, свои текстуры и фоны через AI, гайдлайны и FAQ. Тур перезапускается там же. Готово, строй свой уровень!" },
];

function rectOf(anchor?: string): DOMRect | null {
  if (!anchor || anchor === "canvas") return null;
  return document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`)?.getBoundingClientRect() ?? null;
}

const KEYS = "studio-tutor-kf";
function initialStep(): number {
  try { const m = new URLSearchParams(window.location.search).get("tstep"); if (m != null) return Math.max(0, Math.min(STEPS.length - 1, +m)); } catch { /* ignore */ }
  return 0;
}

export function Tutor({ onClose }: { onClose: () => void }) {
  useLang(); // re-translate the tour when the language switches
  const [i, setI] = useState(initialStep);
  const [done, setDone] = useState(false);
  const [, force] = useState(0);
  const rafRef = useRef(0);
  const step = STEPS[i];

  useEffect(() => { if (document.getElementById(KEYS)) return; const st = document.createElement("style"); st.id = KEYS; st.textContent = `@keyframes stPulse{0%{box-shadow:0 0 0 0 ${T.accent}88}70%{box-shadow:0 0 0 12px ${T.accent}00}100%{box-shadow:0 0 0 0 ${T.accent}00}}@keyframes stBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}@keyframes stKey{0%,100%{transform:translateY(0);opacity:.85}50%{transform:translateY(-4px);opacity:1}}`; document.head.appendChild(st); }, []);

  // arm the OPTIONAL action watcher for the current step → sets the ✓ badge (does NOT advance).
  useEffect(() => {
    setDone(false);
    step.onEnter?.();               // e.g. the camera step auto-rotates the scene so the 3D is obvious
    if (!step.watch) return;
    let fired = false;
    return step.watch(() => { if (!fired) { fired = true; setDone(true); } });
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  // keep the spotlight glued to the (fixed-layout) anchor
  useEffect(() => { const tick = () => { force((n) => n + 1); rafRef.current = requestAnimationFrame(tick); }; rafRef.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(rafRef.current); }, []);

  const finish = () => { try { localStorage.setItem(DONE_KEY, "1"); } catch { /* ignore */ } onClose(); };
  const next = () => { if (step.last) finish(); else setI((n) => n + 1); };

  const rect = rectOf(step.anchor);
  const canvasRect = typeof document !== "undefined" ? (document.querySelector("canvas")?.getBoundingClientRect() ?? null) : null;
  const pad = 8;
  const ring = done ? T.good : T.accent;
  const POP_W = 340;
  // place the popover so it NEVER clips off any screen edge: prefer below, else above, else a safe centred-bottom slot.
  let popStyle: React.CSSProperties;
  if (rect) {
    const left = Math.min(Math.max(rect.left + rect.width / 2 - POP_W / 2, 12), window.innerWidth - POP_W - 14);
    const belowGap = step.where ? 58 : 18; // clear the "жми сюда" callout that sits right under the anchor
    if (rect.bottom + 230 < window.innerHeight) popStyle = { position: "fixed", top: rect.bottom + belowGap, left };
    else if (rect.top - 230 > 0) popStyle = { position: "fixed", bottom: window.innerHeight - rect.top + 18, left };
    else popStyle = { position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)" };
  } else {
    popStyle = { position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)" };
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none", fontFamily: T.ui }}>
      {/* NO dark dimming - the editor stays fully visible. Focus = a bright glow around the WORKING AREA (canvas)
          + a bright pulsing ring on the target control, so you always see the scene and where to act. */}
      {canvasRect && (
        <div style={{ position: "fixed", left: canvasRect.left + 2, top: canvasRect.top + 2, width: Math.max(0, canvasRect.width - 4), height: Math.max(0, canvasRect.height - 4), borderRadius: 8, boxShadow: `inset 0 0 0 2px ${ring}55, 0 0 30px ${ring}33`, pointerEvents: "none", transition: "box-shadow .25s" }} />
      )}
      {rect && (
        <>
          <div style={{ position: "fixed", left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, borderRadius: 10, border: `2px solid ${ring}`, boxShadow: `0 0 0 3px ${ring}44, 0 0 16px ${ring}99`, animation: done ? "none" : "stPulse 1.4s ease-out infinite", pointerEvents: "none" }} />
          {step.where && (
            <div style={{ position: "fixed", left: Math.min(rect.left + rect.width / 2 - 90, window.innerWidth - 190), top: rect.bottom + 8, width: 180, animation: "stBob 1.2s ease-in-out infinite", pointerEvents: "none" }}>
              <div style={{ fontSize: 20, color: ring, textAlign: "center", lineHeight: 1 }}>▲</div>
              <div style={{ background: ring, color: T.accentInk, fontWeight: 500, fontSize: 11.5, padding: "5px 9px", borderRadius: 8, textAlign: "center" }}>{done ? t("✓ сделано") : t(step.where)}</div>
            </div>
          )}
        </>
      )}

      {/* canvas steps - hint pinned at the TOP of the working area (never covers the scene) + arrow pointing IN */}
      {!rect && canvasRect && (step.keys || step.mouse) && (
        <div style={{ position: "fixed", top: canvasRect.top + 22, left: canvasRect.left + canvasRect.width / 2, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, pointerEvents: "none" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {step.keys?.map((k, j) => (
              <kbd key={k} style={{ animation: `stKey 1s ${j * 0.1}s ease-in-out infinite`, fontFamily: T.mono, fontWeight: 500, fontSize: 18, color: ring, background: T.bg2, border: `2px solid ${ring}`, borderRadius: 8, padding: "8px 12px", boxShadow: T.shadow }}>{k}</kbd>
            ))}
            {step.mouse && <div style={{ fontFamily: T.ui, fontWeight: 500, fontSize: 14, color: done ? T.good : ring, background: T.bg2, border: `2px solid ${done ? T.good : ring}`, borderRadius: 10, padding: "8px 14px", boxShadow: T.shadow }}>{done ? t("✓ готово") : `🖱 ${t(step.mouse)}`}</div>}
          </div>
          <div style={{ fontSize: 22, color: ring, animation: "stBob 1.2s ease-in-out infinite" }}>▼</div>
        </div>
      )}

      {/* after a build action lands - a small badge points into the scene: «появилось» */}
      {done && canvasRect && (step.id === "add" || step.id === "ladder" || step.id === "height") && (
        <div style={{ position: "fixed", top: canvasRect.top + 74, left: canvasRect.left + canvasRect.width / 2, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, pointerEvents: "none" }}>
          <div style={{ fontSize: 20, color: T.good, animation: "stBob 1.2s ease-in-out infinite" }}>▼</div>
          <div style={{ background: T.good, color: T.accentInk, fontWeight: 600, fontSize: 12, padding: "5px 11px", borderRadius: 999, boxShadow: T.shadow }}>{t("появилось в сцене")}</div>
        </div>
      )}

      {/* WHAT - the popover (always with a Next button) */}
      <div style={{ ...popStyle, width: POP_W, maxWidth: "92vw", boxSizing: "border-box", background: T.panelSolid, border: `1px solid ${done ? T.good : T.border}`, borderRadius: T.radius + 4, padding: "15px 16px", color: T.ink, boxShadow: T.shadow, pointerEvents: "auto" }}>
        <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 500, color: T.accent, marginBottom: 5, display: "flex", alignItems: "center", gap: 8 }}>
          {t(step.title)}{done && <span style={{ color: T.good, fontSize: 12, fontWeight: 500 }}>{t("✓ сделано")}</span>}
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.dim, minHeight: 42 }}>{t(step.body)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
          <button onClick={finish} style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", fontFamily: T.ui, fontSize: 11.5 }}>{t("пропустить тур")}</button>
          <span style={{ color: T.faint, fontFamily: T.mono, fontSize: 11 }}>{i + 1} / {STEPS.length}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {i > 0 && <button onClick={() => setI((n) => n - 1)} style={{ background: T.bg2, color: T.ink, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: "7px 13px", cursor: "pointer", fontFamily: T.ui, fontSize: 12 }}>{t("назад")}</button>}
            <button onClick={next} style={{ background: T.bg2, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: T.radius, padding: "7px 16px", cursor: "pointer", fontFamily: T.ui, fontSize: 12, fontWeight: 500 }}>{step.last ? t("готово ✓") : t("дальше →")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const tutorSeen = () => { try { return localStorage.getItem(DONE_KEY) === "1"; } catch { return true; } };
