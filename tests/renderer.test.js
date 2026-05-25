import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStitchedBackgroundLayout,
  createWaterIntegrationOverlay,
} from '../src/renderer.js';

test('stitched background preserves image aspect and overlaps tiles', () => {
  const layout = createStitchedBackgroundLayout({
    tiles: [
      { loaded: true, image: { width: 1200, height: 600 } },
      { loaded: true, image: { width: 1200, height: 600 } },
    ],
    viewportWidth: 1000,
    viewportHeight: 500,
    cameraX: 0,
  });

  assert.equal(layout.tileWidth, 1000);
  assert.equal(layout.overlap, 96);
  assert.equal(layout.stride, 904);
  assert.equal(layout.draws[1].x - layout.draws[0].x, 904);
});

test('stitched background draws enough overlapped tiles to cover the viewport while scrolling', () => {
  const layout = createStitchedBackgroundLayout({
    tiles: [
      { loaded: true, image: { width: 1400, height: 700 } },
      { loaded: true, image: { width: 1400, height: 700 } },
    ],
    viewportWidth: 1280,
    viewportHeight: 720,
    cameraX: 2400,
  });
  const leftEdge = Math.min(...layout.draws.map((draw) => draw.x));
  const rightEdge = Math.max(...layout.draws.map((draw) => draw.x + draw.width));

  assert.equal(leftEdge <= 0, true);
  assert.equal(rightEdge >= 1280, true);
  assert.equal(layout.draws.every((draw) => draw.tile.loaded), true);
});

test('water integration overlay covers the lower part of the buoy', () => {
  const overlay = createWaterIntegrationOverlay({
    viewportHeight: 700,
    player: { x: 220, y: 584, width: 58, height: 58 },
  });

  assert.equal(overlay.surfaceY > 584, true);
  assert.equal(overlay.surfaceY < 642, true);
  assert.equal(overlay.playerBand.x < 220, true);
  assert.equal(overlay.playerBand.width > 58, true);
});
