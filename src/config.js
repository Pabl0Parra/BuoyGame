export const SCORING = {
  distancePixelsPerPoint: 10,
  nearMissValue: 15,
  nearMissComboTime: 1.6,
  maxMultiplier: 8,
  comboStep: 2,
};

export const PLAYER = {
  width: 58,
  height: 58,
  startXRatio: 0.22,
  gravity: 2200,
  jumpVelocity: -820,
  maxFallSpeed: 1200,
  acceleration: 2600,
  friction: 2200,
  maxSpeed: 430,
  maxJumps: 2,
  groundPadding: 58,
  coyoteTime: 0.08,
  jumpBufferTime: 0.12,
  reachableAirBand: 292,
};

export const POWERUPS = {
  shield: { duration: 0 },
  magnet: { duration: 7, radius: 190 },
  boost: { duration: 5, speedMultiplier: 1.22, scoreMultiplier: 1.5 },
  gun: { ammo: 3, cooldown: 0.18 },
};

export const WORLD = {
  baseSpeed: 240,
  maxSpeed: 620,
  speedRampPerSecond: 5.5,
  seaHeight: 86,
};

export const SPAWNING = {
  lanes: 4,
  patternSpacing: 430,
  collectibleChance: 0.72,
  powerupChance: 0.12,
  hazardBaseSize: 78,
  hazardLargeSize: 104,
  hazardSmallSize: 58,
};

export const LASER = {
  width: 48,
  height: 8,
  speed: 980,
  life: 0.75,
};
