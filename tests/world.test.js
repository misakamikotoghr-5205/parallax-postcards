import test from "node:test";
import assert from "node:assert/strict";
import {
  EYE,
  FOV,
  ROOMS,
  alignment,
  canRead,
  canStand,
  capture,
  castRay,
  changeRoom,
  createGame,
  fragments,
  navigate,
  nextHint,
  project,
  readNote,
  resetRoom,
  restore,
  undo,
  visible,
  wallAt,
  wrapAngle,
} from "../world.js";
import { postcardSVG, renderScene } from "../renderer.js";
function walk(state, action, count = 1) {
  for (let i = 0; i < count; i++) {
    const result = navigate(state, action);
    assert(result.changed, `blocked ${action}`);
    state = result.state;
  }
  return state;
}

test("complete all three puzzles using only legal navigation, reading and capture", () => {
  let state = createGame();
  state = walk(state, "forward", 5);
  assert(canRead(state));
  state = readNote(state).state;
  state = walk(state, "forward", 3);
  state = walk(state, "turn-right", 9);
  assert(alignment(ROOMS[0], state.pose).ready);
  state = capture(state).state;
  assert.deepEqual(state.postcards, [ROOMS[0].id]);
  state = changeRoom(state, ROOMS[1].id);
  state = walk(state, "forward", 12);
  state = walk(state, "turn-right", 9);
  assert(canRead(state));
  state = readNote(state).state;
  state = capture(state).state;
  assert.equal(state.postcards.length, 2);
  state = changeRoom(state, ROOMS[2].id);
  assert(canRead(state));
  state = readNote(state).state;
  state = walk(state, "forward", 12);
  state = walk(state, "turn-right", 9);
  state = capture(state).state;
  assert.equal(state.postcards.length, 3);
});
test("each target projects actual world geometry into its authored picture", () => {
  for (const room of ROOMS) {
    assert(canStand(room, room.target.x, room.target.y));
    assert.equal(alignment(room, room.target).score, 100);
    assert.equal(alignment(room, room.target).ready, true);
    for (const stroke of fragments(room))
      stroke.world.forEach((point, index) => {
        assert(visible(room, room.target, point));
        const result = project(point, room.target);
        const [u, v] = stroke.points[index],
          scale = 800 / (2 * Math.tan(FOV / 2));
        assert(Math.abs(result.x - (400 + u * scale)) < 1e-8);
        assert(Math.abs(result.y - (250 - v * scale)) < 1e-8);
      });
  }
});
test("parallax and wrong facing reject capture at the wrong perspective", () => {
  for (const room of ROOMS) {
    assert.equal(
      alignment(room, { ...room.target, x: room.target.x + 0.7 }).ready,
      false,
    );
    assert.equal(
      alignment(room, { ...room.target, angle: room.target.angle + Math.PI })
        .ready,
      false,
    );
    const state = { ...createGame(room.id), readNotes: [room.id] };
    assert.equal(capture(state).changed, false);
  }
});
test("capture requires reading the letter, then records only one postcard", () => {
  let state = { ...createGame(), pose: { ...ROOMS[0].target } };
  assert.equal(capture(state).changed, false);
  state = { ...state, readNotes: [ROOMS[0].id] };
  const result = capture(state);
  assert(result.changed);
  assert.equal(capture(result.state).changed, false);
  assert.equal(result.state.postcards.length, 1);
});
test("a letter must be close, faced and not occluded", () => {
  const initial = createGame();
  assert.equal(canRead(initial), false);
  const near = walk(initial, "forward", 5);
  assert(canRead(near));
  const away = {
    ...near,
    pose: { ...near.pose, angle: near.pose.angle + Math.PI },
  };
  assert.equal(canRead(away), false);
  assert.equal(readNote(away).changed, false);
  const read = readNote(near);
  assert(read.changed);
  assert.equal(readNote(read.state).changed, false);
});
test("DDA hits the correct grid wall and occludes points behind an interior pillar", () => {
  const room = ROOMS[0],
    pose = { x: 2.5, y: 2.5, angle: 0 };
  const hit = castRay(room, pose, 0);
  assert(hit.hit);
  assert.equal(hit.x, 6);
  assert.equal(hit.y, 2);
  assert.equal(hit.distance, 3.5);
  assert.equal(visible(room, pose, { x: 7.5, y: 2.5 }), false);
  assert.equal(visible(room, pose, { x: 4.5, y: 2.5 }), true);
  for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2])
    assert(Number.isFinite(castRay(room, pose, angle).distance));
});
test("boundary and interior collisions cannot be tunneled through by larger movements", () => {
  const room = ROOMS[0];
  assert(wallAt(room, -1, -1));
  assert.equal(canStand(room, NaN, 2), false);
  assert.equal(canStand(room, 6.5, 2.5), false);
  let state = { ...createGame(), pose: { x: 5.5, y: 2.5, angle: 0 } };
  for (let i = 0; i < 5; i++) state = navigate(state, "forward", 5).state;
  assert(state.pose.x < 5.83);
  assert(canStand(room, state.pose.x, state.pose.y));
  state = { ...state, pose: { x: 1.2, y: 1.2, angle: Math.PI } };
  for (let i = 0; i < 5; i++) state = navigate(state, "forward", 5).state;
  assert(state.pose.x >= 1.18 - 1e-8);
});
test("navigation does not mutate inputs, and invalid actions/amounts are rejected", () => {
  const state = createGame(),
    snapshot = structuredClone(state);
  const next = navigate(state, "forward");
  assert(next.changed);
  assert.deepEqual(state, snapshot);
  assert.throws(() => navigate(state, "teleport"));
  for (const amount of [0, -1, Infinity, NaN, 6])
    assert.throws(() => navigate(state, "forward", amount));
});
test("turning wraps angles and fine adjustment is smaller than a normal turn", () => {
  const state = createGame();
  const fine = navigate(state, "turn-right", 0.2).state,
    normal = navigate(state, "turn-right").state;
  assert(
    Math.abs(fine.pose.angle - state.pose.angle) <
      Math.abs(normal.pose.angle - state.pose.angle),
  );
  for (const angle of [-1000, -Math.PI, 0, Math.PI, 1000]) {
    assert(wrapAngle(angle) >= -Math.PI);
    assert(wrapAngle(angle) < Math.PI);
  }
});
test("rooms unlock in order; arbitrary level skipping is rejected", () => {
  const initial = createGame();
  assert.throws(() => changeRoom(initial, ROOMS[1].id));
  assert.throws(() => changeRoom(initial, "unknown"));
  const completed = {
    ...initial,
    postcards: [ROOMS[0].id],
    readNotes: [ROOMS[0].id],
  };
  assert.equal(changeRoom(completed, ROOMS[1].id).roomId, ROOMS[1].id);
  assert.throws(() => changeRoom(completed, ROOMS[2].id));
});
test("undo reverses capture and room entry, reset preserves collected progress", () => {
  const before = {
    ...createGame(),
    pose: { ...ROOMS[0].target },
    readNotes: [ROOMS[0].id],
  };
  const after = capture(before).state;
  assert.deepEqual(undo(after), before);
  const second = changeRoom(after, ROOMS[1].id);
  assert.deepEqual(undo(second), after);
  const reset = resetRoom(second);
  assert.deepEqual(reset.pose, ROOMS[1].start);
  assert.deepEqual(reset.postcards, after.postcards);
  assert.equal(undo(createGame()).history.length, 0);
});
test("hints saturate at three, and undo history is bounded to 300 snapshots", () => {
  let state = createGame();
  for (let i = 0; i < 10; i++) state = nextHint(state);
  assert.equal(state.hintLevel, 3);
  for (let i = 0; i < 320; i++) state = navigate(state, "turn-left").state;
  assert.equal(state.history.length, 300);
});
test("valid browser save restores finite pose/progress and discards untrusted undo history", () => {
  let state = createGame();
  state = walk(state, "forward", 5);
  state = readNote(state).state;
  const saved = JSON.parse(JSON.stringify(state));
  saved.history = [{ malicious: "not restored" }];
  const restored = restore(saved);
  assert.deepEqual(restored.pose, state.pose);
  assert.deepEqual(restored.readNotes, state.readNotes);
  assert.deepEqual(restored.history, []);
});
test("restore rejects wall poses, nonfinite values, duplicate IDs and locked room state", () => {
  const state = createGame();
  for (const value of [
    null,
    {},
    { ...state, version: 2 },
    { ...state, pose: { x: 0, y: 0, angle: 0 } },
    { ...state, pose: { ...state.pose, angle: Infinity } },
    { ...state, postcards: ["unknown"] },
    { ...state, readNotes: [ROOMS[0].id, ROOMS[0].id] },
    { ...state, roomId: ROOMS[2].id, pose: ROOMS[2].start },
    { ...state, postcards: [ROOMS[0].id] },
    { ...state, hintLevel: 8 },
  ])
    assert.throws(() => restore(value));
});
test("Canvas2D renderer issues only finite geometry commands for every room and target", () => {
  const methods = [
    "fillRect",
    "strokeRect",
    "moveTo",
    "lineTo",
    "arc",
    "translate",
    "rotate",
  ];
  let commands = 0;
  const ctx = {
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    beginPath() {},
    stroke() {},
    fill() {},
    save() {},
    restore() {},
    fillText() {},
  };
  for (const method of methods)
    ctx[method] = (...args) => {
      commands++;
      assert(args.every(Number.isFinite), `${method}: ${args}`);
    };
  const canvas = {
    width: 800,
    height: 500,
    getContext(type) {
      assert.equal(type, "2d");
      return ctx;
    },
  };
  for (const room of ROOMS)
    for (const pose of [room.start, room.target])
      assert(
        renderScene(canvas, { ...createGame(room.id), pose }, { survey: true }),
      );
  assert(commands > 5000);
  assert.equal(
    renderScene({ ...canvas, getContext: () => null }, createGame()),
    false,
  );
});
test("downloadable postcards are original self-contained SVG without external assets", () => {
  for (const room of ROOMS) {
    const svg = postcardSVG(room.id);
    assert(svg.startsWith("<svg"));
    assert(svg.includes(room.name));
    assert(svg.includes("<polyline"));
    assert(!/<image|<script|href=|foreignObject/.test(svg));
  }
});
