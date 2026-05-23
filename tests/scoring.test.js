import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addCollectibleScore,
  addDistanceScore,
  addNearMissScore,
  createScoring,
  resetCombo,
  updateCombo,
} from '../src/scoring.js';

test('collectibles increase score and combo', () => {
  const scoring = createScoring();

  addCollectibleScore(scoring, { value: 10, comboTime: 2 });

  assert.equal(scoring.score, 10);
  assert.equal(scoring.comboCount, 1);
  assert.equal(scoring.multiplier, 1);

  addCollectibleScore(scoring, { value: 10, comboTime: 2 });

  assert.equal(scoring.score, 30);
  assert.equal(scoring.comboCount, 2);
  assert.equal(scoring.multiplier, 2);
});

test('combo expires after timer reaches zero', () => {
  const scoring = createScoring();

  addNearMissScore(scoring);
  updateCombo(scoring, 10);

  assert.equal(scoring.comboCount, 0);
  assert.equal(scoring.multiplier, 1);
  assert.equal(scoring.comboTimer, 0);
});

test('distance scoring stores fractional progress', () => {
  const scoring = createScoring();

  addDistanceScore(scoring, 4.5);
  addDistanceScore(scoring, 4.5);
  addDistanceScore(scoring, 4.5);

  assert.equal(scoring.score, 1);
  assert.equal(scoring.distanceRemainder, 3.5);
});

test('resetCombo clears combo state without clearing score', () => {
  const scoring = createScoring();

  addCollectibleScore(scoring, { value: 20, comboTime: 2 });
  addCollectibleScore(scoring, { value: 20, comboTime: 2 });
  resetCombo(scoring);

  assert.equal(scoring.score, 60);
  assert.equal(scoring.comboCount, 0);
  assert.equal(scoring.multiplier, 1);
  assert.equal(scoring.comboTimer, 0);
});
