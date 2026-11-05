import {
  EYE,
  FOV,
  ROOMS,
  alignment,
  castRay,
  fragments,
  project,
  roomById,
} from "./world.js";

function line(ctx, a, b, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

/** Canvas2D only. No WebGL, textures, image loading or external assets. */
export function renderScene(canvas, state, { survey = false } = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return false;
  const width = canvas.width,
    height = canvas.height,
    room = roomById(state.roomId),
    pose = state.pose;
  const scale = width / (2 * Math.tan(FOV / 2));
  const sky = ctx.createLinearGradient(0, 0, 0, height / 2);
  sky.addColorStop(0, "#141d24");
  sky.addColorStop(1, "#32423f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height / 2);
  const floor = ctx.createLinearGradient(0, height / 2, 0, height);
  floor.addColorStop(0, "#37413c");
  floor.addColorStop(1, "#182527");
  ctx.fillStyle = floor;
  ctx.fillRect(0, height / 2, width, height / 2);
  const depths = new Float64Array(width);
  for (let x = 0; x < width; x += 2) {
    const rayAngle = pose.angle + Math.atan((x - width / 2) / scale);
    const hit = castRay(room, pose, rayAngle);
    const distance = Math.max(
      0.05,
      hit.distance * Math.cos(rayAngle - pose.angle),
    );
    depths[x] = distance;
    depths[Math.min(x + 1, width - 1)] = distance;
    const top = height / 2 - ((2.6 - EYE) * scale) / distance,
      bottom = height / 2 + (EYE * scale) / distance;
    const shade =
      Math.max(0.22, 1 / (1 + distance * 0.13)) * (hit.side ? 0.88 : 1);
    const base = hit.tile === "2" ? [110, 90, 72] : [97, 117, 107];
    ctx.fillStyle = `rgb(${base.map((c) => Math.round(c * shade)).join(",")})`;
    ctx.fillRect(x, top, 2, bottom - top);
    ctx.fillStyle = `rgba(231,208,166,${0.23 * shade})`;
    ctx.fillRect(
      x,
      bottom - (4 * scale) / distance,
      2,
      (1.5 * scale) / distance,
    );
    const fraction =
      hit.side === 0
        ? (pose.y + Math.sin(rayAngle) * hit.distance) % 1
        : (pose.x + Math.cos(rayAngle) * hit.distance) % 1;
    if (fraction < 0.012 || fraction > 0.988) {
      ctx.fillStyle = "#11252b33";
      ctx.fillRect(x, top, 2, bottom - top);
    }
  }
  // Floor seams are geometric, clipped at the near plane.
  const floorLines = [];
  for (let n = 1; n < 8; n++) {
    floorLines.push([
      { x: n, y: 1, z: 0.004 },
      { x: n, y: 8, z: 0.004 },
    ]);
    floorLines.push([
      { x: 1, y: n, z: 0.004 },
      { x: 8, y: n, z: 0.004 },
    ]);
  }
  for (const [a, b] of floorLines)
    drawWorldSegment(ctx, a, b, pose, depths, width, height, "#8a9d8b1d", 1);
  // A horizontal brass cross marks the authored viewing point.
  const target = room.target;
  for (const [ax, ay, bx, by] of [
    [-0.24, 0, 0.24, 0],
    [0, -0.24, 0, 0.24],
  ])
    drawWorldSegment(
      ctx,
      { x: target.x + ax, y: target.y + ay, z: 0.015 },
      { x: target.x + bx, y: target.y + by, z: 0.015 },
      pose,
      depths,
      width,
      height,
      "#d8b77a",
      4,
    );
  const ordered = fragments(room).sort((a, b) => b.depth - a.depth);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const stroke of ordered) {
    for (let n = 1; n < stroke.world.length; n++) {
      drawWorldSegment(
        ctx,
        stroke.world[n - 1],
        stroke.world[n],
        pose,
        depths,
        width,
        height,
        `${stroke.color}33`,
        10,
      );
      drawWorldSegment(
        ctx,
        stroke.world[n - 1],
        stroke.world[n],
        pose,
        depths,
        width,
        height,
        stroke.color,
        3,
      );
    }
  }
  // The letter is an original outlined billboard, not a loaded sprite.
  const note = project({ ...room.note, z: 1.04 }, pose, width, height);
  const ix = Math.floor(note.x);
  if (
    note.depth > 0.12 &&
    ix >= 0 &&
    ix < width &&
    note.depth < depths[ix] + 0.03
  ) {
    const size = Math.min(140, (scale * 0.34) / note.depth);
    ctx.save();
    ctx.translate(note.x, note.y);
    ctx.rotate(-0.08);
    ctx.fillStyle = state.readNotes.includes(room.id) ? "#d8dec6" : "#ead6b4";
    ctx.fillRect(-size / 2, -size * 0.36, size, size * 0.72);
    ctx.strokeStyle = "#5a634e";
    ctx.lineWidth = 2;
    ctx.strokeRect(-size / 2, -size * 0.36, size, size * 0.72);
    line(
      ctx,
      { x: -size / 2, y: -size * 0.36 },
      { x: 0, y: size * 0.05 },
      "#9b7955",
    );
    line(
      ctx,
      { x: 0, y: size * 0.05 },
      { x: size / 2, y: -size * 0.36 },
      "#9b7955",
    );
    ctx.restore();
  }
  // Gentle lens border and reticle, without head bob or flashing.
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.2,
    width / 2,
    height / 2,
    width * 0.65,
  );
  vignette.addColorStop(0, "#00000000");
  vignette.addColorStop(1, "#07101699");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#f0e8d480";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 5, 0, Math.PI * 2);
  ctx.stroke();
  if (alignment(room, pose).ready) {
    ctx.strokeStyle = "#a7d9cc";
    ctx.lineWidth = 2;
    ctx.strokeRect(width / 2 - 125, height / 2 - 125, 250, 250);
  }
  if (survey) drawSurvey(ctx, state, room, width, height);
  return true;
}

