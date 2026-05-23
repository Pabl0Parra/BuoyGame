import { POWERUPS, WORLD } from './config.js';
import {
  createFloatingText,
  createParticle,
} from './entities.js';
import {
  addCollectibleScore,
  addDistanceScore,
  addNearMissScore,
  commitBestScore,
  createScoring,
  resetCombo,
  updateCombo,
} from './scoring.js';
import {
  applyPowerup,
  createPlayer,
  damagePlayer,
  hasPowerup,
  jumpPlayer,
  resizePlayer,
  updatePlayer,
} from './player.js';
import { createSpawner, spawnPattern } from './spawner.js';
import {
  clear,
  drawBackground,
  drawEntities,
  drawOverlayBackdrop,
  drawParticles,
  drawPlayer,
  drawSea,
  resizeRenderer,
} from './renderer.js';

export function createGame(dependencies) {
  const viewport = getViewport(dependencies.renderer);
  const scoring = createScoring(dependencies.bestScore);

  return {
    state: 'start',
    renderer: dependencies.renderer,
    input: dependencies.input,
    audio: dependencies.audio,
    hud: dependencies.hud,
    storage: dependencies.storage,
    player: createPlayer(viewport),
    scoring,
    spawner: createSpawner(),
    hazards: [],
    collectibles: [],
    powerups: [],
    particles: [],
    floatingText: [],
    distance: 0,
    worldSpeed: WORLD.baseSpeed,
    spawnTimer: 0.6,
    time: 0,
    lastFrameInput: {},
  };
}

export function startGame(game) {
  resetRun(game);
  game.state = 'playing';
  game.audio.startMusic();
  updateOverlay(game);
}

export function pauseGame(game) {
  if (game.state !== 'playing') return;
  game.state = 'paused';
  updateOverlay(game);
}

export function resumeGame(game) {
  if (game.state !== 'paused') return;
  game.state = 'playing';
  game.audio.startMusic();
  updateOverlay(game);
}

export function restartGame(game) {
  startGame(game);
}

export function updateGame(game, deltaSeconds) {
  const input = game.input.consumeFrame();
  game.lastFrameInput = input;

  if (input.mutePressed) {
    game.audio.toggleMuted();
  }

  if (input.pausePressed) {
    if (game.state === 'playing') pauseGame(game);
    else if (game.state === 'paused') resumeGame(game);
  }

  if (game.state !== 'playing') {
    updateHud(game);
    return;
  }

  game.time += deltaSeconds;
  game.worldSpeed = Math.min(
    WORLD.maxSpeed,
    game.worldSpeed + WORLD.speedRampPerSecond * deltaSeconds,
  );
  game.distance += game.worldSpeed * deltaSeconds;

  if (input.jumpPressed && jumpPlayer(game.player)) {
    game.audio.playEffect('jump');
  }

  updatePlayer(
    game.player,
    { ...input, jumpPressed: false },
    deltaSeconds,
    getViewport(game.renderer),
  );
  addDistanceScore(
    game.scoring,
    game.worldSpeed * deltaSeconds,
    hasPowerup(game.player, 'boost') ? POWERUPS.boost.scoreMultiplier : 1,
  );
  updateCombo(game.scoring, deltaSeconds);

  updateSpawning(game, deltaSeconds);
  updateEntities(game, deltaSeconds);
  updateHud(game);
}

export function renderGame(game) {
  const camera = { x: game.distance };
  clear(game.renderer);
  drawBackground(game.renderer, camera, game.time);
  drawSea(game.renderer, game.time);
  drawEntities(
    game.renderer,
    [...game.hazards, ...game.collectibles, ...game.powerups, ...game.floatingText],
    game.time,
  );
  drawParticles(game.renderer, game.particles);
  drawPlayer(game.renderer, game.player, game.time);

  if (game.state !== 'playing') {
    drawOverlayBackdrop(game.renderer);
  }
}

export function resizeGame(game) {
  resizeRenderer(game.renderer);
  resizePlayer(game.player, getViewport(game.renderer));
}

export function primaryAction(game) {
  if (game.state === 'start' || game.state === 'gameOver') {
    restartGame(game);
  } else if (game.state === 'paused') {
    resumeGame(game);
  }
}

function resetRun(game) {
  const viewport = getViewport(game.renderer);
  game.player = createPlayer(viewport);
  game.scoring = createScoring(game.scoring.bestScore);
  game.spawner = createSpawner();
  game.hazards = [];
  game.collectibles = [];
  game.powerups = [];
  game.particles = [];
  game.floatingText = [];
  game.distance = 0;
  game.worldSpeed = WORLD.baseSpeed;
  game.spawnTimer = 0.4;
  game.time = 0;
}

function updateSpawning(game, deltaSeconds) {
  game.spawnTimer -= deltaSeconds;
  if (game.spawnTimer > 0) return;

  const pattern = spawnPattern(game.spawner, {
    distance: game.distance,
    viewport: getViewport(game.renderer),
    worldSpeed: game.worldSpeed,
    cameraX: 0,
  });
  game.hazards.push(...pattern.hazards);
  game.collectibles.push(...pattern.collectibles);
  game.powerups.push(...pattern.powerups);
  game.spawnTimer = Math.max(0.78, 1.55 - game.distance / 8500);
}

function updateEntities(game, deltaSeconds) {
  moveEntities(game, deltaSeconds);
  collectItems(game);
  checkHazards(game);
  updateTransient(game.particles, deltaSeconds);
  updateTransient(game.floatingText, deltaSeconds);
  removeOffscreen(game);
}

