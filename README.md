# Buoy Game

A browser-based arcade runner built with HTML canvas and vanilla JavaScript.

## Run

Open `index.html` in a browser.

For the most reliable local module loading, serve the folder with a static server:

```bash
python -m http.server 4173
```

Then visit `http://localhost:4173`.

## Controls

- `ArrowLeft` / `A`: move left
- `ArrowRight` / `D`: move right
- `Space` / `ArrowUp` / `W`: jump
- `P`: pause or resume
- `M`: mute or unmute

On touch screens, use the on-screen left, jump, and right controls.

## Tests

```bash
npm test
```

If PowerShell blocks `npm.ps1`, use:

```bash
npm.cmd test
```
