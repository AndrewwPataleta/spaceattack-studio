// Shared combat world for the arena (mutated outside React; read by systems each frame).
import { hitstop } from "./time";
import { streakTier } from "../../shared/streaks.mjs";
import { playSfx, playSfxAt } from "../lib/sound";
import { rumble } from "../input/rumble";
import { addShake } from "./shake";
import { satkPop, ARENA_KILL_SATK } from "../game/ui/SatkPop";
export type Team = "blue" | "red";

// The one input command that drives a fighter. This is the NETWORK payload for multiplayer:
// locally it's filled from the sticks (player) or AI; over the wire the client sends this up and the
// server simulates from it. Keeping the sim consume only this makes local-predict / server-authoritative
// share the exact same code path. (seq = client input sequence for reconciliation.)
export type FighterInput = { seq: number; axis: number; aimX: number; aimY: number; jump: boolean; fire: boolean; crouch: boolean };
export const NEUTRAL_INPUT: FighterInput = { seq: 0, axis: 0, aimX: 1, aimY: 0, jump: false, fire: false, crouch: false };

export type Fighter = {
  id: number;
  team: Team;
  name: string;
  x: number; y: number;   // chest-ish world position (published each frame)
  face: 1 | -1;
  aimX?: number; aimY?: number; // normalized aim direction (twin-stick)
  muzzleX?: number; muzzleY?: number; // world barrel-tip position (published by Character for accurate bullet origin)
  aimDirX?: number; aimDirY?: number;  // TRUE barrel direction (grip->tip) published by Character, so shots match the gun
  hp: number; maxhp: number;
  alive: boolean;
  respawnAt: number;      // ms timestamp to respawn (0 = alive)
  invuln?: boolean;       // player god-mode for now (bullets don't hurt)
  input?: FighterInput;   // last input command applied (net seam: local-predict / server-authoritative)
  kills: number; deaths: number; assists: number; // scoreboard stats
  nades: number;          // grenades left
  nadeReadyAt?: number; nadeRegenAt?: number; // throw cooldown + charge-regen timers (ms, performance.now)
  boostUntil?: number; shieldUntil?: number; abilityReadyAt?: number; // ability timers (ms, performance.now)
  shieldHp?: number; shieldBrokenUntil?: number; shieldHitUntil?: number; // tank ballistic shield durability
  shieldBroken?: boolean; // ONLINE: server-authoritative broken flag (offline uses shieldBrokenUntil above)
  shieldDomeUntil?: number; shieldDomeMs?: number; // energy DOME pickup: omnidirectional impenetrable shield (timed)
  regenUntil?: number; regenMs?: number;           // regenerator pickup: slow HP restore over time
  reflectUntil?: number; reflectMs?: number;       // reflector pickup: bounces enemy bullets back
  cloakUntil?: number; cloakMs?: number; cloaked?: boolean; // phase/cloak pickup: translucent + harder to see
  moving?: boolean; // grounded + walking (tank only blocks while standing still)
  blockUntil?: number; scanUntil?: number; // tank frontal block / sniper enemy-scan (ms)
  hitFlashUntil?: number; hitFlashCrit?: boolean; // model damage-flash (ms) + crit tint
  role?: string; armor?: number;           // competitive role + extra effective-HP pool
  skin?: string;                           // equipped skin model url (published for networking)
  heroId?: string;                         // chosen hero id (for the roster card poster)
  emote?: string;                          // selected emote id (published for networking)
  streak?: number;                         // consecutive kills without dying (published; drives aura)
  anim?: string;                           // current anim state (published for networking)
  frozenUntil?: number; blindUntil?: number; // grenade status: freeze = slowed, flash/smoke = can't acquire sight (ms)
  hiddenLocal?: boolean;                     // fog-of-war: not currently visible to THIS client's player (out of range / LOS blocked / smoke)
  netId?: string;                          // colyseus sessionId for a networked player (undefined = local/AI)
  local?: boolean;                         // true for THIS client's own player (server-authoritative hits)
  forceRespawn?: boolean;                  // server told us to respawn -> snap the local body to the server spawn
  weaponId?: string; ammo?: number; reloadUntil?: number; // per-weapon ammo/reload
};

// floating combat-text (damage numbers). Rendered by <DamageNumbers/>; crit = headshot.
export type DamageNum = { id: number; x: number; y: number; amount: number; crit: boolean; t: number; shield?: boolean };
export const damageNumbers: DamageNum[] = [];
let dnid = 0;
export function spawnDamage(x: number, y: number, amount: number, crit: boolean, shield = false) {
  damageNumbers.push({ id: ++dnid, x: x + (Math.random() * 0.4 - 0.2), y, amount, crit, t: performance.now(), shield });
  if (damageNumbers.length > 40) damageNumbers.shift();
}

