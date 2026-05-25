import { LASER, PLAYER, SPAWNING, WORLD } from './config.js';

let nextEntityId = 1;

export function createHazard(options) {
  const size = options.size ?? SPAWNING.hazardBaseSize;
  return {
    id: nextId('hazard'),
    type: 'hazard',
    lane: options.lane,
    x: options.x,
    y: options.y,
    width: size,
    height: size,
    speed: options.speed,
    variant: options.variant ?? 0,
    bob: options.bob ?? 0,
    nearMissAwarded: false,
  };
}

export function createCollectible(options) {
  return {
    id: nextId('collectible'),
    type: 'collectible',
    lane: options.lane,
    x: options.x,
    y: options.y,
    width: options.size ?? 42,
    height: options.size ?? 42,
    value: options.value ?? 10,
    comboTime: options.comboTime ?? 1.7,
    special: Boolean(options.special),
    collected: false,
  };
}

export function createPowerup(options) {
  return {
    id: nextId('powerup'),
    type: 'powerup',
    powerupType: options.powerupType,
    lane: options.lane,
    x: options.x,
    y: options.y,
    width: options.size ?? 46,
    height: options.size ?? 46,
    collected: false,
  };
}

export function createParticle(options) {
  return {
    id: nextId('particle'),
    type: 'particle',
    x: options.x,
    y: options.y,
    vx: options.vx ?? 0,
    vy: options.vy ?? 0,
    size: options.size ?? 4,
    life: options.life ?? 0.45,
    maxLife: options.life ?? 0.45,
    color: options.color ?? '#ffffff',
  };
}

export function createLaser(options) {
  return {
    id: nextId('laser'),
    type: 'laser',
    x: options.x,
    y: options.y,
    width: options.width ?? LASER.width,
    height: options.height ?? LASER.height,
    vx: options.vx ?? LASER.speed,
    life: options.life ?? LASER.life,
    maxLife: options.life ?? LASER.life,
    spent: false,
  };
}

export function createFloatingText(options) {
  return {
    id: nextId('text'),
    type: 'floatingText',
    x: options.x,
    y: options.y,
    text: options.text,
    life: options.life ?? 0.85,
    maxLife: options.life ?? 0.85,
    color: options.color ?? '#ffffff',
  };
}

export function laneY(lane, viewportHeight) {
  const band = getPlayableBand(viewportHeight);
  const laneCount = SPAWNING.lanes;
  const step = (band.bottom - band.top) / Math.max(1, laneCount - 1);
  return band.top + clampLane(lane) * step;
}

export function getPlayableBand(viewportHeight) {
  const groundTop = viewportHeight - PLAYER.height - PLAYER.groundPadding;
  const bottom = Math.min(
    viewportHeight - WORLD.seaHeight - 34,
    groundTop + PLAYER.height * 0.45,
  );
  const top = Math.max(156, bottom - PLAYER.reachableAirBand);
  return { top, bottom };
}

function nextId(prefix) {
  const id = `${prefix}-${nextEntityId}`;
  nextEntityId += 1;
  return id;
}

function clampLane(lane) {
  return Math.max(0, Math.min(SPAWNING.lanes - 1, lane));
}
