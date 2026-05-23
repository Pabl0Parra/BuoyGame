import { ASSET_MANIFEST, loadAssets } from './assets.js';
import { createAudioController } from './audio.js';
import {
  createGame,
  primaryAction,
  renderGame,
  resizeGame,
  startGame,
  updateGame,
} from './game.js';
import { createInput } from './input.js';
import { createRenderer } from './renderer.js';
import { loadBestScore, saveBestScore } from './storage.js';

const canvas = document.getElementById('gameCanvas');
const hud = {
  score: document.getElementById('scoreValue'),
  best: document.getElementById('bestValue'),
  combo: document.getElementById('comboValue'),
  comboMeter: document.getElementById('comboMeter'),
  overlay: document.getElementById('overlay'),
  overlayText: document.getElementById('overlayText'),
  primaryAction: document.getElementById('primaryAction'),
};

const assets = await loadAssets();
const renderer = createRenderer(canvas, assets);
const input = createInput(window, document);
const audio = createAudioController(ASSET_MANIFEST);
const game = createGame({
  renderer,
  input,
  audio,
  hud,
  bestScore: loadBestScore(),
  storage: { saveBestScore },
});

let previousTime = performance.now();

hud.primaryAction.addEventListener('click', () => {
  primaryAction(game);
});

window.addEventListener('resize', () => {
  resizeGame(game);
});

window.addEventListener('keydown', (event) => {
  if ((game.state === 'start' || game.state === 'gameOver') && event.code === 'Space') {
    event.preventDefault();
    startGame(game);
  }
});

function frame(now) {
  const deltaSeconds = Math.min(0.033, (now - previousTime) / 1000);
  previousTime = now;
  updateGame(game, deltaSeconds);
  renderGame(game);
  requestAnimationFrame(frame);
}

renderGame(game);
requestAnimationFrame(frame);