function moveEntities(game, deltaSeconds) {
  for (const hazard of game.hazards) {
    hazard.x -= hazard.speed * deltaSeconds;
  }
  for (const collectible of game.collectibles) {
    if (hasPowerup(game.player, 'magnet')) {
      pullTowardPlayer(collectible, game.player, deltaSeconds);
    }
    collectible.x -= game.worldSpeed * deltaSeconds;
  }
  for (const powerup of game.powerups) {
    powerup.x -= game.worldSpeed * deltaSeconds;
  }
}

function collectItems(game) {
  for (const collectible of game.collectibles) {
    if (!collectible.collected && intersects(game.player, collectible)) {
      collectible.collected = true;
      addCollectibleScore(game.scoring, collectible);
      addBurst(game, collectible.x, collectible.y, collectible.special ? '#ffdc5e' : '#28d5a3');
      addText(game, collectible.x, collectible.y, `+${collectible.value}`);
      game.audio.playEffect(collectible.special ? 'special' : 'collectible');
    }
  }

  for (const powerup of game.powerups) {
    if (!powerup.collected && intersects(game.player, powerup)) {
      powerup.collected = true;
      applyPowerup(game.player, powerup.powerupType);
      addText(game, powerup.x, powerup.y, powerup.powerupType.toUpperCase());
      addBurst(game, powerup.x, powerup.y, '#ffdc5e');
      game.audio.playEffect('special');
    }
  }
}

function checkHazards(game) {
  for (const hazard of game.hazards) {
    if (intersects(game.player, hazard)) {
      const result = damagePlayer(game.player);
      if (result === 'shielded') {
        addText(game, game.player.x, game.player.y, 'SHIELD');
        addBurst(game, game.player.x, game.player.y, '#56e0ff');
        resetCombo(game.scoring);
      } else if (result === 'hit') {
        endRun(game);
      }
      return;
    }

    if (!hazard.nearMissAwarded && passedNearPlayer(game.player, hazard)) {
      hazard.nearMissAwarded = true;
      addNearMissScore(game.scoring);
      addText(game, game.player.x + 34, game.player.y, 'Near Miss');
    }
  }
}

function endRun(game) {
  game.state = 'gameOver';
  const bestScore = commitBestScore(game.scoring);
  game.storage.saveBestScore(bestScore);
  game.audio.playEffect('gameOver');
  game.audio.stopMusic();
  updateOverlay(game);
}

function updateTransient(items, deltaSeconds) {
  for (const item of items) {
    item.life -= deltaSeconds;
    item.x += (item.vx ?? 0) * deltaSeconds;
    item.y += (item.vy ?? -24) * deltaSeconds;
  }
}

function removeOffscreen(game) {
  game.hazards = game.hazards.filter((item) => item.x + item.width > -120);
  game.collectibles = game.collectibles.filter(
    (item) => !item.collected && item.x + item.width > -80,
  );
  game.powerups = game.powerups.filter(
    (item) => !item.collected && item.x + item.width > -80,
  );
  game.particles = game.particles.filter((item) => item.life > 0);
  game.floatingText = game.floatingText.filter((item) => item.life > 0);
}

function updateHud(game) {
  const comboRatio =
    game.scoring.comboTimerMax > 0
      ? game.scoring.comboTimer / game.scoring.comboTimerMax
      : 0;
  game.hud.score.textContent = String(Math.floor(game.scoring.score));
  game.hud.best.textContent = String(Math.floor(game.scoring.bestScore));
  game.hud.combo.textContent = `x${game.scoring.multiplier}`;
  game.hud.comboMeter.style.width = `${Math.max(0, comboRatio) * 100}%`;
}

function updateOverlay(game) {
  const overlay = game.hud.overlay;
  overlay.classList.toggle('is-visible', game.state !== 'playing');

  if (game.state === 'start') {
    game.hud.overlayText.textContent =
      'Dodge hazards, collect energy, keep the combo alive.';
    game.hud.primaryAction.textContent = 'Start';
  } else if (game.state === 'paused') {
    game.hud.overlayText.textContent = 'Paused';
    game.hud.primaryAction.textContent = 'Resume';
  } else if (game.state === 'gameOver') {
    game.hud.overlayText.textContent = `Final score: ${Math.floor(
      game.scoring.score,
    )}. Best: ${Math.floor(game.scoring.bestScore)}.`;
    game.hud.primaryAction.textContent = 'Restart';
  }
}

function addBurst(game, x, y, color) {
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    game.particles.push(
      createParticle({
        x,
        y,
        vx: Math.cos(angle) * 90,
        vy: Math.sin(angle) * 90,
        color,
        life: 0.42,
      }),
    );
  }
}

function addText(game, x, y, text) {
  game.floatingText.push(
    createFloatingText({
      x,
      y,
      text,
      color: '#ffffff',
    }),
  );
}

function pullTowardPlayer(item, player, deltaSeconds) {
  const dx = player.x + player.width / 2 - (item.x + item.width / 2);
  const dy = player.y + player.height / 2 - (item.y + item.height / 2);
  const distance = Math.hypot(dx, dy);
  if (distance > POWERUPS.magnet.radius || distance === 0) return;

  item.x += (dx / distance) * 280 * deltaSeconds;
  item.y += (dy / distance) * 280 * deltaSeconds;
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function passedNearPlayer(player, hazard) {
  const hazardRight = hazard.x + hazard.width;
  const verticalOverlap =
    player.y < hazard.y + hazard.height + 26 &&
    player.y + player.height > hazard.y - 26;
  return hazardRight < player.x && hazardRight > player.x - 18 && verticalOverlap;
}

function getViewport(renderer) {
  return {
    width: renderer.width,
    height: renderer.height,
  };
}
