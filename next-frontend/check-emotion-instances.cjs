#!/usr/bin/env node

/* eslint @typescript-eslint/no-require-imports: 0 */
const fs = require("fs");
const path = require("path");

// Turbopack can resolve @emotion/react to both its CJS and its ESM build within
// one graph (vercel/next.js#91411). Emotion keeps its cache and theme contexts
// in module state, so two live copies make the <CacheProvider> in
// src/components/ui/emotion-registry.tsx invisible to Chakra's
// withEmotionCache. Nothing fails at build time; the symptom is an unstyled
// first paint plus a hydration mismatch at runtime.
//
// Those contexts live in emotion-element-<hash>.js, one file per build flavour,
// so exactly one flavour per graph means exactly one live copy. Finding none
// means this check stopped seeing what it is meant to watch (Next.js dropped
// the source maps, or renamed the output directories) and is just as much a
// failure as finding two.

const GRAPHS = [
  { name: "server", dir: path.resolve(__dirname, "./.next/server") },
  { name: "client", dir: path.resolve(__dirname, "./.next/static") },
];

const EMOTION_DIST = path.resolve(
  __dirname,
  "./node_modules/@emotion/react/dist",
);

// Server maps name their sources relative to the map and percent-encode the
// scope, client maps name them from the project root.
const PROJECT_ROOT_PREFIX = "turbopack:///[project]/";

const EMOTION_ELEMENT =
  /(?:turbopack:\/\/\/\[project\]\/|(?:\.\.\/)+)node_modules\/(?:@|%40)emotion\/react\/dist\/emotion-element-[\w.-]+\.js/g;

function resolveSource(source, mapPath) {
  return source.startsWith(PROJECT_ROOT_PREFIX)
    ? path.resolve(__dirname, source.slice(PROJECT_ROOT_PREFIX.length))
    : path.resolve(path.dirname(mapPath), decodeURIComponent(source));
}

function sourceMapsIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceMapsIn(entryPath);
    return entry.name.endsWith(".js.map") ? [entryPath] : [];
  });
}

// Keeping only the sources that resolve into our own node_modules skips the
// copy of Emotion that Payload bundles into its dist: that one is baked in
// rather than resolved, it predates Turbopack, and Chakra never shares a graph
// with it.
function emotionInstances(dir) {
  const found = new Set();

  sourceMapsIn(dir).forEach((mapPath) => {
    const contents = fs.readFileSync(mapPath, "utf8");

    for (const source of contents.match(EMOTION_ELEMENT) ?? []) {
      const resolved = resolveSource(source, mapPath);

      if (path.dirname(resolved) === EMOTION_DIST) {
        found.add(path.basename(resolved));
      }
    }
  });

  return found;
}

let failed = false;

GRAPHS.forEach(({ name, dir }) => {
  if (!fs.existsSync(dir)) {
    console.error(
      `✘ ${name}: ${dir} does not exist. Run \`yarn build\` first.`,
    );
    failed = true;
    return;
  }

  const instances = emotionInstances(dir);

  if (instances.size === 1) {
    console.log(`✔ ${name}: one Emotion instance (${[...instances]})`);
    return;
  }

  failed = true;
  console.error(
    instances.size === 0
      ? `✘ ${name}: no Emotion instance found. This check can no longer see the build output.`
      : `✘ ${name}: ${instances.size} Emotion instances:\n  ${[...instances].join("\n  ")}`,
  );
});

if (failed) process.exit(1);