export type Bullet = {
  id: number;
  team: Team;
  owner: number;          // shooter fighter id (kill attribution)
  x: number; y: number;
  vx: number; vy: number;
  dmg: number;
  color: number;
  style?: number;         // bullet render style (from the weapon)
  weaponId?: string;      // for the killfeed icon
  life: number;
  dead: boolean;
};

import type { NadeKind } from "./inventory";
import { freezeSpec } from "./grenadeSpecs";
export type Grenade = { id: number; owner: number; team: Team; x: number; y: number; vx: number; vy: number; fuse: number; dmg: number; radius: number; dead: boolean; kind: NadeKind; effDur: number };

// killfeed entry (CS/Battlefield style): who killed whom, with which weapon, headshot flag
export type KillEvent = { id: number; killer: string; killerTeam: Team; victim: string; victimTeam: Team; weapon: string; headshot: boolean; t: number };

export const fighters: Fighter[] = [];
export const bullets: Bullet[] = [];
export const grenades: Grenade[] = [];
export const killfeed: KillEvent[] = [];
export const score = { blue: 0, red: 0 };

// kill-streak announcements ("RAMPAGE" etc.) — fed by the server (online) or local kills (offline sandbox).
// The <StreakBanner/> HUD shows the most recent; the aura reads fighter.streak.
export type StreakEvent = { id: number; name: string; team: Team; label: string; color: string; count: number; t: number };
export const streakFeed: StreakEvent[] = [];
let stkid = 0;
let firstBloodDone = false; // offline (online first blood is server-authoritative)
// announcer voice per streak tier (files in /public/sounds). Only mapped labels play; others are visual-only for now.
const STREAK_SFX: Record<string, string> = { "FIRST BLOOD": "firstblood.mp3", "RAMPAGE": "rampage.mp3" };
export function pushStreak(name: string, team: Team, label: string, color: string, count: number) {
  streakFeed.push({ id: ++stkid, name, team, label, color, count, t: performance.now() });
  if (streakFeed.length > 4) streakFeed.shift();
  const sfx = STREAK_SFX[label]; if (sfx) playSfx(sfx, 0.8); // announcer callout
}

// OFFLINE streak bookkeeping (online is server-authoritative via the STREAK message). Bumps the killer's
// streak, resets the victim's, and announces a tier when hit. No-op-safe if killer is missing.
export function localStreakKill(killer: Fighter | undefined, victim: Fighter) {
  victim.streak = 0;
  if (!killer || killer.id === victim.id) return;
  if (!firstBloodDone) { firstBloodDone = true; pushStreak(killer.name, killer.team, "FIRST BLOOD", "#e0243a", 1); }
  killer.streak = (killer.streak || 0) + 1;
  const tier = streakTier(killer.streak);
  if (tier) pushStreak(killer.name, killer.team, tier.label, tier.color, killer.streak);
}

let fid = 0, bid = 0, gid = 0, kfid = 0;

// record a kill for the feed (weapon = item id or "grenade"); UI fades it out after a few seconds
export function pushKill(killerId: number, victim: Fighter, weapon: string, headshot: boolean) {
  const k = fighters.find((f) => f.id === killerId);
  killfeed.push({ id: ++kfid, killer: k?.name ?? "?", killerTeam: k?.team ?? victim.team, victim: victim.name, victimTeam: victim.team, weapon, headshot, t: performance.now() });
  if (killfeed.length > 8) killfeed.shift();
}

export function spawnGrenade(owner: number, team: Team, x: number, y: number, vx: number, vy: number, dmg = 48, radius = 2.4, kind: NadeKind = "frag", effDur = 0) {
  grenades.push({ id: ++gid, owner, team, x, y, vx, vy, fuse: 1.4, dmg, radius, dead: false, kind, effDur });
}