function drawWorldSegment(
  ctx,
  a,
  b,
  pose,
  depths,
  width,
  height,
  color,
  lineWidth,
) {
  // Sampled segment clipping handles both the near plane and per-column wall occlusion.
  const samples = 40;
  let previous = null;
  for (let n = 0; n <= samples; n++) {
    const t = n / samples,
      point = {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
      };
    const p = project(point, pose, width, height),
      x = Math.floor(p.x);
    const visible =
      p.depth > 0.08 &&
      x >= 0 &&
      x < width &&
      p.y >= -height &&
      p.y < height * 2 &&
      p.depth < depths[x] + 0.04;
    if (visible && previous) line(ctx, previous, p, color, lineWidth);
    previous = visible ? p : null;
  }
}

function drawSurvey(ctx, state, room, width, height) {
  const size = 13,
    left = width - 145,
    top = 22;
  ctx.fillStyle = "#0b171cd9";
  ctx.fillRect(left - 12, top - 12, 139, 160);
  room.map.forEach((row, y) =>
    [...row].forEach((tile, x) => {
      ctx.fillStyle = tile === "." ? "#6e81745c" : "#d1c7a68c";
      ctx.fillRect(left + x * size, top + y * size, size - 2, size - 2);
    }),
  );
  const dot = (point, color, radius) => {
    ctx.beginPath();
    ctx.arc(
      left + point.x * size - 1,
      top + point.y * size - 1,
      radius,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = color;
    ctx.fill();
  };
  dot(room.target, "#e8b58e", 3);
  dot(room.note, "#f2d8a5", 3);
  dot(state.pose, "#a7d9cc", 4);
  line(
    ctx,
    { x: left + state.pose.x * size - 1, y: top + state.pose.y * size - 1 },
    {
      x: left + (state.pose.x + Math.cos(state.pose.angle) * 0.8) * size - 1,
      y: top + (state.pose.y + Math.sin(state.pose.angle) * 0.8) * size - 1,
    },
    "#a7d9cc",
    2,
  );
  ctx.fillStyle = "#e5dfcd";
  ctx.font = "10px monospace";
  ctx.fillText("SURVEY · N ↑", left, top + 132);
}

export function postcardSVG(roomId) {
  const room = roomById(roomId),
    colors = ["#a66c49", "#397b70", "#977d43"];
  const lines = room.strokes
    .map(
      (stroke, index) =>
        `<polyline points="${stroke.points.map(([u, v]) => `${400 + u * 680},${255 - v * 680}`).join(" ")}" fill="none" stroke="${colors[index % 3]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("");
  // Room metadata and points are authored constants; no untrusted text enters this SVG.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560"><rect width="800" height="560" fill="#ede7d8"/><rect x="20" y="20" width="760" height="520" rx="4" fill="none" stroke="#b6b9a7"/>${lines}<text x="40" y="450" font-family="Georgia,serif" font-size="30" fill="#293e3c">${room.name}</text><text x="40" y="490" font-family="monospace" font-size="13" fill="#596c62">PARALLAX POSTCARDS / ROOM ${room.number} / ORIGINAL PROCEDURAL ART</text></svg>`;
}
