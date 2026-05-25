import { SPAWNING, WORLD } from './config.js';
import {
  createCollectible,
  createHazard,
  createPowerup,
  laneY,
} from './entities.js';

const POWERUP_TYPES = ['shield', 'magnet', 'boost', 'gun'];

export function createSpawner(random = Math.random) {
  return {
    random,
    nextX: 0,
    patternIndex: 0,
  };
}

export function getDifficulty(distance) {
  const level = Math.min(1, Math.max(0, distance / 6000));
  return {
    level,
    speedMultiplier: 1 + level * 0.7,
    hazardCount: 2 + Math.floor(level * 2),
    collectibleCount: 3 + Math.floor(level * 3),
    spacing: SPAWNING.patternSpacing - level * 110,
  };
}

export function spawnPattern(spawner, context) {
  const difficulty = getDifficulty(context.distance);
  const x =
    (context.cameraX ?? 0) +
    context.viewport.width +
    120 +
    spawner.patternIndex * difficulty.spacing;
  const safeLane = randomLane(spawner.random);
  const hazardRolls = selectHazardLanes(
    safeLane,
    difficulty.hazardCount,
    randomLane(spawner.random),
  );

  const hazards = spawnHazardPattern({
    ...context,
    x,
    blockedLaneRolls: hazardRolls,
    difficulty,
  });
  const collectibleLane =
    spawner.random() < 0.65 ? safeLane : randomLane(spawner.random);
  const collectibles =
    spawner.random() < SPAWNING.collectibleChance
      ? spawnCollectibleLine({
          ...context,
          x: x + 80,
          lane: collectibleLane,
          count: difficulty.collectibleCount,
        })
      : [];
  const powerups =
    spawner.random() < SPAWNING.powerupChance
      ? [
          createPowerup({
            powerupType:
              spawner.random() < 0.25
                ? 'gun'
                : POWERUP_TYPES[spawner.patternIndex % POWERUP_TYPES.length],
            lane: safeLane,
            x: x + 190,
            y: laneY(safeLane, context.viewport.height),
          }),
        ]
      : [];

  spawner.patternIndex += 1;
  spawner.nextX = x + difficulty.spacing;

  return { hazards, collectibles, powerups };
}

export function spawnCollectibleLine(context) {
  const count = context.count ?? 4;
  const lane = context.lane ?? 2;
  const startX = context.x ?? context.viewport.width + 140;

  return Array.from({ length: count }, (_, index) =>
    createCollectible({
      lane,
      x: startX + index * 54,
      y: laneY(lane, context.viewport.height),
      value: index === count - 1 ? 20 : 10,
      comboTime: index === count - 1 ? 2.1 : 1.5,
      special: index === count - 1,
    }),
  );
}

export function spawnHazardPattern(context) {
  const lanes = normalizeBlockedLanes(context.blockedLaneRolls);
  const difficulty = context.difficulty ?? getDifficulty(context.distance);
  const startX = context.x ?? context.viewport.width + 180;

  return lanes.map((lane, index) => {
    const isSmall = index % 3 === 1;
    const isLarge = index % 3 === 2;
    const size = isSmall
      ? SPAWNING.hazardSmallSize
      : isLarge
        ? SPAWNING.hazardLargeSize
        : SPAWNING.hazardBaseSize;

    return createHazard({
      lane,
      x: startX + index * 86,
      y: laneY(lane, context.viewport.height) - size / 2,
      size,
      speed:
        (context.worldSpeed ?? WORLD.baseSpeed) *
        difficulty.speedMultiplier *
        (isSmall ? 1.16 : 1),
      variant: index % 4,
      bob: isLarge ? 0 : 10 + index * 2,
    });
  });
}

function normalizeBlockedLanes(lanes) {
  const unique = [...new Set(lanes.map((lane) => clampLane(lane)))];
  if (unique.length >= SPAWNING.lanes) {
    unique.shift();
  }
  return unique;
}

function randomLane(random) {
  return Math.floor(random() * SPAWNING.lanes);
}

function selectHazardLanes(safeLane, count, startLane) {
  const lanes = [];
  for (let offset = 0; offset < SPAWNING.lanes && lanes.length < count; offset += 1) {
    const lane = (startLane + offset) % SPAWNING.lanes;
    if (lane !== safeLane) {
      lanes.push(lane);
    }
  }
  return lanes;
}

function clampLane(lane) {
  return Math.max(0, Math.min(SPAWNING.lanes - 1, lane));
}