// ── EXPLOSIVE BARRELS — red barrels that detonate like a frag grenade when shot. Registered by the barrel props
// (KitBarrel); the bullet sim checks hits against this list; blowBarrel() spawns an instant frag blast (reusing the
// grenade VFX + explodeAt damage) and CHAINS neighbouring barrels. They respawn after a while.
// kind "frag" = red damage barrel; "cryo" = blue barrel → shooting it FREEZES/slows the cluster (freeze grenade).
export type BarrelKind = "frag" | "cryo";
export type ExplBarrel = { id: string; x: number; y: number; r: number; kind: BarrelKind; alive: boolean; respawnAt: number };
export const explosiveBarrels: ExplBarrel[] = [];
const BARREL_DMG = 95, BARREL_RADIUS = 5.0, BARREL_RESPAWN = 14000; // big frag blast — wipes a cluster
export function registerBarrel(id: string, x: number, y: number, r: number, kind: BarrelKind = "frag"): ExplBarrel {
  let bb = explosiveBarrels.find((b) => b.id === id);
  if (bb) { bb.x = x; bb.y = y; bb.r = r; bb.kind = kind; } else { bb = { id, x, y, r, kind, alive: true, respawnAt: 0 }; explosiveBarrels.push(bb); }
  return bb;
}
export function unregisterBarrel(id: string) { const i = explosiveBarrels.findIndex((b) => b.id === id); if (i >= 0) explosiveBarrels.splice(i, 1); }
export function blowBarrel(bar: ExplBarrel, team: Team, owner: number) {
  const q = [bar];
  while (q.length) {
    const cur = q.shift()!; if (!cur.alive) continue;
    cur.alive = false; cur.respawnAt = performance.now() + BARREL_RESPAWN;
    if (cur.kind === "cryo") grenades.push({ id: ++gid, owner, team, x: cur.x, y: cur.y, vx: 0, vy: 0, fuse: 0.02, dmg: 0, radius: BARREL_RADIUS, dead: false, kind: "freeze", effDur: 0 }); // cryo blast: freeze/slow the cluster
    else grenades.push({ id: ++gid, owner, team, x: cur.x, y: cur.y, vx: 0, vy: 0, fuse: 0.02, dmg: BARREL_DMG, radius: BARREL_RADIUS, dead: false, kind: "frag", effDur: 0 }); // frag blast
    for (const o of explosiveBarrels) if (o.alive && o !== cur && Math.hypot(o.x - cur.x, o.y - cur.y) < BARREL_RADIUS + o.r) q.push(o); // chain reaction
  }
}

// SCREEN effects for THIS client's own player (ms timestamps, read by <GameFx/>). Set when the local
// fighter is caught in a flash/smoke/freeze blast; the DOM overlay drives the white-out / haze / frost.
export const screenFx = { flashUntil: 0, smokeUntil: 0, frostUntil: 0, flashPeak: 1, hurtUntil: 0, hurtDir: 0 }; // flashPeak = per-hit white ceiling; hurt = took damage (dir: -1 attacker left / +1 right)

// ACTIVE SMOKE CLOUDS as gameplay vision volumes (world circles). A sight line that crosses one is blocked:
// AI can't see/shoot an enemy through smoke (CS/Valorant-style). Bullets still pass (realistic).
export const smokeClouds: { x: number; y: number; r: number; until: number }[] = [];
export function addSmokeCloud(x: number, y: number, r: number, dur: number) {
  const now = performance.now();
  for (let i = smokeClouds.length - 1; i >= 0; i--) if (smokeClouds[i].until < now) smokeClouds.splice(i, 1);
  smokeClouds.push({ x, y, r, until: now + dur });
}
// true if the segment A->B passes through any live smoke cloud (closest point on segment inside the circle)
export function sightBlocked(ax: number, ay: number, bx: number, by: number): boolean {
  const now = performance.now();
  for (const s of smokeClouds) {
    if (s.until < now) continue;
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    let t = ((s.x - ax) * dx + (s.y - ay) * dy) / l2; t = Math.max(0, Math.min(1, t));
    if (Math.hypot(s.x - (ax + t * dx), s.y - (ay + t * dy)) < s.r) return true;
  }
  return false;
}

