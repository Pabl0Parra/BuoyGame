# Buoy Game Arcade Upgrade Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Buoy Game as a polished, framework-free arcade runner with modular code, improved game feel, combos, powerups, fair spawning, responsive controls, and manual verification.

**Architecture:** Keep the game static and browser-native. Replace the single HTML file with `index.html`, `styles.css`, and focused ES modules under `src/`; keep deterministic gameplay logic testable with Node's built-in test runner.

**Tech Stack:** HTML canvas, CSS, vanilla JavaScript ES modules, browser audio APIs, `localStorage`, Node `node:test` for pure logic tests.

---

## Source Design

Spec: `docs/superpowers/specs/2026-05-23-buoy-game-arcade-upgrade-design.md`

## File Map

- Create `index.html`: new app entry point, canvas, HUD, menus, mobile controls.
- Create `styles.css`: layout, HUD, menus, responsive touch controls.
- Create `package.json`: minimal `npm test` command using Node's test runner.
- Create `src/config.js`: constants for physics, scoring, powerups, spawning, rendering.
- Create `src/assets.js`: image/audio manifest and async image loading.
- Create `src/input.js`: keyboard and touch input state.
- Create `src/storage.js`: high score and settings persistence.
- Create `src/audio.js`: music, effects, mute state, autoplay-safe start.
- Create `src/scoring.js`: score, combo, multiplier, near-miss bookkeeping.
- Create `src/player.js`: player state, movement, jump, damage, powerup effects.
- Create `src/entities.js`: hazard, collectible, particle, and floating-text factories.
- Create `src/spawner.js`: fair pattern generation and difficulty scaling.
- Create `src/renderer.js`: canvas rendering, parallax, HUD drawing support, overlays.
- Create `src/game.js`: game state machine, timing, update loop, reset, pause, restart.
- Create `src/main.js`: bootstrap assets, input, audio, game, and DOM events.
- Create `tests/scoring.test.js`: unit tests for scoring and combo behavior.
- Create `tests/player.test.js`: unit tests for movement, jump, damage, powerups.
- Create `tests/spawner.test.js`: unit tests for fair spawn guarantees.
- Keep `BuoyGame.html`: original reference during migration; do not delete in this pass.

---

## Chunk 1: Static Shell and Test Harness

### Task 1: Add Minimal Project Harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `styles.css`

- [ ] **Step 1: Create package metadata and test script**

Add:

```json
{
  "name": "buoy-game",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Create the new HTML shell**

Add `index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Buoy Game</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main class="game-shell" aria-label="Buoy Game">
      <canvas id="gameCanvas" aria-label="Buoy Game canvas"></canvas>

      <section class="hud" aria-label="Game stats">
        <div><span>Score</span><strong id="scoreValue">0</strong></div>
        <div><span>Best</span><strong id="bestValue">0</strong></div>
        <div><span>Combo</span><strong id="comboValue">x1</strong></div>
        <div class="combo-meter" aria-hidden="true"><span id="comboMeter"></span></div>
      </section>

      <section id="overlay" class="overlay is-visible">
        <h1>Buoy Game</h1>
        <p id="overlayText">Dodge hazards, collect energy, keep the combo alive.</p>
        <button id="primaryAction" type="button">Start</button>
      </section>

      <div class="touch-controls" aria-label="Touch controls">
        <button data-touch="left" type="button" aria-label="Move left">Left</button>
        <button data-touch="jump" type="button" aria-label="Jump">Jump</button>
        <button data-touch="right" type="button" aria-label="Move right">Right</button>
      </div>
    </main>
    <script type="module" src="./src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 3: Create base CSS**

Add responsive full-screen canvas layout, fixed HUD, centered overlay, and bottom touch controls. Keep text readable on mobile.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: Node reports no tests found or zero passing tests without syntax errors. If `npm` is unavailable, run `node --test`.

- [ ] **Step 5: Commit**

```bash
git add package.json index.html styles.css
git commit -m "chore: add static game shell"
```

---

## Chunk 2: Pure Game Logic

### Task 2: Add Config and Scoring With Tests

**Files:**
- Create: `src/config.js`
- Create: `src/scoring.js`
- Create: `tests/scoring.test.js`

- [ ] **Step 1: Write failing scoring tests**

Test these behaviors:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createScoring, addCollectibleScore, addNearMissScore, updateCombo } from '../src/scoring.js';

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
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test`

Expected: FAIL because `src/scoring.js` does not exist.

- [ ] **Step 3: Implement config and scoring**

Add central scoring values in `src/config.js`. Implement:

- `createScoring()`
- `addDistanceScore(scoring, distanceDelta)`
- `addCollectibleScore(scoring, collectibleConfig)`
- `addNearMissScore(scoring)`
- `updateCombo(scoring, deltaSeconds)`
- `resetCombo(scoring)`

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS for scoring tests.

- [ ] **Step 5: Commit**

```bash
git add src/config.js src/scoring.js tests/scoring.test.js
git commit -m "feat: add scoring and combo logic"
```

### Task 3: Add Player Logic With Tests

**Files:**
- Create: `src/player.js`
- Create: `tests/player.test.js`
- Modify: `src/config.js`

- [ ] **Step 1: Write failing player tests**

Cover:

- player starts with two jumps
- jump consumes one jump and sets upward velocity
- landing resets jumps
- shield absorbs one hit
- magnet and boost timers expire

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test`

