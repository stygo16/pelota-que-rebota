# AGENTS.md

Minimal [p5.js](https://p5js.org/) sketch ("Pelota que rebota" — a bouncing ball). Two static files, no build step, no tests, no linter, no `package.json`.

## Running
- Open `index.html` directly in a browser, or serve the folder with any static server.
- Libraries load from CDNs in `index.html` (`p5@2.3.3` + `p5.sound@0.4.1`), so the sketch needs an internet connection to run.

## Structure
- `index.html` — loads p5.js, then p5.sound.js, then `sketch.js`. Also holds the CSS reset in a `<style>` block (`margin:0`/`overflow:hidden` removes the white border and scrollbars; `canvas{display:block}`) and a Google Fonts `<link>` for the serif "Playfair Display".
- `sketch.js` — all logic lives here. The "TE QUIERO" title is drawn centered on the canvas (white serif, `textFont('"Playfair Display"')`), not in HTML. The ball (`circle()`) switches to a heart (`dibujarCorazon`, two circles + a triangle) for ~15 frames after each bounce. Background decorations (scattered hearts/flores via `generarDecoraciones`/`dibujarDecoraciones`) and a mouse particle system (gifts/snowflakes/white circles, 20s lifetime) are also drawn here. Particles are emitted only from `mouseMoved()`/`mouseDragged()` (via `crearParticula`), not every frame. Canvas is dark red (`ROJO_OSCURO`), ball/heart is pink (`ROSA`).

## Gotchas
- `sketch.js` uses p5's global lifecycle hooks: `setup()` runs once, `draw()` runs every frame. These names are p5 entrypoints — don't rename them.
- All p5 APIs (`createCanvas`, `background`, `circle`, etc.) are globals provided by the CDN script. There are no imports or modules; plain browser APIs like the Canvas API are not being used directly.
- The canvas is sized to the full window via `createCanvas(windowWidth, windowHeight)`. There is no resize handler; the canvas only matches the window size at load.
- `p5.sound@0.4.1` is the standalone, Tone.js-based rewrite (the old `p5.sound` addon bundled with p5 1.x is not in p5 2.x). It exposes `p5.Oscillator`, `p5.Envelope`, `userStartAudio()`, etc.
- Browsers block audio until a user gesture (autoplay policy). Sound is gated behind the `audioReady` flag: `rebotar()` returns early until `mousePressed()` creates the `AudioContext` (`new p5.Oscillator()`) and calls `userStartAudio()` inside the gesture. This avoids autoplay warnings/spam before the first click.
- `p5.sound`'s `amp()`/`freq()` use `AudioParam.cancelAndHoldAtTime()`, which Safari (and some other browsers) lack, throwing `cancelAndHoldAtTime is not a function`. A polyfill for it lives at the top of `sketch.js` — keep it.
