// Starter templates for #studio — a new user picks one instead of facing a blank canvas. Each returns a full
// LevelDoc (validated-by-construction where possible). "4v4" = the canonical hand-authored arena (defaultDoc).
import { LevelDoc, citadelDoc, type StyleId } from "../game/levels/levelDoc";

function base(name: string, style: StyleId): LevelDoc {
  return { meta: { name, style, version: 1 }, plats: [], links: [], spawns: [], skins: {}, layers: [], decor: [], hidden: [] };
}

// blank: a wide ground floor + one raised deck per side to spawn on (mirror-symmetric), ramps up. A real starting point.
function blank(): LevelDoc {
  const d = base("Новый уровень", "station");
  d.plats = [
    { id: "ground", x: 0, y: 0, w: 60, kind: "ground" },
    { id: "deckR", x: 20, y: 2.2, w: 8, kind: "high", team: "red" },
    { id: "deckL", x: -20, y: 2.2, w: 8, kind: "high", team: "blue" },
  ];
  d.links = [
    { a: "ground", b: "deckR", kind: "ramp" },
    { a: "ground", b: "deckL", kind: "ramp" },
  ];
  d.spawns = ["deckR", "deckL"];
  return d;
}

// duel: tight 1v1 — ground + a central island + two side perches.
function duel(): LevelDoc {
  const d = base("Дуэль 1v1", "crystal");
  d.plats = [
    { id: "ground", x: 0, y: 0, w: 44, kind: "ground" },
    { id: "island", x: 0, y: 2.0, w: 6, kind: "island" },
    { id: "perchR", x: 15, y: 3.0, w: 6, kind: "high", team: "red" },
    { id: "perchL", x: -15, y: 3.0, w: 6, kind: "high", team: "blue" },
  ];
  d.links = [
    { a: "ground", b: "perchR", kind: "ramp" },
    { a: "ground", b: "perchL", kind: "ramp" },
    { a: "ground", b: "island", kind: "ladder", x: 2.5 },
  ];
  d.spawns = ["perchR", "perchL"];
  return d;
}

// three tiers: ground + a mid deck each side + a top perch each side, ladders/ramps up. Teaches vertical play.
function tiers(): LevelDoc {
  const d = base("Три яруса", "mine");
  d.plats = [
    { id: "ground", x: 0, y: 0, w: 56, kind: "ground" },
    { id: "midR", x: 12, y: 2.4, w: 10, kind: "mid" },
    { id: "midL", x: -12, y: 2.4, w: 10, kind: "mid" },
    { id: "topR", x: 20, y: 4.6, w: 7, kind: "high", team: "red" },
    { id: "topL", x: -20, y: 4.6, w: 7, kind: "high", team: "blue" },
  ];
  d.links = [
    { a: "ground", b: "midR", kind: "ramp" }, { a: "ground", b: "midL", kind: "ramp" },
    { a: "midR", b: "topR", kind: "ladder" }, { a: "midL", b: "topL", kind: "ladder" },
  ];
  d.spawns = ["topR", "topL"];
  return d;
}
// bridge over a gap: two grounded lands linked by a central raised span (a chokepoint fight).
function bridge(): LevelDoc {
  const d = base("Мост", "wreck");
  d.plats = [
    { id: "landR", x: 17, y: 0, w: 20, kind: "ground", team: "red" },
    { id: "landL", x: -17, y: 0, w: 20, kind: "ground", team: "blue" },
    { id: "span", x: 0, y: 1.6, w: 14, kind: "mid" },
  ];
  d.links = [
    { a: "landR", b: "span", kind: "ladder", x: 6 },
    { a: "landL", b: "span", kind: "ladder", x: -6 },
  ];
  d.spawns = ["landR", "landL"];
  return d;
}

export type TemplateId = "blank" | "duel" | "tiers" | "bridge" | "citadel";
export const TEMPLATES: { id: TemplateId; label: string; desc: string; make: () => LevelDoc }[] = [
  { id: "blank", label: "Чистый старт", desc: "Земля и две площадки со спавнами. Строй с нуля.", make: blank },
  { id: "duel", label: "Дуэль 1v1", desc: "Тесная симметричная арена: остров по центру и два насеста.", make: duel },
  { id: "tiers", label: "Три яруса", desc: "Низ, середина, верх. Рампы и лестницы, вертикальный бой.", make: tiers },
  { id: "bridge", label: "Мост", desc: "Две земли и мост-чокпоинт по центру. Драка за проход.", make: bridge },
  { id: "citadel", label: "Цитадель 4×4", desc: "Большая играбельная арена для боёв 4 на 4.", make: citadelDoc },
];
