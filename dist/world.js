/** Original software-raycast observation puzzle. Distances are arbitrary game units. */
export const FOV = Math.PI / 3;
export const EYE = 1;
export const STEP = 0.25;
export const TURN = Math.PI / 18;
const TAU = Math.PI * 2;
export const ROOMS = [
  {
    id: "return-address",
    title: "The return address",
    number: "01",
    name: "A house, held together",
    story:
      "Some places only become home when you stop looking for the way out.",
    start: { x: 2.5, y: 6.5, angle: -Math.PI / 2 },
    target: { x: 2.5, y: 4.5, angle: 0 },
    note: { x: 2.5, y: 3.2 },
    clue: "A brass cross waits just south of this letter. Stand on it. The morning comes from the east.",
    hints: [
      "The pieces belong to one small house. Moving changes how their edges meet.",
      "Find the brass cross near the middle-left of the room, then turn toward the east.",
      "Stand at x 2.5, y 4.5 and face east (90° on the compass). The survey overlay can help you navigate.",
    ],
    map: [
      "#########",
      "#.......#",
      "#.....2.#",
      "#.......#",
      "#.......#",
      "#.......#",
      "#.......#",
      "#.......#",
      "#########",
    ],
    strokes: [
      {
        depth: 1.8,
        color: "#e8b58e",
        points: [
          [-0.26, -0.16],
          [-0.26, 0.02],
          [0, 0.23],
        ],
      },
      {
        depth: 3.1,
        color: "#a7d9cc",
        points: [
          [0, 0.23],
          [0.26, 0.02],
          [0.26, -0.16],
        ],
      },
      {
        depth: 4.4,
        color: "#f2d8a5",
        points: [
          [0.26, -0.16],
          [0.07, -0.16],
          [0.07, -0.04],
          [-0.07, -0.04],
          [-0.07, -0.16],
          [-0.26, -0.16],
        ],
      },
    ],
  },
  {
    id: "folded-sea",
    title: "The folded sea",
    number: "02",
    name: "A boat, waiting for water",
    story:
      "A letter cannot cross an ocean. A folded letter can at least imagine it.",
    start: { x: 2.5, y: 2.5, angle: 0 },
    target: { x: 5.5, y: 2.5, angle: Math.PI / 2 },
    note: { x: 5.5, y: 4 },
    clue: "The brass cross is north of this letter. From there, look south. Let the two sails share a mast.",
    hints: [
      "The two sails are at different depths. Standing closer to either one makes it grow.",
      "Walk east from the entrance to the brass cross. Turn south, toward the letter.",
      "Stand at x 5.5, y 2.5 and face south (180°). Align the mast and capture.",
    ],
    map: [
      "#########",
      "#.......#",
      "#.......#",
      "#.......#",
      "#.......#",
      "#.2.....#",
      "#.......#",
      "#.......#",
      "#########",
    ],
    strokes: [
      {
        depth: 1.9,
        color: "#a7d9cc",
        points: [
          [-0.28, -0.08],
          [-0.15, -0.21],
          [0.15, -0.21],
          [0.28, -0.08],
        ],
      },
      {
        depth: 3.2,
        color: "#e8b58e",
        points: [
          [0.02, -0.08],
          [0.02, 0.25],
          [-0.22, -0.08],
          [0.02, -0.08],
        ],
      },
      {
        depth: 4.4,
        color: "#f2d8a5",
        points: [
          [0.05, -0.08],
          [0.23, -0.08],
          [0.05, 0.19],
          [0.05, -0.08],
        ],
      },
    ],
  },
  {
    id: "light-left-on",
    title: "The light left on",
    number: "03",
    name: "A lantern, for the journey",
    story:
      "You do not have to see the whole road. A little light is enough for a beginning.",
    start: { x: 5.5, y: 2.5, angle: Math.PI / 2 },
    target: { x: 5.5, y: 5.5, angle: Math.PI },
    note: { x: 5.5, y: 4.1 },
    clue: "Continue past this letter until you find the cross. Turn west. The handle should sit above the light.",
    hints: [
      "A handle, a frame, and a flame. They are not attached, but they can appear to be.",
      "Continue south past the letter to the brass cross. Turn west, away from the entrance.",
      "Stand at x 5.5, y 5.5 and face west (270°). Align the top of the handle with the frame.",
    ],
    map: [
      "#########",
      "#.......#",
      "#.2.....#",
      "#.......#",
      "#.......#",
      "#.......#",
      "#.......#",
      "#.......#",
      "#########",
    ],
    strokes: [
      {
        depth: 1.8,
        color: "#f2d8a5",
        points: [
          [-0.12, 0.13],
          [-0.12, 0.24],
          [0, 0.3],
          [0.12, 0.24],
          [0.12, 0.13],
        ],
      },
      {
        depth: 3.2,
        color: "#a7d9cc",
        points: [
          [-0.19, 0.13],
          [0.19, 0.13],
          [0.15, -0.23],
          [-0.15, -0.23],
          [-0.19, 0.13],
        ],
      },
      {
        depth: 4.3,
        color: "#e8b58e",
        points: [
          [0, -0.16],
          [-0.07, -0.06],
          [0, 0.06],
          [0.07, -0.06],
          [0, -0.16],
        ],
      },
    ],
  },
];

