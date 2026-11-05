import { cp, mkdir, rm } from "node:fs/promises";
const root = new URL("../", import.meta.url),
  dist = new URL("dist/", root);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of [
  "index.html",
  "styles.css",
  "app.js",
  "world.js",
  "renderer.js",
  "LICENSE",
])
  await cp(new URL(file, root), new URL(file, dist));
console.log("Built dist/: Canvas2D game with six local files.");
