import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSpawner,
  getDifficulty,
  spawnCollectibleLine,
  spawnHazardPattern,
  spawnPattern,
} from '../src/spawner.js';

const context = {
  distance: 500,
  viewport: { width: 1000, height: 700 },
  worldSpeed: 260,
};

test('spawnPattern creates hazards and collectibles', () => {
  const spawner = createSpawner(() => 0.35);

  const pattern = spawnPattern(spawner, context);

  assert.equal(pattern.hazards.length > 0, true);
  assert.equal(pattern.collectibles.length > 0, true);
  assert.equal(Array.isArray(pattern.powerups), true);
});

test('hazard pattern leaves at least one safe lane', () => {
  const hazards = spawnHazardPattern({
    ...context,
    blockedLaneRolls: [0, 1, 2, 3],
  });
  const blocked = new Set(hazards.map((hazard) => hazard.lane));

  assert.equal(blocked.size < 5, true);
});

test('difficulty increases with distance', () => {
  const early = getDifficulty(0);
  const late = getDifficulty(6000);

  assert.equal(late.speedMultiplier > early.speedMultiplier, true);
  assert.equal(late.hazardCount >= early.hazardCount, true);
});

test('powerups are generated less often than normal collectibles', () => {
  const spawner = createSpawner(() => 0.5);
  let collectibleCount = 0;
  let powerupCount = 0;

  for (let i = 0; i < 30; i += 1) {
    const pattern = spawnPattern(spawner, { ...context, distance: i * 250 });
    collectibleCount += pattern.collectibles.length;
    powerupCount += pattern.powerups.length;
  }

  assert.equal(collectibleCount > powerupCount, true);
});

test('collectible lines place items in one lane', () => {
  const line = spawnCollectibleLine({ ...context, lane: 2, count: 4 });

  assert.equal(line.length, 4);
  assert.equal(line.every((item) => item.lane === 2), true);
});