Expected: FAIL because `src/player.js` does not exist.

- [ ] **Step 3: Implement player module**

Implement:

- `createPlayer(viewport)`
- `updatePlayer(player, input, deltaSeconds, world, activePowerups)`
- `jumpPlayer(player)`
- `damagePlayer(player)`
- `applyPowerup(player, type, durationSeconds)`
- `resizePlayer(player, viewport)`

Keep DOM and canvas out of this module.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS for scoring and player tests.

- [ ] **Step 5: Commit**

```bash
git add src/config.js src/player.js tests/player.test.js
git commit -m "feat: add player movement and powerup logic"
```

### Task 4: Add Entities and Fair Spawner With Tests

**Files:**
- Create: `src/entities.js`
- Create: `src/spawner.js`
- Create: `tests/spawner.test.js`
- Modify: `src/config.js`

- [ ] **Step 1: Write failing spawner tests**

Cover:

- generated pattern includes hazards and collectibles
- pattern leaves at least one safe lane
- difficulty increases speed or density as distance increases
- powerups are generated less often than normal collectibles

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test`

Expected: FAIL because `src/spawner.js` does not exist.

- [ ] **Step 3: Implement entity factories**

Implement factories:

- `createHazard(options)`
- `createCollectible(options)`
- `createPowerup(options)`
- `createParticle(options)`
- `createFloatingText(options)`

- [ ] **Step 4: Implement spawner**

Implement:

- `createSpawner(seedOrRandom)`
- `getDifficulty(distance)`
- `spawnPattern(spawner, context)`
- `spawnCollectibleLine(context)`
- `spawnHazardPattern(context)`

Use injected randomness so tests can be deterministic.

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: PASS for scoring, player, and spawner tests.

- [ ] **Step 6: Commit**

```bash
git add src/config.js src/entities.js src/spawner.js tests/spawner.test.js
git commit -m "feat: add fair spawning logic"
```

---

## Chunk 3: Browser Runtime Integration

### Task 5: Add Assets, Input, Storage, and Audio Modules

**Files:**
- Create: `src/assets.js`
- Create: `src/input.js`
- Create: `src/storage.js`
- Create: `src/audio.js`

- [ ] **Step 1: Implement asset manifest**

Map existing assets:

- `assets/windPark_retro.webp`
- `assets/windPark_bg.webp`
- `assets/windPark2.webp`
- `assets/buoyRendering.ico`
- `assets/collectible_6.png`
- `assets/collectible_7.png`
- `assets/obstacle_1.png` through `assets/obstacle_4.png`
- existing audio files

- [ ] **Step 2: Implement input module**

Track:

- `left`
- `right`
- `jumpPressed`
- `pausePressed`
- `mutePressed`

Support keyboard and touch buttons from `data-touch`.

- [ ] **Step 3: Implement storage module**

Implement:

- `loadBestScore()`
- `saveBestScore(score)`
- `loadMuted()`
- `saveMuted(muted)`

Handle unavailable `localStorage` with safe fallbacks.

- [ ] **Step 4: Implement audio module**

Implement:

- `createAudioController(assetManifest, storage)`
- `startMusic()`
- `playEffect(name)`
- `setMuted(value)`
- `toggleMuted()`

Do not autoplay music until the first user action.

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: PASS existing logic tests.

- [ ] **Step 6: Commit**

```bash
git add src/assets.js src/input.js src/storage.js src/audio.js
git commit -m "feat: add browser support modules"
```

### Task 6: Add Renderer

**Files:**
- Create: `src/renderer.js`
- Modify: `styles.css`

- [ ] **Step 1: Implement renderer shell**

Implement:

- `createRenderer(canvas, assets)`
- `resizeRenderer(renderer)`
- `clear(renderer)`
- `drawBackground(renderer, camera, time)`
- `drawSea(renderer, time)`
- `drawPlayer(renderer, player)`
- `drawEntities(renderer, entities)`
- `drawParticles(renderer, particles)`
- `drawOverlayBackdrop(renderer)`

- [ ] **Step 2: Add parallax and fallback rendering**

Use layered backgrounds when images are loaded. Use flat sky/sea colors when assets fail.

- [ ] **Step 3: Add readable visual effects**

Render:

- bobbing collectibles
- glow for powerups and special collectibles
- shield ring
- pickup particles
- floating score text

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS existing logic tests.

- [ ] **Step 5: Commit**

```bash
git add src/renderer.js styles.css
git commit -m "feat: add canvas renderer"
```

### Task 7: Add Game Orchestration and Main Bootstrap

**Files:**
- Create: `src/game.js`
- Create: `src/main.js`
- Modify: `index.html`
- Modify: `styles.css`

- [ ] **Step 1: Implement game state machine**

States:

- `start`
- `playing`
- `paused`
- `gameOver`
- `ready`

Implement:

- `createGame(dependencies)`
- `startGame(game)`
- `pauseGame(game)`
- `resumeGame(game)`
- `restartGame(game)`
- `updateGame(game, deltaSeconds)`
- `renderGame(game)`

- [ ] **Step 2: Wire scoring, player, spawner, renderer, audio**

During `playing`:

- scroll world continuously
- update player
- spawn patterns
- update hazards, collectibles, powerups, particles, floating text
- detect collisions
- apply score/combo/powerups
- update best score on game over

- [ ] **Step 3: Implement DOM HUD and overlay updates**

Update:

- `#scoreValue`
- `#bestValue`
- `#comboValue`
- `#comboMeter`
- `#overlay`
- `#overlayText`
- `#primaryAction`

