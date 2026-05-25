import { PLAYER, POWERUPS } from './config.js';
import { createLaser } from './entities.js';

export function createPlayer(viewport) {
  const player = {
    x: Math.round(viewport.width * PLAYER.startXRatio),
    y: 0,
    width: PLAYER.width,
    height: PLAYER.height,
    vx: 0,
    vy: 0,
    jumpsLeft: PLAYER.maxJumps,
    isGrounded: true,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    shieldCharges: 0,
    invulnerableTimer: 0,
    powerups: {
      magnet: 0,
      boost: 0,
    },
    weapon: {
      ammo: 0,
      cooldown: 0,
    },
  };

  player.y = groundY(viewport.height, player);
  return player;
}

export function updatePlayer(player, input, deltaSeconds, world) {
  const ground = groundY(world.height, player);

  updatePowerupTimers(player, deltaSeconds);
  updateHorizontalMovement(player, input, deltaSeconds);

  if (input.jumpPressed) {
    player.jumpBufferTimer = PLAYER.jumpBufferTime;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - deltaSeconds);
  }

  if (player.isGrounded) {
    player.coyoteTimer = PLAYER.coyoteTime;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - deltaSeconds);
  }

  if (player.jumpBufferTimer > 0 && canJump(player)) {
    jumpPlayer(player);
    player.jumpBufferTimer = 0;
  }

  player.vy = Math.min(
    PLAYER.maxFallSpeed,
    player.vy + PLAYER.gravity * deltaSeconds,
  );
  player.x += player.vx * deltaSeconds;
  player.y += player.vy * deltaSeconds;

  player.x = clamp(player.x, 10, world.width - player.width - 10);

  if (player.y >= ground) {
    player.y = ground;
    player.vy = 0;
    player.jumpsLeft = PLAYER.maxJumps;
    player.isGrounded = true;
  } else {
    player.isGrounded = false;
  }

  player.invulnerableTimer = Math.max(
    0,
    player.invulnerableTimer - deltaSeconds,
  );
  player.weapon.cooldown = Math.max(0, player.weapon.cooldown - deltaSeconds);
}

export function jumpPlayer(player) {
  if (!canJump(player)) {
    return false;
  }

  player.vy = PLAYER.jumpVelocity;
  player.jumpsLeft -= 1;
  player.isGrounded = false;
  player.coyoteTimer = 0;
  return true;
}

export function damagePlayer(player) {
  if (player.invulnerableTimer > 0) {
    return 'invulnerable';
  }

  if (player.shieldCharges > 0) {
    player.shieldCharges -= 1;
    return 'shielded';
  }

  return 'hit';
}

export function applyPowerup(player, type, durationSeconds) {
  if (type === 'shield') {
    player.shieldCharges = Math.max(1, player.shieldCharges + 1);
    return;
  }

  if (type === 'gun') {
    player.weapon.ammo += POWERUPS.gun.ammo;
    return;
  }

  if (type in player.powerups) {
    player.powerups[type] = Math.max(
      player.powerups[type],
      durationSeconds ?? POWERUPS[type].duration,
    );
  }
}

export function shootLaser(player) {
  if (player.weapon.ammo <= 0 || player.weapon.cooldown > 0) {
    return null;
  }

  player.weapon.ammo -= 1;
  player.weapon.cooldown = POWERUPS.gun.cooldown;

  return createLaser({
    x: player.x + player.width - 4,
    y: player.y + player.height * 0.42,
  });
}

export function resizePlayer(player, viewport) {
  player.x = clamp(player.x, 10, viewport.width - player.width - 10);
  player.y = Math.min(player.y, groundY(viewport.height, player));
  if (player.y === groundY(viewport.height, player)) {
    player.isGrounded = true;
    player.jumpsLeft = PLAYER.maxJumps;
  }
}

export function hasPowerup(player, type) {
  return Boolean(player.powerups[type] > 0);
}

function canJump(player) {
  return player.jumpsLeft > 0 || player.coyoteTimer > 0;
}

function updateHorizontalMovement(player, input, deltaSeconds) {
  const direction = Number(Boolean(input.right)) - Number(Boolean(input.left));

  if (direction !== 0) {
    player.vx += direction * PLAYER.acceleration * deltaSeconds;
  } else {
    const friction = PLAYER.friction * deltaSeconds;
    if (Math.abs(player.vx) <= friction) {
      player.vx = 0;
    } else {
      player.vx -= Math.sign(player.vx) * friction;
    }
  }

  player.vx = clamp(player.vx, -PLAYER.maxSpeed, PLAYER.maxSpeed);
}

function updatePowerupTimers(player, deltaSeconds) {
  for (const key of Object.keys(player.powerups)) {
    player.powerups[key] = Math.max(0, player.powerups[key] - deltaSeconds);
  }
}

function groundY(height, player) {
  return height - player.height - PLAYER.groundPadding;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
