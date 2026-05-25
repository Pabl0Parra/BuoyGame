import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPowerup,
  createPlayer,
  damagePlayer,
  jumpPlayer,
  shootLaser,
  updatePlayer,
} from '../src/player.js';

const viewport = { width: 1000, height: 700 };

test('player starts grounded with two jumps', () => {
  const player = createPlayer(viewport);

  assert.equal(player.jumpsLeft, 2);
  assert.equal(player.x, 220);
  assert.equal(player.y, 584);
  assert.equal(player.isGrounded, true);
});

test('jump consumes one jump and sets upward velocity', () => {
  const player = createPlayer(viewport);

  const didJump = jumpPlayer(player);

  assert.equal(didJump, true);
  assert.equal(player.jumpsLeft, 1);
  assert.equal(player.vy < 0, true);
  assert.equal(player.isGrounded, false);
});

test('landing resets jumps', () => {
  const player = createPlayer(viewport);

  jumpPlayer(player);
  updatePlayer(
    player,
    { left: false, right: false, jumpPressed: false },
    2,
    { width: viewport.width, height: viewport.height },
  );

  assert.equal(player.y, 584);
  assert.equal(player.vy, 0);
  assert.equal(player.jumpsLeft, 2);
  assert.equal(player.isGrounded, true);
});

test('shield absorbs one hit before damage can end the run', () => {
  const player = createPlayer(viewport);

  applyPowerup(player, 'shield');

  assert.equal(damagePlayer(player), 'shielded');
  assert.equal(player.shieldCharges, 0);
  assert.equal(damagePlayer(player), 'hit');
});

test('magnet and boost timers expire during update', () => {
  const player = createPlayer(viewport);

  applyPowerup(player, 'magnet', 1);
  applyPowerup(player, 'boost', 1);
  updatePlayer(
    player,
    { left: false, right: false, jumpPressed: false },
    1.5,
    { width: viewport.width, height: viewport.height },
  );

  assert.equal(player.powerups.magnet, 0);
  assert.equal(player.powerups.boost, 0);
});

test('gun powerup grants ammo and shooting consumes one shot', () => {
  const player = createPlayer(viewport);

  applyPowerup(player, 'gun');
  const laser = shootLaser(player);

  assert.equal(player.weapon.ammo, 2);
  assert.equal(laser.type, 'laser');
  assert.equal(laser.x > player.x, true);
  assert.equal(laser.vx > 0, true);
});

test('shooting without ammo does not create a laser', () => {
  const player = createPlayer(viewport);

  assert.equal(shootLaser(player), null);
});
