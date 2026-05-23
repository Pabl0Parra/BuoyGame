import { POWERUPS, WORLD } from './config.js';
import { hasPowerup } from './player.js';

export function createRenderer(canvas, assets) {
  const context = canvas.getContext('2d');
  const renderer = {
    canvas,
    context,
    assets,
    width: 0,
    height: 0,
    pixelRatio: 1,
  };
  resizeRenderer(renderer);
  return renderer;
}

export function resizeRenderer(renderer) {
  renderer.pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  renderer.width = window.innerWidth;
  renderer.height = window.innerHeight;
  renderer.canvas.width = Math.floor(renderer.width * renderer.pixelRatio);
  renderer.canvas.height = Math.floor(renderer.height * renderer.pixelRatio);
  renderer.canvas.style.width = `${renderer.width}px`;
  renderer.canvas.style.height = `${renderer.height}px`;
  renderer.context.setTransform(
    renderer.pixelRatio,
    0,
    0,
    renderer.pixelRatio,
    0,
    0,
  );
}

export function clear(renderer) {
  renderer.context.clearRect(0, 0, renderer.width, renderer.height);
}

export function drawBackground(renderer, camera, time) {
  const { context: ctx, assets, width, height } = renderer;
  drawSkyFallback(ctx, width, height);

  drawLayer(renderer, assets.images.backgroundFar, camera.x * 0.18, height, 1);
  drawLayer(renderer, assets.images.backgroundMid, camera.x * 0.32, height, 0.82);
  drawLayer(renderer, assets.images.backgroundNear, camera.x * 0.48, height, 0.64);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 230 - camera.x * 0.12) % (width + 260)) - 80;
    const y = 88 + Math.sin(time * 0.7 + i) * 7;
    ctx.beginPath();
    ctx.ellipse(x, y, 54, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawSea(renderer, time) {
  const { context: ctx, width, height } = renderer;
  const seaTop = height - WORLD.seaHeight;

  ctx.fillStyle = 'rgba(8, 117, 170, 0.78)';
  ctx.fillRect(0, seaTop, width, WORLD.seaHeight);
  ctx.strokeStyle = 'rgba(222, 248, 255, 0.72)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= width + 20; x += 20) {
    const y = seaTop + 8 + Math.sin(time * 3 + x * 0.03) * 5;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export function drawPlayer(renderer, player, time = 0) {
  const { context: ctx, assets } = renderer;
  const bob = Math.sin(time * 8) * 2;

  if (player.shieldCharges > 0 || hasPowerup(player, 'magnet')) {
    ctx.save();
    ctx.strokeStyle =
      player.shieldCharges > 0
        ? 'rgba(86, 224, 255, 0.9)'
        : 'rgba(255, 220, 94, 0.72)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(
      player.x + player.width / 2,
      player.y + player.height / 2 + bob,
      player.width * 0.72,
      player.height * 0.72,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  }

  const image = assets.images.player;
  if (image?.loaded) {
    ctx.drawImage(image.image, player.x, player.y + bob, player.width, player.height);
  } else {
    ctx.fillStyle = '#ff5b5b';
    ctx.fillRect(player.x, player.y + bob, player.width, player.height);
  }
}

export function drawEntities(renderer, entities, time = 0) {
  for (const entity of entities) {
    if (entity.type === 'hazard') drawHazard(renderer, entity, time);
    if (entity.type === 'collectible') drawCollectible(renderer, entity, time);
    if (entity.type === 'powerup') drawPowerup(renderer, entity, time);
    if (entity.type === 'floatingText') drawFloatingText(renderer, entity);
  }
}

export function drawParticles(renderer, particles) {
  const { context: ctx } = renderer;
  for (const particle of particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawOverlayBackdrop(renderer) {
  const { context: ctx, width, height } = renderer;
  ctx.fillStyle = 'rgba(0, 10, 16, 0.28)';
  ctx.fillRect(0, 0, width, height);
}

function drawHazard(renderer, hazard, time) {
  const { context: ctx, assets } = renderer;
  const bob = Math.sin(time * 2.6 + hazard.x * 0.01) * hazard.bob;
  const image = assets.images.hazards[hazard.variant % assets.images.hazards.length];

  if (image?.loaded) {
    ctx.drawImage(image.image, hazard.x, hazard.y + bob, hazard.width, hazard.height);
  } else {
    ctx.fillStyle = '#6f4a35';
    ctx.fillRect(hazard.x, hazard.y + bob, hazard.width, hazard.height);
  }
}

function drawCollectible(renderer, collectible, time) {
  const { context: ctx, assets } = renderer;
  const bob = Math.sin(time * 5 + collectible.x * 0.02) * 7;
  const pulse = collectible.special ? 1 + Math.sin(time * 8) * 0.08 : 1;
  const width = collectible.width * pulse;
  const image = collectible.special
    ? assets.images.specialCollectible
    : assets.images.collectible;

  if (collectible.special) {
    ctx.save();
    ctx.shadowColor = 'rgba(255, 216, 86, 0.9)';
    ctx.shadowBlur = 18;
  }

  if (image?.loaded) {
    ctx.drawImage(
      image.image,
      collectible.x - (width - collectible.width) / 2,
      collectible.y + bob - (width - collectible.width) / 2,
      width,
      width,
    );
  } else {
    ctx.fillStyle = collectible.special ? '#ffd454' : '#28d5a3';
    ctx.beginPath();
    ctx.arc(
      collectible.x + collectible.width / 2,
      collectible.y + collectible.height / 2 + bob,
      width / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  if (collectible.special) ctx.restore();
}

function drawPowerup(renderer, powerup, time) {
  const { context: ctx } = renderer;
  const bob = Math.sin(time * 5 + powerup.x * 0.02) * 8;
  const colors = {
    shield: '#56e0ff',
    magnet: '#ffdc5e',
    boost: '#ff7c5c',
  };

  ctx.save();
  ctx.shadowColor = colors[powerup.powerupType] ?? '#ffffff';
  ctx.shadowBlur = 18;
  ctx.fillStyle = colors[powerup.powerupType] ?? '#ffffff';
  ctx.beginPath();
  ctx.roundRect(powerup.x, powerup.y + bob, powerup.width, powerup.height, 10);
  ctx.fill();
  ctx.fillStyle = '#09202f';
  ctx.font = '700 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    powerup.powerupType[0].toUpperCase(),
    powerup.x + powerup.width / 2,
    powerup.y + bob + powerup.height / 2,
  );
  ctx.restore();
}

function drawFloatingText(renderer, item) {
  const { context: ctx } = renderer;
  const alpha = Math.max(0, item.life / item.maxLife);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = item.color;
  ctx.font = '800 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(item.text, item.x, item.y);
  ctx.restore();
}

function drawLayer(renderer, layer, offset, height, scaleY) {
  if (!layer?.loaded) return;

  const { context: ctx, width } = renderer;
  const drawHeight = height * scaleY;
  const drawWidth = width;
  const y = height - drawHeight;
  const wrapped = offset % drawWidth;

  for (let i = -1; i <= 1; i += 1) {
    ctx.drawImage(layer.image, i * drawWidth - wrapped, y, drawWidth, drawHeight);
  }
}

function drawSkyFallback(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#83d5f4');
  gradient.addColorStop(0.55, '#7ed1dd');
  gradient.addColorStop(1, '#0e6992');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
