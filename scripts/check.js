import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const root = new URL("../", import.meta.url);
for (const file of [
  "app.js",
  "world.js",
  "renderer.js",
  "scripts/build.js",
  "scripts/check.js",
]) {
  const result = spawnSync(
    process.execPath,
    ["--check", new URL(file, root).pathname],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
}
const html = await readFile(new URL("index.html", root), "utf8"),
  app = await readFile(new URL("app.js", root), "utf8"),
  renderer = await readFile(new URL("renderer.js", root), "utf8"),
  css = await readFile(new URL("styles.css", root), "utf8");
assert(!/https?:\/\//.test(html + app + css), "No remote runtime resources");
assert(
  !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|requestPointerLock|webgl/i.test(
    app,
  ),
  "No network, WebGL or pointer lock",
);
assert(/getContext\(["']2d["']/.test(renderer));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length);
for (const [, id] of app.matchAll(/\$\(["']([^"']+)["']\)/g))
  assert(ids.includes(id), `Missing HTML ID ${id}`);
assert(css.includes("prefers-reduced-motion"));
assert(html.includes('aria-live="polite"'));
console.log(
  "Syntax, DOM references and local-only Canvas2D boundary verified.",
);