- [ ] **Step 4: Wire bootstrap**

In `src/main.js`:

- get DOM elements
- load assets
- create input/audio/renderer/game
- attach resize handler
- attach primary action handler
- start animation loop with `requestAnimationFrame`

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: PASS existing logic tests.

- [ ] **Step 6: Manual browser check**

Open `index.html` in a browser.

Expected:

- title screen appears
- Start begins gameplay
- player moves and jumps
- hazards/collectibles spawn
- score changes
- game over and restart work

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css src/game.js src/main.js
git commit -m "feat: wire arcade game loop"
```

---

## Chunk 4: Polish, Responsiveness, and Verification

### Task 8: Add Arcade Polish

**Files:**
- Modify: `src/game.js`
- Modify: `src/renderer.js`
- Modify: `src/audio.js`
- Modify: `src/config.js`
- Modify: `styles.css`

- [ ] **Step 1: Add near-miss detection**

Track hazards that passed close to the player without collision. Award near-miss score only once per hazard.

- [ ] **Step 2: Add combo feedback**

Create floating text and particle bursts for:

- collectible pickup
- special pickup
- powerup pickup
- near miss
- combo increase

- [ ] **Step 3: Add powerup feedback**

Display active powerups in HUD or as small icons/text chips. Render shield around player and magnet pull effect.

- [ ] **Step 4: Tune audio**

Ensure effect volume is balanced and repeated effects reset cleanly.

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: PASS all tests.

- [ ] **Step 6: Commit**

```bash
git add src/game.js src/renderer.js src/audio.js src/config.js styles.css
git commit -m "feat: add arcade feedback polish"
```

### Task 9: Add Responsive Touch and Resize Behavior

**Files:**
- Modify: `src/game.js`
- Modify: `src/input.js`
- Modify: `src/player.js`
- Modify: `src/renderer.js`
- Modify: `styles.css`

- [ ] **Step 1: Improve resize handling**

On viewport resize:

- resize canvas
- recompute player bounds
- keep player inside valid play area
- keep HUD readable

- [ ] **Step 2: Finalize touch controls**

Ensure touch controls:

- do not trigger browser scrolling
- support holding left/right
- support tap jump
- are hidden or unobtrusive on pointer devices where keyboard is likely

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: PASS all tests.

- [ ] **Step 4: Manual responsive check**

Check:

- desktop-sized window
- narrow mobile-sized window
- resize while on start screen
- resize during gameplay
- resize after game over

- [ ] **Step 5: Commit**

```bash
git add src/game.js src/input.js src/player.js src/renderer.js styles.css
git commit -m "feat: add responsive touch controls"
```

### Task 10: Final Manual Verification and Docs

**Files:**
- Create or modify: `README.md`

- [ ] **Step 1: Update README**

Document:

- how to run by opening `index.html`
- optional local server command
- keyboard controls
- mobile controls
- `npm test`

- [ ] **Step 2: Run tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 3: Manual gameplay verification**

Verify:

- load has no visible error
- start works
- pause/resume works with `P`
- mute works with `M`
- movement and double jump work
- hazards can end the run
- shield absorbs one hit
- magnet pulls collectibles
- boost changes score/speed feel
- score and best score update
- restart works
- mobile layout is usable

- [ ] **Step 4: Check Git status**

Run: `git status --short`

Expected: only intended files are modified.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document upgraded buoy game"
```

---

## Later Playwright Pass

Playwright is intentionally deferred. After this upgrade is playable, add smoke tests for:

- `index.html` loads with no console errors
- canvas is nonblank
- Start transitions to gameplay
- keyboard jump changes player state
- pause and restart work
- desktop and mobile screenshots render without HUD overlap

