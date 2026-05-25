import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSET_MANIFEST } from '../src/assets.js';

test('background is composed from the stitched background tiles', () => {
  assert.deepEqual(ASSET_MANIFEST.images.backgroundTiles, [
    './assets/background_1.png',
    './assets/background_2.png',
    './assets/background_3.png',
  ]);
});
