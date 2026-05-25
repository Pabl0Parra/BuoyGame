import test from 'node:test';
import assert from 'node:assert/strict';
import { createHazard, createLaser, createPowerup } from '../src/entities.js';

test('gun collectible is represented as a gun powerup', () => {
  const gun = createPowerup({
    powerupType: 'gun',
    lane: 1,
    x: 400,
    y: 240,
  });

  assert.equal(gun.type, 'powerup');
  assert.equal(gun.powerupType, 'gun');
});

test('laser intersects a hazard in front of it', () => {
  const laser = createLaser({ x: 100, y: 220 });
  const hazard = createHazard({
    lane: 1,
    x: 130,
    y: 212,
    size: 58,
    speed: 260,
  });

  assert.equal(laserHitsHazard(laser, hazard), true);
});

function laserHitsHazard(laser, hazard) {
  return (
    laser.x < hazard.x + hazard.width &&
    laser.x + laser.width > hazard.x &&
    laser.y < hazard.y + hazard.height &&
    laser.y + laser.height > hazard.y
  );
}
