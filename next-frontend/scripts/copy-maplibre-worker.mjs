// maplibre v6 loads its worker as a separate file, and Next's asset handling
//   does not emit the worker's `maplibre-gl-shared.mjs` sibling next to it, so
//   both are served from `public/` instead. See `setWorkerUrl` in Map.tsx.
// This script is copied from https://github.com/maplibre/maplibre-gl-js/blob/main/docs/index.md#installation
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const dist = path.join(
  path.dirname(
    createRequire(import.meta.url).resolve("maplibre-gl/package.json"),
  ),
  "dist",
);
const dest = path.join(process.cwd(), "public", "maplibre");

mkdirSync(dest, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(path.join(dist, file), path.join(dest, file));
}