// DEPLOYED SHIELD ZONES — a thrown "Щит" grenade drops a protective bubble at the blast point: bullets from OUTSIDE
// can't cross in (anyone standing inside is safe), and area blasts don't reach fighters inside. Timed, symmetric.
// zone: x + y (GROUND surface Y where it was thrown) + r. Protection/bullet-block use a sphere centred at chest
// height (y + CHEST_H) so the dome hugs standing fighters; the visual is a hemisphere planted on that ground.
export const CHEST_H = 0.9;
// profile = per-direction CLAMPED radius (filled by the renderer's collider raycasts). The GAMEPLAY reads it too, so
// an effect never reaches THROUGH a wall — a fighter is "inside" only if their distance ≤ the clamped radius toward
// them. Sampled over the upper semicircle [0, π] (angle = atan2(max(0,dy), dx)).
export type Zone = { x: number; y: number; r: number; until: number; team: Team; profile?: number[] };
// clamped radius of a zone in the direction of offset (dx, dy) — matches the visible (wall-hugged) dome shape.
export function zoneRadiusAt(z: Zone, dx: number, dy: number): number {
  const p = z.profile; if (!p || p.length < 2) return z.r;
  const f = Math.max(0, Math.min(1, Math.atan2(Math.max(0, dy), dx) / Math.PI)) * (p.length - 1);
  const i = Math.floor(f), t = f - i;
  return p[i] + (p[Math.min(p.length - 1, i + 1)] - p[i]) * t;
}
export const shieldZones: Zone[] = [];
export function addShieldZone(x: number, y: number, r: number, dur: number, team: Team) {
  const now = performance.now();
  for (let i = shieldZones.length - 1; i >= 0; i--) if (shieldZones[i].until < now) shieldZones.splice(i, 1);
  shieldZones.push({ x, y, r, until: now + dur, team });
}
export function inShieldZone(x: number, y: number): boolean {
  const now = performance.now();
  for (const s of shieldZones) { if (s.until < now) continue; const dx = x - s.x, dy = y - s.y; if (Math.hypot(dx, dy) <= zoneRadiusAt(s, dx, dy)) return true; }
  return false;
}

