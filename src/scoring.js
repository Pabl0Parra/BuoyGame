import { SCORING } from './config.js';

export function createScoring(bestScore = 0) {
  return {
    score: 0,
    bestScore,
    comboCount: 0,
    multiplier: 1,
    comboTimer: 0,
    comboTimerMax: 0,
    distanceRemainder: 0,
  };
}

export function addDistanceScore(scoring, distanceDelta, scoreMultiplier = 1) {
  scoring.distanceRemainder += Math.max(0, distanceDelta);
  const points = Math.floor(
    scoring.distanceRemainder / SCORING.distancePixelsPerPoint,
  );

  if (points > 0) {
    scoring.score += Math.floor(points * scoreMultiplier);
    scoring.distanceRemainder -= points * SCORING.distancePixelsPerPoint;
  }
}

export function addCollectibleScore(scoring, collectibleConfig) {
  extendCombo(scoring, collectibleConfig.comboTime);
  scoring.score += collectibleConfig.value * scoring.multiplier;
}

export function addNearMissScore(scoring) {
  extendCombo(scoring, SCORING.nearMissComboTime);
  scoring.score += SCORING.nearMissValue * scoring.multiplier;
}

export function updateCombo(scoring, deltaSeconds) {
  if (scoring.comboTimer <= 0) {
    return;
  }

  scoring.comboTimer = Math.max(0, scoring.comboTimer - deltaSeconds);
  if (scoring.comboTimer === 0) {
    resetCombo(scoring);
  }
}

export function resetCombo(scoring) {
  scoring.comboCount = 0;
  scoring.multiplier = 1;
  scoring.comboTimer = 0;
  scoring.comboTimerMax = 0;
}

export function commitBestScore(scoring) {
  scoring.bestScore = Math.max(scoring.bestScore, scoring.score);
  return scoring.bestScore;
}

function extendCombo(scoring, comboTime) {
  scoring.comboCount += 1;
  scoring.multiplier = Math.min(
    SCORING.maxMultiplier,
    Math.max(1, Math.floor(scoring.comboCount / SCORING.comboStep) + 1),
  );
  scoring.comboTimer = Math.max(comboTime, scoring.comboTimer);
  scoring.comboTimerMax = Math.max(scoring.comboTimerMax, scoring.comboTimer);
}
