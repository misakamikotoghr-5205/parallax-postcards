import {
  ROOMS,
  alignment,
  canRead,
  capture,
  changeRoom,
  createGame,
  navigate,
  nextHint,
  readNote,
  resetRoom,
  restore,
  roomById,
  undo,
} from "./world.js";
import { postcardSVG, renderScene } from "./renderer.js";
const $ = (id) => document.getElementById(id);
const SAVE_KEY = "parallax-postcards-v1";
const KEYS = {
  w: "forward",
  s: "back",
  a: "strafe-left",
  d: "strafe-right",
  ArrowUp: "forward",
  ArrowDown: "back",
  ArrowLeft: "turn-left",
  ArrowRight: "turn-right",
};
let state = createGame();
let storageAvailable = true;
let holdTimer = null;
let drag = null;
let survey = false;

function say(message) {
  if (message) $("status").textContent = message;
}
function stopHold() {
  if (holdTimer !== null) clearInterval(holdTimer);
  holdTimer = null;
  drag = null;
}
function load() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    storageAvailable = false;
    return;
  }
  if (!raw) return;
  try {
    if (raw.length > 100000) throw new Error("Save too large.");
    state = restore(JSON.parse(raw));
    say("Welcome back. Your position and postcards have been restored.");
  } catch {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      storageAvailable = false;
    }
    say("The old save could not be read. A new journey is ready.");
  }
}
function save() {
  if (storageAvailable) {
    try {
      const { history, ...data } = state;
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      storageAvailable = false;
    }
  }
  $("save-status").textContent = storageAvailable
    ? "Saved on this browser. No account or network service."
    : "Browser storage unavailable. You can keep playing and download collected postcards; progress will not survive a refresh.";
}
function compass(angle) {
  const degrees = ((((angle * 180) / Math.PI + 90) % 360) + 360) % 360;
  const names = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return `${names[Math.round(degrees / 45) % 8]} · ${Math.round(degrees)}°`;
}
function renderCollection() {
  const container = document.createDocumentFragment();
  ROOMS.forEach((room, index) => {
    const unlocked =
        index === 0 || state.postcards.includes(ROOMS[index - 1].id),
      collected = state.postcards.includes(room.id);
    const entry = document.createElement("div");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "postcard";
    button.classList.toggle("active", room.id === state.roomId);
    button.classList.toggle("collected", collected);
    button.disabled = !unlocked;
    const number = document.createElement("span");
    number.textContent = collected ? "✓" : room.number;
    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = room.title;
    const subtitle = document.createElement("small");
    subtitle.textContent = collected
      ? "COLLECTED · REVISIT"
      : unlocked
        ? "OPEN ROOM"
        : "COMPLETE PREVIOUS ROOM";
    details.append(title, subtitle);
    button.append(number, details);
    button.addEventListener("click", () => {
      stopHold();
      state = changeRoom(state, room.id);
      render();
      say("Room entered. The picture is waiting for your point of view.");
      $("view").focus({ preventScroll: true });
    });
    entry.append(button);
    if (collected) {
      const download = document.createElement("button");
      download.type = "button";
      download.className = "download-card";
      download.textContent = "Download original postcard ↗";
      download.addEventListener("click", () => downloadCard(room.id));
      entry.append(download);
    }
    container.append(entry);
  });
  $("postcards").replaceChildren(container);
}
function render({ collection = true } = {}) {
  const room = roomById(state.roomId),
    score = alignment(room, state.pose),
    read = state.readNotes.includes(room.id),
    collected = state.postcards.includes(room.id);
  $("room-number").textContent = `OBSERVATION ROOM / ${room.number}`;
  $("room-title").textContent = room.title;
  $("compass").textContent = compass(state.pose.angle);
  $("location").textContent =
    `ROOM ${room.number} · ${survey ? `x ${state.pose.x.toFixed(2)} / y ${state.pose.y.toFixed(2)}` : "TAKE YOUR TIME"}`;
  $("alignment-fill").style.width = `${score.score}%`;
  $("alignment-value").textContent = `${score.score}%`;
  $("alignment-meter").setAttribute("aria-valuenow", score.score);
  $("alignment-meter").setAttribute(
    "aria-valuetext",
    score.ready ? "Aligned. Ready to capture." : `${score.score}% aligned`,
  );
  $("capture").disabled = collected;
  $("capture").textContent = collected
    ? "Postcard collected ✓"
    : score.ready && read
      ? "Capture aligned picture ✓"
      : "Capture postcard";
  $("read").textContent = canRead(state)
    ? read
      ? "Read letter again · E"
      : "Read the letter · E"
    : "Find & face the letter · E";
  $("task-read").classList.toggle("done", read);
  $("task-align").classList.toggle("done", score.ready || collected);
  $("task-capture").classList.toggle("done", collected);
  $("letter").hidden = !read;
  $("letter-text").textContent = room.clue;
  $("hint-count").textContent = `${state.hintLevel} / 3`;
  $("hint-text").textContent = state.hintLevel
    ? room.hints[state.hintLevel - 1]
    : "";
  $("hint").disabled = state.hintLevel >= 3;
  $("undo").disabled = !state.history.length;
  $("progress").textContent = `${state.postcards.length} / 3`;
  const index = ROOMS.findIndex((r) => r.id === room.id);
  $("next-room").hidden = !collected || index === ROOMS.length - 1;
  $("ending").hidden = state.postcards.length < 3;
  $("canvas-error").hidden = renderScene($("view"), state, { survey });
  if (collection) renderCollection();
  save();
}
function perform(action, amount = 1) {
  const result = navigate(state, action, amount);
  if (result.changed) {
    state = result.state;
    render({ collection: false });
  }
  if (result.message) say(result.message);
}
function observe() {
  stopHold();
  const result = readNote(state);
  state = result.state;
  render();
  say(result.message);
}
function takePhoto() {
  stopHold();
  const result = capture(state);
  state = result.state;
  render();
  say(
    result.changed
      ? `${result.message} ${roomById(state.roomId).story}`
      : result.message,
  );
  if (result.changed) {
    if (state.postcards.length === 3)
      $("ending").focus({ preventScroll: true });
    else $("next-room").focus({ preventScroll: true });
  }
}
for (const button of document.querySelectorAll("[data-nav]")) {
  button.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    stopHold();
    button.setPointerCapture(event.pointerId);
    perform(button.dataset.nav);
    holdTimer = setInterval(() => perform(button.dataset.nav), 160);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(type, stopHold);
  button.addEventListener("click", (event) => {
    if (event.detail === 0) perform(button.dataset.nav);
  });
}
window.addEventListener("blur", () => {
  stopHold();
  drag = null;
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopHold();
    drag = null;
  }
});
document.addEventListener("keydown", (event) => {
  if ($("help").open || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.target.closest("input,textarea,select,a,dialog")) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const action = KEYS[key];
  if (action) {
    event.preventDefault();
    stopHold();
    perform(action, event.shiftKey && action.startsWith("turn") ? 0.2 : 1);
  } else if (key === "e") {
    event.preventDefault();
    observe();
  } else if (key === " " && !event.target.closest("button")) {
    event.preventDefault();
    if (!event.repeat) takePhoto();
  }
});
$("view").addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  stopHold();
  drag = { id: event.pointerId, x: event.clientX };
  $("view").setPointerCapture(event.pointerId);
  $("view").focus({ preventScroll: true });
});
$("view").addEventListener("pointermove", (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  const delta = event.clientX - drag.x;
  drag.x = event.clientX;
  if (Math.abs(delta) > 0.05)
    perform(
      delta < 0 ? "turn-left" : "turn-right",
      Math.min(5, Math.abs(delta) * 0.024),
    );
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  $("view").addEventListener(type, () => {
    drag = null;
  });
$("read").addEventListener("click", observe);
$("capture").addEventListener("click", takePhoto);
$("undo").addEventListener("click", () => {
  stopHold();
  state = undo(state);
  render();
  say("Your previous step has been restored.");
});
$("reset").addEventListener("click", () => {
  stopHold();
  state = resetRoom(state);
  render();
  say("Back at the entrance. Your letters and collected postcards are kept.");
});
$("hint").addEventListener("click", () => {
  stopHold();
  state = nextHint(state);
  render();
  say(roomById(state.roomId).hints[state.hintLevel - 1]);
});
$("survey").addEventListener("change", () => {
  stopHold();
  survey = $("survey").checked;
  render({ collection: false });
});
$("next-room").addEventListener("click", () => {
  stopHold();
  const index = ROOMS.findIndex((room) => room.id === state.roomId);
  if (index + 1 < ROOMS.length) {
    state = changeRoom(state, ROOMS[index + 1].id);
    render();
    say("A new letter, a new point of view.");
    $("view").focus({ preventScroll: true });
  }
});
$("start-over").addEventListener("click", () => {
  stopHold();
  state = createGame();
  render();
  say("A new journey begins. Your downloaded postcards are yours to keep.");
  $("view").focus({ preventScroll: true });
});
$("help-open").addEventListener("click", () => {
  stopHold();
  $("help").showModal();
});
$("help-close").addEventListener("click", () => $("help").close());
function downloadCard(roomId) {
  const url = URL.createObjectURL(
    new Blob([postcardSVG(roomId)], { type: "image/svg+xml" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `parallax-${roomId}.svg`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
load();
render();