// HEAL ZONES (green dome, heals the OWNER team inside) + SLOW ZONES (dome slows ENEMIES inside). Same shape as shield
// zones (+ the wall-clamp profile). Deployed by the "Хил-зона" / "Замедление" grenades.
export const healZones: Zone[] = [];
export const slowZones: Zone[] = [];
export function addHealZone(x: number, y: number, r: number, dur: number, team: Team) {
  const now = performance.now();
  for (let i = healZones.length - 1; i >= 0; i--) if (healZones[i].until < now) healZones.splice(i, 1);
  healZones.push({ x, y, r, until: now + dur, team });
}
export function addSlowZone(x: number, y: number, r: number, dur: number, team: Team) {
  const now = performance.now();
  for (let i = slowZones.length - 1; i >= 0; i--) if (slowZones[i].until < now) slowZones.splice(i, 1);
  slowZones.push({ x, y, r, until: now + dur, team });
}
// ── MAP MOVEMENT PROPS: jump-pads (launch up) + teleporters (pad pairs). The system ticks fighter overlaps and sets
// data flags the Fighter body consumes (launchVy / teleportTo) so the real physics does the move (no clipping).
export type JumpPad = { id: string; x: number; y: number; r: number; vy: number; firedAt: number }; // firedAt = last launch (drives the squash+shockwave VFX)
// tx/ty = partner exit; pair = partner id; readyAt = when this pad is usable again (BALANCE: a pad recharges after use,
// and using either pad cools down BOTH so you can't bounce back and forth).
export type Teleporter = { id: string; x: number; y: number; r: number; tx: number; ty: number; pair: string; readyAt: number };
// LIFT: combat OWNS the motion (ticked in tickMovers, which reliably runs) so it never stalls; the visual reads liftY.
export type Lift = { id: string; x: number; w: number; baseY: number; rise: number; speed: number };
export const jumpPads: JumpPad[] = [];
export const teleporters: Teleporter[] = [];
export const lifts: Lift[] = [];
export const liftY: Record<string, number> = {}; // live deck-top Y per lift (written each tick, read by the visual)
export const liftVelY: Record<string, number> = {}; // live deck vertical velocity (m/s) — fed to riders so they coast WITH the deck
const liftPrevY: Record<string, number> = {}; let liftPrevT = 0; // for numeric deck velocity
export function registerLift(id: string, x: number, w: number, baseY: number, rise: number, speed: number) {
  const e = lifts.find((l) => l.id === id); if (e) { e.x = x; e.w = w; e.baseY = baseY; e.rise = rise; e.speed = speed; } else { lifts.push({ id, x, w, baseY, rise, speed }); liftY[id] = baseY; }
}
export function unregisterLift(id: string) { const i = lifts.findIndex((l) => l.id === id); if (i >= 0) lifts.splice(i, 1); delete liftY[id]; }
export function jumpPadFiredAt(id: string): number { return jumpPads.find((p) => p.id === id)?.firedAt ?? 0; }
export function registerJumpPad(id: string, x: number, y: number, r: number, vy: number) {
  const e = jumpPads.find((p) => p.id === id); if (e) { e.x = x; e.y = y; e.r = r; e.vy = vy; } else jumpPads.push({ id, x, y, r, vy, firedAt: 0 });
}
export function registerTeleporter(id: string, x: number, y: number, r: number, tx: number, ty: number, pair: string) {
  const e = teleporters.find((p) => p.id === id); if (e) { e.x = x; e.y = y; e.r = r; e.tx = tx; e.ty = ty; e.pair = pair; } else teleporters.push({ id, x, y, r, tx, ty, pair, readyAt: 0 });
}
// visual: is this pad currently charged (usable)? drives the portal's active/dim look.
export function teleporterReady(id: string): boolean { const t = teleporters.find((p) => p.id === id); return !t || performance.now() >= t.readyAt; }
export const TELEPORT_COOLDOWN = 6000; // ms a pad (and its partner) stays offline after a use
export function unregisterMover(id: string) {
  let i = jumpPads.findIndex((p) => p.id === id); if (i >= 0) jumpPads.splice(i, 1);
  i = teleporters.findIndex((p) => p.id === id); if (i >= 0) teleporters.splice(i, 1);
}
// 0 → (rest) → 1 → (rest) → 0 over u∈[0,2π]. The DWELL (hold) at each floor means the lift actually STOPS so a rider
// stands still, instead of the old non-stop triangle that made you feel like you were forever bobbing/levitating.
const LIFT_DWELL = 0.95; // radians held stationary at the bottom and the top
const LIFT_TH = 0.6;     // lift deck thickness (matches the boxGeometry in cosmos.tsx) → deck spans [deckY-LIFT_TH, deckY]
const liftEase = (u: number) => {
  const up0 = LIFT_DWELL, up1 = Math.PI - LIFT_DWELL, dn0 = Math.PI + LIFT_DWELL, dn1 = 2 * Math.PI - LIFT_DWELL;
  if (u < up0) return 0;                                             // rest at bottom
  if (u < up1) { const s = (u - up0) / (up1 - up0); return s * s * (3 - 2 * s); } // rise
  if (u < dn0) return 1;                                             // rest at top
  if (u < dn1) { const s = (u - dn0) / (dn1 - dn0); return 1 - s * s * (3 - 2 * s); } // descend
  return 0;                                                          // rest at bottom (wrap)
};
// ticked each frame (from the map): move lifts + carry riders, launch over pads, teleport onto teleporters.
export function tickMovers() {
  const now = performance.now(), tsec = now / 1000;
  // LIFTS: advance each deck's Y (combat owns the TIMING); the deck's MOVING KINEMATIC collider (cosmos.tsx) does the
  // ride / head-bonk / side-block via the solver — no carry-snap here. combat only detects the descending CRUSH.
  const liftDt = liftPrevT ? Math.min(0.1, tsec - liftPrevT) : 0;
  for (const l of lifts) {
    const deckY = l.baseY + liftEase((tsec * l.speed) % (Math.PI * 2)) * l.rise;
    const prevY = liftPrevY[l.id];
    liftVelY[l.id] = liftDt > 0 && prevY != null ? (deckY - prevY) / liftDt : 0; // deck vertical velocity (for crush direction)
    liftPrevY[l.id] = deckY;
    liftY[l.id] = deckY;
    // CRUSH: a DESCENDING deck that presses a fighter STANDING on a surface below it (pinned between deck + floor) →
    // instakill. Only when GROUNDED — an airborne jumper who hits the underside just BONKS (the solver blocks him, no
    // kill). Riders on TOP are excluded: their feet ≈ deckY, so the deck bottom (deckY-LIFT_TH) is BELOW their feet.
    if (liftVelY[l.id] < -0.05) {
      const deckBottom = deckY - LIFT_TH;
      for (const f of fighters) {
        const fd = (f as any).footD ?? 0.9;                 // crouch-aware centre→feet (matches Fighter's grounded probe)
        const feet = f.y - fd, head = f.y + fd;
        if (Math.abs(f.x - l.x) >= l.w / 2 || !(deckBottom > feet && deckBottom < head)) continue; // deck bottom must pierce the body
        if (f.alive && f.hp > 0) {
          if (!(f as any).grounded) continue;               // airborne jumper → solver just BONKS his head, no kill
          f.hp = 0; f.deaths++; f.hitFlashUntil = now + 120; f.hitFlashCrit = true;
          pushKill(-1, f, "лифт", false); hitstop(90);      // environmental death (no killer → killfeed shows "?")
        }
        // eject BOTH a fresh crush-kill AND a corpse that was already lying under the deck (the kinematic deck's default
        // groups still press dead bodies) → shove it to the nearest deck edge so it can't be pushed through the floor.
        (f as any).crushOutX = l.x + (Math.sign(f.x - l.x) || 1) * (l.w / 2 + 0.7);
      }
    }
  }
  liftPrevT = tsec;
  for (const f of fighters) {
    if (!f.alive) continue;
    for (const p of jumpPads) {
      if (Math.abs(f.x - p.x) < p.r && Math.abs((f.y - 0.9) - p.y) < 0.7 && ((f as any).grounded !== false)) {
        if (now - ((f as any).padCd ?? 0) > 350) { (f as any).launchVy = p.vy; (f as any).teleportTo = null; (f as any).padCd = now; p.firedAt = now; } // clear any teleport queued THIS tick → no fling-then-yank
      }
    }
    for (const t of teleporters) {
      if (now < t.readyAt) continue; // pad recharging → inert (walk through it)
      if (Math.abs(f.x - t.x) < t.r && Math.abs((f.y - 0.9) - t.y) < 0.9) {
        if (now - ((f as any).tpCd ?? 0) > 800) {
          (f as any).teleportTo = { x: t.tx, y: t.ty + 1.0 }; (f as any).launchVy = 0; (f as any).tpCd = now; // clear any pad launch queued THIS tick
          // cool down BOTH pads → no instant bounce back, and the pair is on shared cooldown (balance).
          t.readyAt = now + TELEPORT_COOLDOWN;
          const partner = teleporters.find((p) => p.id === t.pair); if (partner) partner.readyAt = now + TELEPORT_COOLDOWN;
        }
      }
    }
  }
}
const HEAL_RATE = 32; // hp per second inside a heal dome
// tick heal/slow effects — called once per frame from the renderer.
export function tickZones(dt: number) {
  const now = performance.now();
  // inside = within the wall-CLAMPED radius toward the fighter → effect never passes through a wall (matches the dome).
  const inside = (z: Zone, f: Fighter) => { const dx = f.x - z.x, dy = (f.y + 0.35) - z.y; return Math.hypot(dx, dy) <= zoneRadiusAt(z, dx, dy); };
  for (const z of healZones) {
    if (z.until < now) continue;
    for (const f of fighters) if (f.alive && f.team === z.team && f.hp < f.maxhp && inside(z, f)) f.hp = Math.min(f.maxhp, f.hp + HEAL_RATE * dt);
  }
  for (const z of slowZones) {
    if (z.until < now) continue;
    for (const f of fighters) if (f.alive && f.team !== z.team && inside(z, f)) f.frozenUntil = Math.max(f.frozenUntil ?? 0, now + 140); // refresh slow while inside
  }
}

