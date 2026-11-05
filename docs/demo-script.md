# Browser QA and short demo

Build with `npm run verify`, serve `dist/` with `npm run dev`, open the local URL. Browser automation is intentionally left to the coordinating agent.

1. Confirm the Canvas view is first person and responds to W/S, A/D, left/right arrows and drag-to-look. Screen movement buttons should repeat while held and stop on release, backgrounding or blur. No pointer-lock prompt should appear.
2. Room 1: from the fresh start, move forward five times. Read the letter. Move forward three more times, turn right nine normal increments (east), and capture. The exact sequence is also covered by the geometry integration test.
3. Enter Room 2: move forward twelve times, turn right nine times (south), read the nearby letter and capture.
4. Enter Room 3: read the letter at the entrance, move forward twelve times, turn right nine times (west), and capture. Confirm the ending, three collected postcards, room revisit controls and self-contained SVG downloads.
5. Reset position must keep collected cards. Undo reverses captures and room changes. Reload should restore progress but starts a new undo history. Corrupt JSON should start a fresh game and permit future saving; blocked localStorage should leave the game playable with a notice.
6. At a wrong pose or before reading, capture should explain what remains. Hints should increase to three levels; the last contains precise coordinates/direction. Survey map should be optional, with coordinates only while enabled.
7. Check a narrow viewport and keyboard-only flow. Enter/Space on utility controls must activate their native action, without being consumed as a game capture. No network call or external asset is required by gameplay.
