# Buoy Game Arcade Upgrade Design

## Goal

Upgrade Buoy Game from a basic single-file canvas prototype into a polished static arcade runner. The upgraded game should keep the simple buoy-jumping premise, but improve game feel, scoring, difficulty, UI, audio, responsiveness, and code structure.

The target experience is a fast, replayable high-score game: survive longer, collect aggressively, preserve combos, and avoid ocean hazards.

## Current State

The current project contains one main HTML file, `BuoyGame.html`, plus assets. The game already has:

- A canvas-based side-scrolling scene
- A buoy player with left/right movement and double jump
- Obstacles and collectibles
- Score display
- Background music and sound effects
- Game-over and restart behavior

The main limitation is that all logic, rendering, audio, input, spawning, and state management live in one script. The gameplay is functional but lacks strong arcade pacing, fair pattern generation, polished UI states, responsive mobile controls, and maintainable boundaries.

## Recommended Approach

Use a focused arcade upgrade.

Split the project into a small static structure with separate HTML, CSS, and JavaScript modules. Upgrade the existing game loop rather than introducing a framework or bundler. This keeps the game easy to run while giving the code enough structure for richer gameplay and later Playwright smoke tests.

Rejected alternatives:

- A larger adventure/progression game would add missions, zones, and unlocks before the core arcade loop is proven.
- A minimal polish pass would improve the surface but leave the code cramped and harder to extend.

## Game Loop and Feel

The upgraded game is a side-scrolling arcade runner. The player controls a buoy that dodges hazards and collects items while the world speed increases over time.

The player keeps simple controls:

- Move left
- Move right
- Jump
- Double jump

Movement should feel more intentional than the current prototype. Horizontal acceleration, friction, tuned gravity, and jump buffering or coyote-time should replace hard positional movement where practical. The buoy should feel responsive but still buoyant.

The camera should create forward pressure. Once a run starts, the world scrolls continuously. The player can move within a horizontal band, but the game advances without requiring the player to hold right. Difficulty ramps by increasing speed, spawn density, hazard variety, and collectible placement complexity.

Game states:

- `start`: title screen, controls, and best score
- `playing`: active game loop
- `paused`: frozen game with resume and restart options
- `gameOver`: final score, best score, and restart
- `ready`: optional short countdown after restart or resume

## Scoring and Combos

Scoring is the main arcade hook.

Score sources:

- Distance survived, awarded continuously
- Normal collectibles with a small fixed value
- Special collectibles with a larger value
- Near-miss bonuses when the buoy narrowly avoids hazards
- Combo multiplier for chaining collectibles and near misses

The combo system should be easy to understand:

- Collecting items or earning near misses extends the combo timer.
- Consecutive successful actions increase the multiplier.
- Taking damage or letting the timer expire resets the combo.
- Special collectibles add more combo time than normal collectibles.

The HUD should show:

- Score
- Best score
- Combo multiplier
- Combo timer bar
- Active powerups

Small floating text such as `+10`, `Near Miss`, and `Combo x3` can appear near the player or pickup location, but the screen should stay readable.

## Powerups and Hazards

Powerups should be few, readable, and impactful.

Initial powerups:

- Shield: absorbs one hazard hit
- Magnet: pulls nearby collectibles toward the buoy for a short time
- Boost: temporarily increases speed and score gain while raising risk

Hazards should reuse the existing obstacle art but behave with more variety:

- Larger hazards move slower and block more space
- Smaller hazards move faster
- Some hazards bob vertically or drift across lanes
- Patterns are generated in lanes with at least one reasonable escape path

The spawner should avoid unfair unavoidable layouts. It should know about player jump height, screen size, scroll speed, and hazard spacing.

## Project Structure

The upgraded project should be static and framework-free:

```text
index.html
styles.css
src/
  main.js
  game.js
  config.js
  assets.js
  input.js
  player.js
  entities.js
  spawner.js
  scoring.js
  renderer.js
  audio.js
  storage.js
assets/
```

Responsibilities:

- `main.js`: bootstrap the canvas, load assets, and start the game
- `game.js`: own state transitions, update loop, pause, restart, and timing
- `config.js`: centralize physics, scoring, spawn, difficulty, and UI tuning
- `assets.js`: load images and audio, expose readiness and fallback handling
- `input.js`: track keyboard and touch controls
- `player.js`: update movement, jumping, damage, and powerup effects
- `entities.js`: define hazards, collectibles, particles, and floating score text
- `spawner.js`: generate fair hazards, collectibles, and powerup patterns
- `scoring.js`: manage score, best score, combo timer, multiplier, and near misses
- `renderer.js`: draw background, world entities, player, particles, HUD, and overlays
- `audio.js`: manage music, sound effects, mute state, and browser autoplay constraints
- `storage.js`: persist best score and settings with `localStorage`

The old `BuoyGame.html` may be kept temporarily as a reference during implementation, but the upgraded game entry point should be `index.html`.

## Visual and Audio Design

The game should retain its ocean/wind-park identity while feeling more active.

Visual upgrades:

- Layered parallax using existing background assets
- Animated water band with subtle wave motion
- Bobbing or spinning collectibles
- Glow treatment for special collectibles and powerups
- Pickup particles
- Shield impact effect
- Clear title, pause, and game-over overlays

The UI should be compact and game-like. It should avoid plain unstyled browser text and should remain readable over the moving background.

Audio upgrades:

- Music should start after user interaction when autoplay is blocked.
- Sound effects should be volume-balanced.
- Mute should be available with `M` and a visible control.
- Repeated sounds should reset cleanly without stacking harshly.

## Controls and Responsiveness

Keyboard controls:

- `ArrowLeft`: move left
- `ArrowRight`: move right
- `Space` or `ArrowUp`: jump
- `P`: pause or resume
- `M`: mute or unmute

Restart controls:

- `Space` on game-over
- Visible restart button on game-over

Mobile controls:

- On-screen left, right, and jump controls
- Touch targets should be large enough for mobile play
- HUD and controls should not overlap core gameplay

Responsiveness:

- Canvas resizes cleanly with the viewport
- Entity sizes scale within sensible min/max bounds
- Gameplay tuning accounts for viewport size
- UI must fit on mobile and desktop without overlapping

## Verification

Initial verification can be manual. Playwright will be added later.

Manual checks:

- The game opens from `index.html`
- No console errors during load or gameplay
- Start, pause, play, game-over, and restart states work
- Keyboard controls work
- Touch controls work on a mobile-sized viewport
- Score, best score, combo, and powerups update correctly
- Audio starts after interaction and mute works
- Canvas and HUD remain readable at desktop and mobile sizes

Later Playwright smoke tests should cover:

- Page load without console errors
- Nonblank canvas
- Keyboard input changes game state
- Pause and restart controls
- Score/HUD visibility
- Desktop and mobile screenshots

## Implementation Notes

Implementation should proceed incrementally:

1. Create the new static file structure while preserving the old game as a reference.
2. Move existing behavior into modules without changing gameplay.
3. Add state screens and input improvements.
4. Upgrade scoring and combo logic.
5. Add fair spawning, difficulty ramp, and powerups.
6. Add visual polish, particles, HUD, and responsive touch controls.
7. Run manual verification before adding Playwright later.

The first implementation pass should prioritize a playable, coherent arcade loop over a large feature list.