// detonate a grenade by its KIND. frag = raw area damage; the others apply a status to enemies in range
// (freeze = slow, flash/smoke = lose sight) plus a small hit, and trigger the screen overlay if the local
// player is one of the affected. Returns true if the local player was caught.
export function detonateGrenade(g: Grenade): boolean {
  const now = performance.now();
  // detonation sound (positional; covers thrown grenades AND barrel blasts — barrels spawn frag/freeze grenades).
  const detSfx: Record<string, string> = { frag: "explosion.mp3", freeze: "cryo.mp3", shield: "shield_on.mp3", heal: "shield_on.mp3", slow: "shield_on.mp3" };
  const sfx = detSfx[g.kind]; if (sfx) playSfxAt(sfx, g.x, sfx === "explosion.mp3" ? 0.8 : 0.6, 26, { minGap: 60 });
  if (g.kind === "frag") { explodeAt(g.x, g.y, g.team, g.owner, g.dmg, g.radius); return false; } // ONLY "Урон" deals HP damage
  if (g.kind === "shield") { addShieldZone(g.x, g.y, g.radius, g.effDur || 6000, g.team); return false; } // deploy a protective bubble
  if (g.kind === "heal") { addHealZone(g.x, g.y, g.radius, g.effDur || 6000, g.team); return false; }       // deploy a healing dome
  if (g.kind === "slow") { addSlowZone(g.x, g.y, g.radius, g.effDur || 5000, g.team); return false; }       // deploy a slowing dome
  // flash is resolved with line-of-sight in Grenades.tsx (needs the world raycast); handled elsewhere
  if (g.kind === "flash") return false;
  if (g.kind === "smoke") addSmokeCloud(g.x, g.y, 3.2, 3600); // vision-block clears while the cloud is still thinning
  const R = g.kind === "freeze" ? freezeSpec.radius : g.radius; // freeze radius is tunable (#freeze)
  for (const f of fighters) {
    if (!f.alive) continue;
    if (f.team === g.team) continue;                       // effects hit enemies only
    const d = Math.hypot(f.x - g.x, f.y + 0.35 - g.y);
    if (d > R) continue;
    if (g.kind === "freeze") { f.frozenUntil = now + freezeSpec.dur; if (f.local) screenFx.frostUntil = now + freezeSpec.dur; }
    else if (g.kind === "smoke") f.blindUntil = Math.max(f.blindUntil ?? 0, now + (g.effDur || 2500)); // AI in smoke loses sight
  }
  return false;
}
// role defenses: shield (support) fully negates, block (tank) cuts 70%. Returns final damage.
export function mitigate(f: Fighter, dmg: number): number {
  const now = performance.now();
  if (f.shieldUntil && now < f.shieldUntil) return 0;
  if (f.blockUntil && now < f.blockUntil) return Math.round(dmg * 0.3);
  return dmg;
}
// TANK BALLISTIC SHIELD (held on the front arm): a shot hitting the tank's FRONT is heavily reduced — but the
// shield has DURABILITY (shieldHp). It soaks the blocked portion; once depleted the shield BREAKS and stops
// blocking for a few seconds (then regenerates out of fire, in Fighter). dirX = bullet horizontal direction.
// SINGLE SOURCE: the shield numbers live in shared/shield.mjs so client (here) + server + bot AI never drift.
export { SHIELD_PASS, SHIELD_HP, SHIELD_BREAK_MS } from "../../shared/shield.mjs";
import { SHIELD_PASS, SHIELD_HP, SHIELD_BREAK_MS } from "../../shared/shield.mjs";
// is this a frontal shield hit that is currently blocking? (tank, STANDING with the shield up, facing the
// shot, shield not broken). Moving = shield-walk = no block, so a tank must plant to hold the line.
// energy DOME (pickup) — omnidirectional, impenetrable while active. Blocks all incoming bullets + blasts.
export function shieldDomeActive(f: Fighter): boolean { return !!(f.shieldDomeUntil && performance.now() < f.shieldDomeUntil); }
export function regenActive(f: Fighter): boolean { return !!(f.regenUntil && performance.now() < f.regenUntil); }
export function reflectActive(f: Fighter): boolean { return !!(f.reflectUntil && performance.now() < f.reflectUntil); }
export function cloakActive(f: Fighter): boolean { return !!(f.cloakUntil && performance.now() < f.cloakUntil); }
export function shieldFront(f: Fighter, dirX: number): boolean {
  if (f.role !== "tank" || f.moving) return false; // only blocks while stationary (block-idle stance)
  if (f.shieldBrokenUntil && performance.now() < f.shieldBrokenUntil) return false;
  return Math.sign(dirX) === -f.face; // bullet coming toward the face the shield covers
}
// apply the block: deplete durability by the absorbed portion; break the shield if it runs out. Returns the
// FINAL damage that reaches the tank's HP (25% while intact; full on the shot that breaks it).
export function shieldAbsorb(f: Fighter, dmg: number): number {
  const now = performance.now();
  if (f.shieldHp == null) f.shieldHp = SHIELD_HP;
  f.shieldHitUntil = now + 200; // visual spark window
  const absorbed = dmg * (1 - SHIELD_PASS);
  f.shieldHp -= absorbed;
  if (f.shieldHp <= 0) { f.shieldHp = 0; f.shieldBrokenUntil = now + SHIELD_BREAK_MS; return dmg; } // breaks -> this shot full-through
  return dmg * SHIELD_PASS;
}

