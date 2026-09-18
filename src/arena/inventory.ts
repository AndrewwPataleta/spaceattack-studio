// Inventory / loadout data (UI-driven; the equipped skin swaps the live player model).
import { WEAPON_STATS } from "../../shared/weapons.mjs"; // SHARED: combat numbers live here (client == server)
import { t, type Key } from "../i18n";
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type ItemType = "weapon" | "grenade" | "skin" | "gear";
// weapon stats = SHARED combat numbers (WEAPON_STATS) + client-only cosmetics (bulletStyle, gun model url)
export type WeaponStats = { damage: number; fireCd: number; mag: number; reload: number; projSpeed: number; spread: number; pellets: number; bulletStyle: number; gun: string };

// grenade behaviour kind: frag = pure damage, smoke = obscure enemy sight, flash = blind screen, freeze = cryo-slow
export type NadeKind = "frag" | "smoke" | "flash" | "freeze" | "shield" | "heal" | "slow";
export type Item = { id: string; type: ItemType; name: string; nameKey?: Key; icon: string; rarity: Rarity; owned: boolean; count?: number; skin?: string;
  stats?: WeaponStats;             // weapon
  dmg?: number; radius?: number;   // grenade stats
  kind?: NadeKind; effDur?: number; color?: string; // grenade effect (effDur = ms the effect lasts on a target)
  ability?: "boost" | "shield"; dur?: number; cd?: number; // gear ability (seconds)
};

// TEST FLAG: infinite grenades so all types can be tried freely in the sandbox. Flip false for real balance.
export const INF_NADES = false;
// Grenade economy (real balance): a small charge pool that slowly recharges + a hard cooldown BETWEEN throws so
// you can't dump the pool in one instant (was: infinite spam). Tune here.
export const GRENADE_MAX = 3;         // max charges held
export const GRENADE_CD_MS = 1600;    // min time between two throws (anti-spam)
export const GRENADE_REGEN_MS = 9000; // one charge refills every N ms while below max

export const RARITY: Record<Rarity, string> = { common: "#9fb0d0", rare: "#5fd0ff", epic: "#c084ff", legendary: "#f0a63a" };

