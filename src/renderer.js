import { POWERUPS, WORLD } from './config.js';
import { hasPowerup } from './player.js';

const BACKGROUND_SCROLL_FACTOR = 0.18;
const BACKGROUND_OVERLAP = 96;

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
  if (drawStitchedBackground(renderer, assets.images.backgroundTiles, camera.x)) {
    return;
  }

  drawSkyFallback(ctx, width, height);
}

export function drawSea(renderer, time) {
  if (renderer.assets.images.backgroundTiles?.some((tile) => tile.loaded)) {
    return;
  }

  const { context: ctx, width, height } = renderer;
  const seaTop = height - WORLD.seaHeight;

  ctx.fillStyle = '#187cc8';
  ctx.fillRect(0, seaTop, width, WORLD.seaHeight);

  ctx.fillStyle = '#23a6d5';
  ctx.fillRect(0, seaTop, width, 14);

  ctx.strokeStyle = '#f8f3c0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, seaTop + 2);
  ctx.lineTo(width, seaTop + 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= width + 20; x += 20) {
    const y = seaTop + 18 + Math.sin(time * 3.4 + x * 0.035) * 4;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  drawSeaTiles(ctx, width, height, seaTop);
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

  if (hasPowerup(player, 'boost')) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 124, 92, 0.42)';
    ctx.beginPath();
    ctx.ellipse(
      player.x - 8,
      player.y + player.height / 2 + bob,
      player.width * 0.45,
      player.height * 0.32,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
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

export function drawWaterIntegrationOverlay(renderer, player, time = 0) {
  const { context: ctx, width, height } = renderer;
  const overlay = createWaterIntegrationOverlay({
    viewportHeight: height,
    player,
  });

  ctx.save();
  const bottomGradient = ctx.createLinearGradient(0, overlay.surfaceY, 0, height);
  bottomGradient.addColorStop(0, 'rgba(105, 184, 214, 0)');
  bottomGradient.addColorStop(0.24, 'rgba(61, 147, 190, 0.18)');
  bottomGradient.addColorStop(1, 'rgba(10, 74, 124, 0.28)');
  ctx.fillStyle = bottomGradient;
  ctx.fillRect(0, overlay.surfaceY, width, height - overlay.surfaceY);

  const { playerBand } = overlay;
  const playerGradient = ctx.createLinearGradient(
    0,
    playerBand.y,
    0,
    playerBand.y + playerBand.height,
  );
  playerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  playerGradient.addColorStop(0.32, 'rgba(230, 250, 255, 0.18)');
  playerGradient.addColorStop(1, 'rgba(20, 112, 165, 0.5)');
  ctx.fillStyle = playerGradient;
  ctx.beginPath();
  ctx.ellipse(
    playerBand.x + playerBand.width / 2,
    playerBand.y + playerBand.height * 0.56,
    playerBand.width / 2,
    playerBand.height / 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.strokeStyle = 'rgba(235, 252, 255, 0.46)';
  ctx.lineWidth = 2;
  for (let index = 0; index < 2; index += 1) {
    const y = overlay.surfaceY + index * 10 + Math.sin(time * 3 + index) * 2;
    ctx.beginPath();
    for (let x = playerBand.x; x <= playerBand.x + playerBand.width; x += 10) {
      const waveY = y + Math.sin(time * 4 + x * 0.05 + index) * 2.5;
      if (x === playerBand.x) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function createWaterIntegrationOverlay({ viewportHeight, player }) {
  const surfaceY = player.y + player.height * 0.62;
  const bandPadding = player.width * 0.42;
  return {
    surfaceY,
    playerBand: {
      x: player.x - bandPadding,
      y: surfaceY - player.height * 0.18,
      width: player.width + bandPadding * 2,
      height: Math.min(viewportHeight - surfaceY, player.height * 0.62),
    },
  };
}

export function drawEntities(renderer, entities, time = 0) {
  for (const entity of entities) {
    if (entity.type === 'hazard') drawHazard(renderer, entity, time);
    if (entity.type === 'collectible') drawCollectible(renderer, entity, time);
    if (entity.type === 'powerup') drawPowerup(renderer, entity, time);
    if (entity.type === 'laser') drawLaser(renderer, entity);
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
  const { context: ctx, assets } = renderer;
  const bob = Math.sin(time * 5 + powerup.x * 0.02) * 8;
  const colors = {
    shield: '#56e0ff',
    magnet: '#ffdc5e',
    boost: '#ff7c5c',
    gun: '#ff4fd8',
  };
  const gunImage = powerup.powerupType === 'gun' ? assets.images.gun : null;

  ctx.save();
  ctx.shadowColor = colors[powerup.powerupType] ?? '#ffffff';
  ctx.shadowBlur = 18;
  if (gunImage?.loaded) {
    ctx.drawImage(gunImage.image, powerup.x, powerup.y + bob, powerup.width, powerup.height);
  } else {
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
  }
  ctx.restore();
}

function drawLaser(renderer, laser) {
  const { context: ctx } = renderer;
  const alpha = Math.max(0, laser.life / laser.maxLife);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = '#ff4fd8';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
  ctx.fillStyle = '#ff4fd8';
  ctx.fillRect(laser.x + 4, laser.y + 2, laser.width - 8, laser.height - 4);
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

function drawStitchedBackground(renderer, tiles, cameraX) {
  const { context: ctx, width, height } = renderer;
  const layout = createStitchedBackgroundLayout({
    tiles,
    viewportWidth: width,
    viewportHeight: height,
    cameraX,
  });
  if (!layout) return false;

  for (const draw of layout.draws) {
    drawBackgroundTile(ctx, draw, layout.overlap);
  }

  return true;
}

export function createStitchedBackgroundLayout({
  tiles,
  viewportWidth,
  viewportHeight,
  cameraX,
  scrollFactor = BACKGROUND_SCROLL_FACTOR,
  overlap = BACKGROUND_OVERLAP,
}) {
  const loadedTiles = tiles?.filter((tile) => tile.loaded && tile.image);
  if (!loadedTiles?.length) return null;

  const firstImage = loadedTiles[0].image;
  const tileWidth = Math.max(
    viewportWidth,
    Math.round(viewportHeight * (firstImage.width / firstImage.height)),
  );
  const safeOverlap = Math.min(overlap, Math.floor(tileWidth * 0.18));
  const stride = tileWidth - safeOverlap;
  const stripWidth = stride * loadedTiles.length;
  const offset = wrap(cameraX * scrollFactor, stripWidth);
  const startSlot = Math.floor(offset / stride);
  const localOffset = offset % stride;
  const drawCount = Math.ceil(viewportWidth / stride) + 3;
  const draws = [];

  for (let i = -1; i < drawCount; i += 1) {
    const slot = startSlot + i;
    draws.push({
      tile: loadedTiles[wrapIndex(slot, loadedTiles.length)],
      x: i * stride - localOffset,
      y: 0,
      width: tileWidth,
      height: viewportHeight,
      hasLeftBlend: i > -1,
    });
  }

  return {
    draws,
    tileWidth,
    stride,
    overlap: safeOverlap,
  };
}

function drawBackgroundTile(ctx, draw, overlap) {
  const { image } = draw.tile;
  if (!draw.hasLeftBlend || overlap <= 0) {
    ctx.drawImage(image, draw.x, draw.y, draw.width, draw.height);
    return;
  }

  const sourceOverlap = Math.round((overlap / draw.width) * image.width);
  ctx.drawImage(
    image,
    sourceOverlap,
    0,
    image.width - sourceOverlap,
    image.height,
    draw.x + overlap,
    draw.y,
    draw.width - overlap,
    draw.height,
  );

  const slices = 16;
  for (let index = 0; index < slices; index += 1) {
    const sourceX = Math.round((index / slices) * sourceOverlap);
    const nextSourceX = Math.round(((index + 1) / slices) * sourceOverlap);
    const sourceWidth = Math.max(1, nextSourceX - sourceX);
    const destX = draw.x + (index / slices) * overlap;
    const destWidth = Math.ceil(overlap / slices) + 1;

    ctx.save();
    ctx.globalAlpha = (index + 1) / slices;
    ctx.drawImage(
      image,
      sourceX,
      0,
      sourceWidth,
      image.height,
      destX,
      draw.y,
      destWidth,
      draw.height,
    );
    ctx.restore();
  }
}

function drawSkyFallback(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#74c9ff');
  gradient.addColorStop(0.58, '#9ee4ff');
  gradient.addColorStop(1, '#7fd17a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawSeaTiles(ctx, width, height, seaTop) {
  ctx.fillStyle = 'rgba(12, 82, 151, 0.28)';
  const tile = 34;
  for (let y = seaTop + 34; y < height; y += tile) {
    for (let x = (Math.floor(y / tile) % 2) * -tile; x < width; x += tile * 2) {
      ctx.fillRect(x, y, tile, 3);
    }
  }
}

function wrap(value, size) {
  return ((value % size) + size) % size;
}

function wrapIndex(value, size) {
  return ((value % size) + size) % size;
}