// area damage at a point (falloff to the edge). Credits the owner's kills.
export function explodeAt(x: number, y: number, team: Team, owner: number, dmg: number, radius: number) {
  // blast rumble — the closer the explosion is to YOU, the harder the kick
  const me = fighters.find((f) => f.local);
  if (me && me.alive) { const dm = Math.hypot(me.x - x, me.y + 0.35 - y), reach = radius * 2.6; if (dm < reach) { const cl = 1 - dm / reach; rumble(0.25 + 0.5 * cl, 0.35 + 0.6 * cl, 200); addShake(0.35 + 0.4 * cl); } }
  for (const f of fighters) {
    if (!f.alive || f.invuln || shieldDomeActive(f) || inShieldZone(f.x, f.y + 0.35) || reflectActive(f)) continue; // dome / deployed shield zone / reflector absorbs the blast
    const d = Math.hypot(f.x - x, f.y + 0.35 - y);
    if (d > radius) continue;
    const dealt = mitigate(f, Math.round(dmg * (1 - d / radius)));
    const before = f.hp; f.hp -= dealt;
    f.hitFlashUntil = performance.now() + 90; f.hitFlashCrit = false;
    if (dealt > 0 && f.local) { screenFx.hurtUntil = performance.now() + 420; screenFx.hurtDir = x < f.x ? -1 : 1; } // damage-direction from the blast side
    // only YOUR blast damage / blast damage TO you shows a number (skip bot-vs-bot to keep the screen readable)
    if (dealt > 0 && (f.local || fighters.find((o) => o.id === owner)?.local)) spawnDamage(f.x, f.y + 0.9, dealt, false);
    if (before > 0 && f.hp <= 0) { score[team] += 1; f.deaths++; const k = fighters.find((kk) => kk.id === owner); if (k && k.id !== f.id) k.kills++; localStreakKill(k, f); pushKill(owner, f, "grenade", false); hitstop(90); if (k?.local && k.id !== f.id) { rumble(0.4, 0.75, 140); satkPop(ARENA_KILL_SATK); } } // cosmetic "+10 SATK" cue on YOUR grenade kill (mirrors ECON.arena.perKill; server owns the real payout)
  }
  // CHAIN explosive barrels caught in the blast — a frag landing next to a barrel should set it off. blowBarrel marks
  // the barrel dead first, so the frag it spawns re-entering explodeAt finds it dead → no infinite loop.
  for (const bar of explosiveBarrels) if (bar.alive && Math.hypot(bar.x - x, bar.y - y) < radius + bar.r) blowBarrel(bar, team, owner);
}

