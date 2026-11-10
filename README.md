# Parallax Postcards

A quiet, original first-person observation puzzle. Walk through three small rooms, read a letter, find the brass viewing cross, and align fragments at different physical depths into a house, a paper boat and a lantern. Capture all three pictures to complete the journey; each postcard can be downloaded as an original, self-contained SVG.

The world uses an independently written **Canvas2D software raycaster**. It does not need WebGL, pointer lock, a model API, audio permission, an account, or any external runtime asset. This is a playable prototype, not a renderer-only showcase.

## Run and verify

Node.js 20+ runs tests and the build; Python 3 serves the built files. No npm runtime packages or framework installation are needed.

```sh
npm run verify
npm run dev
```

Open `http://127.0.0.1:5174`. The development command serves only `dist/` on loopback. Build first: `npm run build` copies the six required files to `dist/`. Upload the **contents** of that directory with `index.html` at the web root for static hosting. `npm run package` also creates `releases/parallax-postcards-html.zip` with `index.html` at its root for an itch.io HTML game upload. ES modules require HTTP; opening `file://` directly may be blocked by browser module security.

The page runs offline after loading. No service worker promises an offline reload; run the local HTTP server when playing without an internet connection.

## Play

- W/S or up/down arrows: walk forward/backward. A/D: strafe. Left/right arrows: turn. Shift + turn makes a smaller adjustment.
- Drag the view horizontally to look, without requesting pointer lock.
- Screen controls work with touch and mouse; holding a movement button repeats the action. Keyboard Enter/Space activates a focused button normally.
- Face the floating envelope within a few steps and press **E** or **Read the letter**.
- Find the brass cross on the floor and turn as the letter suggests. Actual perspective projection drives the alignment meter. A successful capture requires every fragment to be in front of you, unoccluded, and within the alignment tolerance.
- Press **Space** or **Capture postcard**. Collecting one postcard opens the next room. Three postcards complete the journey.

Undo reverses navigation, reading, captures and room transitions for the last 300 actions. Reset position returns to the current entrance while keeping collected postcards. Three levels of hints and an optional survey map provide navigation help. There is no time limit, jump scare, failure timer or model-generated gameplay.

Holding controls stops when the pointer is released/cancelled, the window loses focus, the page is hidden, a room is changed, or another utility action is used. Rendering happens on interaction; there is no continuous idle animation loop or head bob.

## Saves and privacy

Progress is stored only in the current browser. Restore validates the version, finite walkable pose, unique known room IDs, collection order and hint bounds; saved undo history is discarded. Corrupt saves are cleared and normal saving can resume. Storage API failures fall back to memory and show a notice. Refreshing then loses progress; downloaded postcards remain yours.

This is personal progress, not a trusted competitive score. The save validation is not an anti-cheat system or proof of a legitimate playthrough. There is no cloud sync, telemetry, multiplayer service, collection account, or in-game AI call.

## Tests and implementation

`npm test` covers a complete legal three-room playthrough; projection from the authored viewing points; parallax rejection; read/capture requirements; ray hits and wall occlusion; cardinal rays starting exactly on grid lines; collision and anti-tunneling; undo, room locks and reset; history limits; save validation; finite Canvas2D drawing commands; and self-contained postcard SVGs. A boundary regression prevents an axis-parallel ray from multiplying a zero grid offset by infinity, which previously produced a non-finite distance and an incorrect wall when facing west. `npm run check` checks syntax, DOM references and the local-only runtime boundary. `npm run build` copies an explicit static allowlist.

- `world.js`: authored rooms, geometric fragments, movement/collision, DDA rays, observation/capture and browser-state restoration.
- `renderer.js`: Canvas2D wall strips, depth-clipped geometric line segments, original letter and brass cross, optional survey map and postcard SVG output.
- `app.js`: keyboard/touch/drag controls, collection UI, local saves and downloads.
- `docs/landscape.md`: two genuinely similar open-source raycasters, verified MIT licenses, commits, design comparisons and independent implementation boundaries.

A real desktop browser playthrough on **November 10, 2026** read the letters, rejected a wrong-angle capture, collected the house, undid it from 1/3 to 0/3, recaptured it and completed the boat and lantern for 3/3. The ending was observed, an actual lantern SVG was downloaded, and reload restored 3/3 with Undo disabled. The [actual gameplay gallery](docs/gallery/README.md) contains eight unchanged screenshots, the downloaded SVG and per-file hashes, tied to runtime source `3ede110d29eb248d307cfaf45e9783762032924c`.

The [1:56 local demonstration](docs/media/parallax-postcards-local-demo.mp4) edits those real screenshots into ten scenes with silent English captions. The [media record](docs/evidence/local-demo-20261110.json) lists hashes, timing and checks. Full MP4 decoding and all ten encoded midpoint frames passed verification.

These selected desktop screenshots are separate from automated geometry tests; they do not establish mobile/narrow-viewport coverage, console-clean status or a complete cross-browser evaluation. This prototype has flat floors, constant-height grid walls and 2.5D line geometry; it is not a general 3D engine and has no imported meshes, vertical movement or physics simulation.

## Jam and AI disclosure

Prepared for [Through Your Eyes: First-Person Game Jam](https://itch.io/jam/through-your-eyes-first-person-game-jam), checked 2026-11-05. The official rules allow solo/team entries, any engine, and playable first-person prototypes. See [competition notes](docs/competition.md) for the deadline ambiguity and actual submission steps.

**Not joined, uploaded or submitted to itch.io.** The November 10 authorized verification attempt returned to a new challenge after the checkbox and spinner; owner completion of the retained login page is pending. A GitHub push, actual browser playthrough or private preview does not submit a jam entry. The owner must review the live rules, create the game page, upload the playable build, provide accurate credits/disclosures and submit it to the jam before the account's displayed countdown expires.

Codex assisted with design, independently authored code, level geometry, testing and documentation. There are no runtime AI calls. No third-party code or assets are bundled; related projects were reviewed as design references only. All text, geometric art, room layouts and interface code were created for this project. No commercial game art, fonts, sounds or IP were copied. See [development disclosure](docs/ai-development.md).

MIT license.
