// SINGLE SOURCE OF TRUTH for weapon COMBAT stats — the balance numbers the server needs to validate a
// shot (damage, fire rate, spread, projectile speed, mag/reload). Imported by the client inventory
// (which layers cosmetics: model url, bullet style, icon, name, rarity on top) AND — once hit validation
// moves server-side — by server/index.mjs, so a hacked client can't invent damage. No framework imports.

/** @typedef {{ damage:number, fireCd:number, mag:number, reload:number, projSpeed:number, spread:number, pellets:number }} WeaponStat */

/** @type {Record<string, WeaponStat>} */
export const WEAPON_STATS = {
  rifle:   { damage: 22, fireCd: 0.16, mag: 25, reload: 1.8, projSpeed: 34, spread: 0.03, pellets: 1 },
  smg:     { damage: 13, fireCd: 0.08, mag: 35, reload: 1.6, projSpeed: 30, spread: 0.09, pellets: 1 },
  cannon:  { damage: 15, fireCd: 0.85, mag: 6,  reload: 2.5, projSpeed: 26, spread: 0.2,  pellets: 5 },
  railgun: { damage: 95, fireCd: 0.9,  mag: 4,  reload: 2.8, projSpeed: 64, spread: 0,    pellets: 1 },
  igla:    { damage: 68, fireCd: 0.85, mag: 5,  reload: 2.4, projSpeed: 56, spread: 0,    pellets: 1 }, // sniper primary: precise long-range, faster than the railgun with less punch
  osa:     { damage: 24, fireCd: 0.24, mag: 12, reload: 1.4, projSpeed: 30, spread: 0.06, pellets: 1 }, // sniper sidearm: light fast close-range pistol (low dmg/range, high rate)
  handcannon: { damage: 34, fireCd: 0.5, mag: 8, reload: 2.0, projSpeed: 30, spread: 0.05, pellets: 1 }, // tank sidearm (shield + heavy pistol)
};

/** hard ceiling the server clamps any reported hit to (defence-in-depth vs a lying client) */
export const MAX_HIT_DAMAGE = 120;