export function addFighter(team: Team, name: string, hp: number): Fighter {
  const f: Fighter = { id: ++fid, team, name, x: 0, y: 0, face: team === "blue" ? 1 : -1, hp, maxhp: hp, alive: true, respawnAt: 0, kills: 0, deaths: 0, assists: 0, nades: 3 };
  fighters.push(f);
  return f;
}

export function removeFighter(f: Fighter) {
  const i = fighters.indexOf(f);
  if (i >= 0) fighters.splice(i, 1);
}

// killfeed entry from a networked kill event (we have names + teams, not local ids)
export function pushKillRaw(killer: string, killerTeam: Team, victim: string, victimTeam: Team, weapon: string, headshot: boolean) {
  killfeed.push({ id: ++kfid, killer, killerTeam, victim, victimTeam, weapon, headshot, t: performance.now() });
  if (killfeed.length > 8) killfeed.shift();
}

export function resetCombat() {
  fighters.length = 0;
  bullets.length = 0;
  grenades.length = 0;
  killfeed.length = 0;
  streakFeed.length = 0;
  damageNumbers.length = 0;
  explosiveBarrels.length = 0;
  shieldZones.length = 0;
  healZones.length = 0;
  slowZones.length = 0;
  jumpPads.length = 0;
  teleporters.length = 0;
  lifts.length = 0;
  for (const k in liftY) delete liftY[k]; for (const k in liftVelY) delete liftVelY[k]; for (const k in liftPrevY) delete liftPrevY[k]; liftPrevT = 0; // clear lift motion state → no stale velocity/dt glitch on rematch
  smokeClouds.length = 0;
  score.blue = 0; score.red = 0;
  firstBloodDone = false;
  fid = 0; bid = 0; gid = 0; kfid = 0; stkid = 0;
}

export function spawnBullet(x: number, y: number, dir: 1 | -1, team: Team, dmg: number, color: number) {
  bullets.push({ id: ++bid, team, owner: 0, x, y, vx: dir * 26, vy: 0, dmg, color, life: 1.6, dead: false });
}

// aimed shot: (ax,ay) is a normalized aim direction in the XY plane
export function spawnBulletAimed(owner: number, x: number, y: number, ax: number, ay: number, team: Team, dmg: number, color: number, speed = 26, style?: number, weaponId?: string) {
  bullets.push({ id: ++bid, team, owner, x, y, vx: ax * speed, vy: ay * speed, dmg, color, style, weaponId, life: 1.6, dead: false });
}

export function nearestEnemy(f: Fighter): Fighter | null {
  let best: Fighter | null = null, bd = Infinity;
  for (const o of fighters) {
    if (o.team === f.team || !o.alive) continue;
    const d = Math.hypot(o.x - f.x, o.y - f.y);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