export function roomById(id) {
  const room = ROOMS.find((entry) => entry.id === id);
  if (!room) throw new Error("Unknown room.");
  return room;
}
export function wrapAngle(angle) {
  return ((((angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
}
export function bearing(from, to) {
  return wrapAngle(Math.atan2(to.y - from.y, to.x - from.x) - from.angle);
}
export function wallAt(room, x, y) {
  return (room.map[Math.floor(y)]?.[Math.floor(x)] ?? "#") !== ".";
}
export function canStand(room, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const radius = 0.18;
  return [
    [-radius, -radius],
    [radius, -radius],
    [-radius, radius],
    [radius, radius],
  ].every(([dx, dy]) => !wallAt(room, x + dx, y + dy));
}

/** DDA traversal on a grid; angle uses east=0, south=PI/2. */
export function castRay(room, origin, angle, maxDistance = 30) {
  const dx = Math.cos(angle),
    dy = Math.sin(angle);
  let x = Math.floor(origin.x),
    y = Math.floor(origin.y);
  const deltaX = Math.abs(dx) < 1e-12 ? Infinity : Math.abs(1 / dx);
  const deltaY = Math.abs(dy) < 1e-12 ? Infinity : Math.abs(1 / dy);
  const stepX = dx < 0 ? -1 : 1,
    stepY = dy < 0 ? -1 : 1;
  let sideX = (dx < 0 ? origin.x - x : x + 1 - origin.x) * deltaX;
  let sideY = (dy < 0 ? origin.y - y : y + 1 - origin.y) * deltaY;
  for (let count = 0; count < 256; count++) {
    let distance, side;
    if (sideX < sideY) {
      distance = sideX;
      sideX += deltaX;
      x += stepX;
      side = 0;
    } else {
      distance = sideY;
      sideY += deltaY;
      y += stepY;
      side = 1;
    }
    if (distance > maxDistance)
      return { distance: maxDistance, hit: false, x, y, side };
    if ((room.map[y]?.[x] ?? "#") !== ".")
      return { distance, hit: true, x, y, side, tile: room.map[y]?.[x] ?? "#" };
  }
  return { distance: maxDistance, hit: false, x, y, side: 0 };
}

export function visible(room, pose, point) {
  const distance = Math.hypot(point.x - pose.x, point.y - pose.y);
  if (distance < 0.001) return true;
  return (
    castRay(
      room,
      pose,
      Math.atan2(point.y - pose.y, point.x - pose.x),
      distance,
    ).distance >=
    distance - 0.035
  );
}

export function project(point, pose, width = 800, height = 500) {
  const dx = point.x - pose.x,
    dy = point.y - pose.y;
  const forward = dx * Math.cos(pose.angle) + dy * Math.sin(pose.angle);
  const lateral = -dx * Math.sin(pose.angle) + dy * Math.cos(pose.angle);
  const scale = width / (2 * Math.tan(FOV / 2));
  return {
    x: width / 2 + (lateral * scale) / forward,
    y: height / 2 - (((point.z ?? EYE) - EYE) * scale) / forward,
    depth: forward,
  };
}

export function fragments(room) {
  const c = Math.cos(room.target.angle),
    s = Math.sin(room.target.angle);
  return room.strokes.map((stroke) => ({
    ...stroke,
    world: stroke.points.map(([u, v]) => ({
      x: room.target.x + c * stroke.depth - s * u * stroke.depth,
      y: room.target.y + s * stroke.depth + c * u * stroke.depth,
      z: EYE + v * stroke.depth,
    })),
  }));
}

export function alignment(room, pose) {
  let error = 0,
    count = 0,
    allVisible = true;
  for (const stroke of fragments(room))
    stroke.world.forEach((point, index) => {
      const projected = project(point, pose, 800, 500),
        [u, v] = stroke.points[index];
      if (projected.depth <= 0.1 || !visible(room, pose, point))
        allVisible = false;
      const scale = 800 / (2 * Math.tan(FOV / 2));
      error += Math.min(
        10000,
        Math.hypot(
          projected.x - (400 + u * scale),
          projected.y - (250 - v * scale),
        ),
      );
      count++;
    });
  const pixels = error / count;
  return {
    error: pixels,
    score: Math.max(0, Math.min(100, Math.round(100 - pixels * 1.7))),
    ready: allVisible && pixels < 17,
    visible: allVisible,
  };
}

export function createGame(roomId = ROOMS[0].id) {
  const room = roomById(roomId);
  return {
    version: 1,
    roomId,
    pose: { ...room.start },
    readNotes: [],
    postcards: [],
    history: [],
    hintLevel: 0,
  };
}
function remember(state) {
  return [
    ...state.history,
    {
      roomId: state.roomId,
      pose: { ...state.pose },
      readNotes: [...state.readNotes],
      postcards: [...state.postcards],
      hintLevel: state.hintLevel,
    },
  ].slice(-300);
}

export function navigate(state, action, amount = 1) {
  if (
    ![
      "forward",
      "back",
      "strafe-left",
      "strafe-right",
      "turn-left",
      "turn-right",
    ].includes(action)
  )
    throw new Error("Unknown navigation action.");
  if (!Number.isFinite(amount) || amount <= 0 || amount > 5)
    throw new Error("Invalid movement amount.");
  const room = roomById(state.roomId),
    pose = { ...state.pose };
  if (action.startsWith("turn"))
    pose.angle = wrapAngle(
      pose.angle + (action === "turn-left" ? -TURN : TURN) * amount,
    );
  else {
    const offset =
      action === "back"
        ? Math.PI
        : action === "strafe-left"
          ? -Math.PI / 2
          : action === "strafe-right"
            ? Math.PI / 2
            : 0;
    const distance = STEP * amount,
      substeps = Math.ceil(distance / 0.07),
      step = distance / substeps;
    for (let n = 0; n < substeps; n++) {
      const x = pose.x + Math.cos(pose.angle + offset) * step,
        y = pose.y + Math.sin(pose.angle + offset) * step;
      if (canStand(room, x, pose.y)) pose.x = x;
      if (canStand(room, pose.x, y)) pose.y = y;
    }
  }
  if (
    Math.hypot(pose.x - state.pose.x, pose.y - state.pose.y) < 1e-8 &&
    Math.abs(wrapAngle(pose.angle - state.pose.angle)) < 1e-8
  )
    return {
      state,
      changed: false,
      message: "A wall stops you. Try a different direction.",
    };
  return {
    state: { ...state, pose, history: remember(state) },
    changed: true,
    message: "",
  };
}

export function canRead(state) {
  const room = roomById(state.roomId);
  return (
    Math.hypot(state.pose.x - room.note.x, state.pose.y - room.note.y) < 2.25 &&
    Math.abs(bearing(state.pose, room.note)) < 0.55 &&
    visible(room, state.pose, room.note)
  );
}
export function readNote(state) {
  if (!canRead(state))
    return {
      state,
      changed: false,
      message: "Face the floating letter and move within a few steps of it.",
    };
  const room = roomById(state.roomId);
  if (state.readNotes.includes(room.id))
    return { state, changed: false, message: room.clue };
  return {
    state: {
      ...state,
      readNotes: [...state.readNotes, room.id],
      history: remember(state),
    },
    changed: true,
    message: room.clue,
  };
}
export function capture(state) {
  const room = roomById(state.roomId);
  if (!state.readNotes.includes(room.id))
    return {
      state,
      changed: false,
      message:
        "Read the letter first. It tells you where this picture belongs.",
    };
  if (state.postcards.includes(room.id))
    return {
      state,
      changed: false,
      message: "This postcard is already in your collection.",
    };
  const result = alignment(room, state.pose);
  if (!result.ready)
    return {
      state,
      changed: false,
      message: result.visible
        ? `The fragments are not aligned yet (${result.score}%). Move to the cross, then adjust your angle.`
        : "Some fragments are behind you or hidden by a wall. Find the brass cross and turn toward them.",
    };
  return {
    state: {
      ...state,
      postcards: [...state.postcards, room.id],
      history: remember(state),
    },
    changed: true,
    message: `Postcard collected: ${room.name}.`,
  };
}
export function undo(state) {
  if (!state.history.length) return state;
  const previous = state.history.at(-1);
  return { version: 1, ...previous, history: state.history.slice(0, -1) };
}
export function changeRoom(state, id) {
  const index = ROOMS.findIndex((room) => room.id === id);
  if (
    index < 0 ||
    (index > 0 && !state.postcards.includes(ROOMS[index - 1].id))
  )
    throw new Error("Complete the previous room first.");
  return {
    ...state,
    roomId: id,
    pose: { ...ROOMS[index].start },
    hintLevel: 0,
    history: remember(state),
  };
}
export function resetRoom(state) {
  return {
    ...state,
    pose: { ...roomById(state.roomId).start },
    hintLevel: 0,
    history: remember(state),
  };
}
export function nextHint(state) {
  return { ...state, hintLevel: Math.min(3, state.hintLevel + 1) };
}

/** Restore bounded non-sensitive browser progress, not a competitive score or proof. */
export function restore(value) {
  if (!value || value.version !== 1 || typeof value !== "object")
    throw new Error("Invalid save.");
  const room = roomById(value.roomId);
  const validIds = (array) =>
    Array.isArray(array) &&
    array.length <= 3 &&
    new Set(array).size === array.length &&
    array.every((id) => ROOMS.some((r) => r.id === id));
  if (
    !validIds(value.readNotes) ||
    !validIds(value.postcards) ||
    !value.pose ||
    !Number.isFinite(value.pose.angle) ||
    !canStand(room, value.pose.x, value.pose.y)
  )
    throw new Error("Invalid saved pose or collection.");
  if (
    !Number.isInteger(value.hintLevel) ||
    value.hintLevel < 0 ||
    value.hintLevel > 3
  )
    throw new Error("Invalid hint level.");
  const roomIndex = ROOMS.findIndex((r) => r.id === room.id);
  for (let i = 0; i < roomIndex; i++)
    if (!value.postcards.includes(ROOMS[i].id)) throw new Error("Locked room.");
  for (let i = 0; i < ROOMS.length; i++)
    if (
      value.postcards.includes(ROOMS[i].id) &&
      (!value.readNotes.includes(ROOMS[i].id) ||
        (i > 0 && !value.postcards.includes(ROOMS[i - 1].id)))
    )
      throw new Error("Invalid collection order.");
  return {
    version: 1,
    roomId: room.id,
    pose: {
      x: value.pose.x,
      y: value.pose.y,
      angle: wrapAngle(value.pose.angle),
    },
    readNotes: [...value.readNotes],
    postcards: [...value.postcards],
    hintLevel: value.hintLevel,
    history: [],
  };
}