export const items: Item[] = [
  // weapons: SHARED combat stats (WEAPON_STATS) + cosmetics (bulletStyle, gun model). Numbers → shared/weapons.mjs.
  { id: "rifle", type: "weapon", name: "Пульсар", nameKey: "item.weapon.rifle", icon: "🔫", rarity: "rare", owned: true, stats: { ...WEAPON_STATS.rifle, bulletStyle: 6, gun: "/cosmos/gun_rifle_opt.glb" } },
  { id: "smg", type: "weapon", name: "Вихрь", nameKey: "item.weapon.smg", icon: "🔫", rarity: "common", owned: true, stats: { ...WEAPON_STATS.smg, bulletStyle: 6, gun: "/cosmos/gun_smg_opt.glb" } },
  { id: "cannon", type: "weapon", name: "Разлом", nameKey: "item.weapon.cannon", icon: "🔫", rarity: "epic", owned: true, stats: { ...WEAPON_STATS.cannon, bulletStyle: 6, gun: "/cosmos/gun_shotgun_opt.glb" } },
  { id: "railgun", type: "weapon", name: "Рельса", nameKey: "item.weapon.railgun", icon: "🔫", rarity: "legendary", owned: true, stats: { ...WEAPON_STATS.railgun, bulletStyle: 2, gun: "/cosmos/gun_rail_opt.glb" } },
  { id: "igla", type: "weapon", name: "Игла", nameKey: "item.weapon.igla", icon: "🔫", rarity: "epic", owned: true, stats: { ...WEAPON_STATS.igla, bulletStyle: 2, gun: "/cosmos/gun_igla_opt.glb" } }, // sniper primary rifle
  { id: "osa", type: "weapon", name: "Оса", nameKey: "item.weapon.osa", icon: "🔫", rarity: "rare", owned: true, stats: { ...WEAPON_STATS.osa, bulletStyle: 6, gun: "/cosmos/gun_osa_opt.glb" } }, // sniper light sidearm pistol

  { id: "handcannon", type: "weapon", name: "Тяжёлый", nameKey: "item.weapon.handcannon", icon: "🔫", rarity: "rare", owned: true, stats: { ...WEAPON_STATS.handcannon, bulletStyle: 6, gun: "/cosmos/pistol_heavy_opt.glb" } }, // tank sidearm
  // grenades: ONLY "Урон" deals HP damage; the rest are utility (no damage) — smoke blocks sight, flash blinds, freeze slows.
  { id: "frag",   type: "grenade", name: "Урон",      nameKey: "item.nade.frag",   icon: "", rarity: "common", owned: true, count: 3, kind: "frag",   dmg: 48, radius: 2.4, color: "#ff8a3c" },
  { id: "smoke",  type: "grenade", name: "Дым",       nameKey: "item.nade.smoke",  icon: "", rarity: "rare",   owned: true, count: 2, kind: "smoke",  dmg: 0,  radius: 3.6, effDur: 4200, color: "#c8d2e0" },
  { id: "flash",  type: "grenade", name: "Флеш",      nameKey: "item.nade.flash",  icon: "", rarity: "epic",   owned: true, count: 2, kind: "flash",  dmg: 0,  radius: 3.4, effDur: 2600, color: "#fff4c2" },
  { id: "freeze", type: "grenade", name: "Заморозка", nameKey: "item.nade.freeze", icon: "", rarity: "epic",   owned: true, count: 2, kind: "freeze", dmg: 0,  radius: 3.0, effDur: 2600, color: "#8fe6ff" },
  { id: "shield", type: "grenade", name: "Щит-купол", nameKey: "item.nade.shield", icon: "", rarity: "epic",   owned: true, count: 2, kind: "shield", dmg: 0,  radius: 2.6, effDur: 6000, color: "#5fd0ff" }, // deploys a protective dome at the blast point
  { id: "heal",   type: "grenade", name: "Хил-зона",  nameKey: "item.nade.heal",   icon: "", rarity: "epic",   owned: true, count: 2, kind: "heal",   dmg: 0,  radius: 2.6, effDur: 6000, color: "#5ee089" }, // green dome heals your team inside
  { id: "slow",   type: "grenade", name: "Замедление",nameKey: "item.nade.slow",   icon: "", rarity: "rare",   owned: true, count: 2, kind: "slow",   dmg: 0,  radius: 2.8, effDur: 5000, color: "#b088ff" }, // dome slows enemies inside
  // skins (owned ones swap the live model)
  { id: "jade", type: "skin", name: "Jade", icon: "🟢", rarity: "epic", owned: true, skin: "/hero3d/jade_rig.glb" },
  { id: "magma", type: "skin", name: "Magma", icon: "🔴", rarity: "legendary", owned: true, skin: "/hero3d/magma_rig.glb" },
  { id: "bastion", type: "skin", name: "Bastion", icon: "⚪", rarity: "legendary", owned: true, skin: "/hero3d/bastion_rig.glb" },
  { id: "reaktor", type: "skin", name: "Reaktor", icon: "🟣", rarity: "epic", owned: true, skin: "/hero3d/reaktor_rig.glb" },
  { id: "koloss", type: "skin", name: "Koloss", icon: "🟡", rarity: "epic", owned: true, skin: "/hero3d/koloss_rig.glb" },
  { id: "garpun", type: "skin", name: "Garpun", icon: "🟤", rarity: "legendary", owned: true, skin: "/hero3d/garpun_rig.glb" },
  { id: "dryad", type: "skin", name: "Dryad", icon: "🟩", rarity: "legendary", owned: true, skin: "/hero3d/dryad_rig.glb" },
  { id: "spora", type: "skin", name: "Spora", icon: "🟫", rarity: "legendary", owned: true, skin: "/hero3d/spora_rig.glb" },
  { id: "orakul", type: "skin", name: "Orakul", icon: "🟠", rarity: "legendary", owned: true, skin: "/hero3d/orakul_rig.glb" },
  { id: "shtorm", type: "skin", name: "Shtorm", icon: "🔵", rarity: "legendary", owned: true, skin: "/hero3d/shtorm_rig.glb" },
  { id: "sokol", type: "skin", name: "Sokol", icon: "🟡", rarity: "legendary", owned: true, skin: "/hero3d/sokol_rig.glb" },
  { id: "champion", type: "skin", name: "Champion", icon: "⚪", rarity: "epic", owned: false },
  { id: "attack", type: "skin", name: "Attack", icon: "🟣", rarity: "rare", owned: false },
  // gear = super-ability (button on the right)
  { id: "boost", type: "gear", name: "Ускорение", nameKey: "item.gear.boost", icon: "⚡", rarity: "rare", owned: true, ability: "boost", dur: 3, cd: 8 },
  { id: "shield", type: "gear", name: "Щит", nameKey: "item.gear.shield", icon: "🛡️", rarity: "epic", owned: true, ability: "shield", dur: 3, cd: 12 },
];

export const loadout = { weapon: "rifle", grenade: "frag", skin: "jade", gear: "boost" };

// localized display name for an item — resolves nameKey through t() at call time; falls back to the raw name
// (skins keep their Latin names, no key). Use this anywhere an item name is shown to the player.
export const itemName = (it?: Pick<Item, "name" | "nameKey">) => (it?.nameKey ? t(it.nameKey) : it?.name ?? "");
