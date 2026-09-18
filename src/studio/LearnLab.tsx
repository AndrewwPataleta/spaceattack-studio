// #learn — the STUDIO "bible": how to build a map, generate textures (prompt → generate → unwrap), and the asset
// library. MOCK for now (explains the flow + shows example prompts); marked where it will be expanded. Studio theme.
import { useState } from "react";
import { T, btn, card } from "./theme";

const SECTIONS = [
  {
    id: "map", icon: "🗺", title: "Как собрать карту",
    body: [
      "Уровень — это ДАННЫЕ, а не расставленная вручную геометрия. Ты двигаешь блоки в редакторе (#studio), а движок генерирует 3D по этим данным. Что проверил — то и играешь.",
      "1. Открой #studio → шаблон «Чистый старт» (меню Файл).",
      "2. Добавляй платформы (＋), соединяй рампами/лестницами (клик по 2 блокам).",
      "3. Держи «проверку» зелёной — уровень должны проходить все роли (заскок 2.4м, дальность ~4м).",
      "4. Включи «измерения», чтобы видеть высоты и пройдёт ли прыжок.",
      "5. «▶ Играть» — тест реальной физикой.",
    ],
    note: "Будет дополнено: готовые шаблоны-биомы, авто-подсказки по балансу, симметрия одним кликом.",
  },
  {
    id: "tex", icon: "🎨", title: "Генерация текстур (prompt → картинка)",
    body: [
      "Структурные части (платформа/рампа/лестница) = код-бокс + ПЛОСКИЕ ортографичные текстуры на каждую грань (НЕ Meshy image→3D — он коробит и запекает хром).",
      "Флоу: берёшь промпт → генеришь картинку (Nano Banana / ChatGPT, 0 правок) → кладёшь PNG в public/cosmos/kit/ → указываешь слот → блок одевается.",
      "Правила промпта: straight-on ORTHOGRAPHIC, без перспективы/теней/бликов, плоский альбедо, seamless (тайлится), альфа → .PNG.",
    ],
    prompt: "Seamless tileable, top-down orthographic, flat even lighting, no shadows. Sci-fi COMMAND deck: dark blue-grey armored panels with cyan inlaid data-lines and corner bolts; matte albedo only.",
    note: "Будет дополнено: кнопка «сгенерировать» прямо в студии (когда подключим ключ), авто-раскладка PNG по слотам.",
  },
  {
    id: "unwrap", icon: "🧩", title: "Развёртка граней («умные блоки»)",
    body: [
      "Каждый блок — известная форма, поэтому у него можно перечислить ГРАНИ/ЧАСТИ и на каждую сделать свою текстуру.",
      "Пример — лестница: рейлы ×2, ступени ×N, боковые крепления ×2, свечение. Каждая часть — свой слот (kit/ladder_rail|rung|mount.png).",
      "Платформа: верх (дек) / бок / торец / hazard-кант. Мост, рампа — аналогично.",
      "Стиль можно задавать на КАЖДЫЙ блок отдельно (мост в одном стиле, платформы в другом) — свежо.",
    ],
    note: "Будет дополнено: визуальный редактор слотов (тыкаешь грань → назначаешь PNG), предпросмотр развёртки.",
  },
  {
    id: "lib", icon: "📦", title: "Библиотека ассетов",
    body: [
      "Здесь будут все сгенерированные текстуры/пропсы/стили: превью, промпт, слот, куда подходит.",
      "Пока — мок. Ассеты складываются в public/cosmos/kit/, стили описаны в docs/level-art-direction.md и docs/level-kit-lore.md.",
    ],
    note: "Будет дополнено: сетка превью, поиск по тегам, drag-в-слот, шаринг наборов.",
  },
];

export function LearnLab() {
  const [open, setOpen] = useState<string>("map");
  const go = (h: string) => { window.location.hash = h; window.location.reload(); };
  return (
    <div className="studio-root" style={{ position: "fixed", inset: 0, overflow: "auto", background: T.bg, color: T.ink, fontFamily: T.ui }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", background: T.panelSolid, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 5 }}>
        <b style={{ color: T.accent, fontFamily: T.display, fontSize: 14 }}>📚 Обучение и библиотека</b>
        <span style={{ color: T.faint, fontSize: 12 }}>студия уровней — как это работает</span>
        <button style={{ ...btn(), marginLeft: "auto" }} onClick={() => go("studio")}>← в студию</button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 18px 60px" }}>
        <div style={{ ...card, padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 500, marginBottom: 6 }}>С чего начать</div>
          <div style={{ color: T.dim, fontSize: 13.5, lineHeight: 1.6 }}>Level Studio — редактор, где уровень собирается из ДАННЫХ, проверяется на проходимость и одевается в текстуры по граням. Ниже — краткая «библия»: как собрать карту, как генерить текстуры и что будет дальше. <span style={{ color: T.accent }}>Это мок-версия — разделы будут дополнены.</span></div>
        </div>

        {SECTIONS.map((s) => (
          <div key={s.id} style={{ ...card, marginBottom: 12, overflow: "hidden" }}>
            <button onClick={() => setOpen(open === s.id ? "" : s.id)} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "transparent", border: "none", padding: "13px 16px", color: T.ink, fontFamily: T.display, fontSize: 15.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span> {s.title}
              <span style={{ marginLeft: "auto", color: T.faint, fontSize: 13 }}>{open === s.id ? "▾" : "▸"}</span>
            </button>
            {open === s.id && (
              <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {s.body.map((b, i) => <div key={i} style={{ color: T.dim, fontSize: 13, lineHeight: 1.6 }}>{b}</div>)}
                {s.prompt && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ color: T.faint, fontSize: 11, marginBottom: 4 }}>ПРИМЕР ПРОМПТА</div>
                    <div style={{ fontFamily: T.mono, fontSize: 12, color: T.accent2, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 11px", lineHeight: 1.5 }}>{s.prompt}</div>
                    <button style={{ ...btn(), marginTop: 6 }} onClick={() => { try { navigator.clipboard.writeText(s.prompt!); } catch { /* ignore */ } }}>⧉ копировать промпт</button>
                  </div>
                )}
                <div style={{ marginTop: 6, color: T.accent, fontSize: 12, background: `${T.accent}14`, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: "8px 10px" }}>⏳ {s.note}</div>
              </div>
            )}
          </div>
        ))}

        <div style={{ ...card, padding: "14px 16px", marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={btn(false, "primary")} onClick={() => go("studio")}>▶ Открыть студию</button>
          <button style={btn()} onClick={() => go("dslab")}>🎨 Дизайн-лаб (темы)</button>
          <span style={{ color: T.faint, fontSize: 12, alignSelf: "center" }}>Спеки: docs/level-art-direction.md · docs/level-kit-lore.md · docs/level-building-engine.md</span>
        </div>
      </div>
    </div>
  );
}
