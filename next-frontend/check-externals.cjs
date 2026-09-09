#!/usr/bin/env node

/* eslint @typescript-eslint/no-require-imports: 0 */
const fs = require("fs");
const path = require("path");

// Turbopack resolves @emotion/react through its `module` export condition,
// which is a separate implementation from the `default` (CJS) one. A package
// listed in serverExternalPackages is loaded by Node rather than the bundler,
// and Node never picks `module` — so if such a package reaches @emotion/react,
// the server render ends up with two live copies. Emotion keeps its cache in
// module state, so Chakra's withEmotionCache then stops seeing the
// <CacheProvider> in src/components/ui/emotion-registry.tsx: unstyled first
// paint plus a hydration mismatch, with no build error (vercel/next.js#91411).
//
// check-emotion-instances.cjs cannot catch this. The second copy is never
// bundled, so it leaves nothing behind in the build output for that check to
// read. This one checks the cause rather than the artefact.
//
// The list comes from the built config rather than next.config.ts because
// plugins add to it: withPayload contributes graphql, sharp, libsql and others
// that never appear in our own source.

const TARGET = "@emotion/react";
const CONFIG = path.resolve(__dirname, "./.next/required-server-files.json");
const NODE_MODULES = path.resolve(__dirname, "./node_modules");

// Entries may name a subpath (`drizzle-kit/api`); externals match per package.
function packageName(entry) {
  const segments = entry.split("/");
  return entry.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0];
}

// Returns the dependency chain from pkg to target, or null if it cannot reach
// it. peerDependencies count: @chakra-ui/react declares @emotion/react as one.
function dependencyChain(pkg, seen = new Set(), trail = []) {
  if (seen.has(pkg)) return null;
  seen.add(pkg);

  const manifest = path.join(NODE_MODULES, pkg, "package.json");
  if (!fs.existsSync(manifest)) return null;

  let json;
  try {
    json = JSON.parse(fs.readFileSync(manifest, "utf8"));
  } catch {
    return null;
  }

  const dependencies = Object.keys({
    ...json.dependencies,
    ...json.optionalDependencies,
    ...json.peerDependencies,
  });

  if (dependencies.includes(TARGET)) return [...trail, pkg, TARGET];

  for (const dependency of dependencies) {
    const chain = dependencyChain(dependency, seen, [...trail, pkg]);
    if (chain) return chain;
  }

  return null;
}

if (!fs.existsSync(CONFIG)) {
  console.error(
    `✘ ${path.relative(__dirname, CONFIG)} does not exist. Run \`yarn build\` first.`,
  );
  process.exit(1);
}

const externals = [
  ...new Set(
    JSON.parse(
      fs.readFileSync(CONFIG, "utf8"),
    ).config.serverExternalPackages.map(packageName),
  ),
];

// Finding none means this check stopped seeing what it is meant to watch (a
// renamed config key, say), which is as much a failure as finding an offender.
if (externals.length === 0) {
  console.error(
    "✘ no externalized packages found. This check can no longer see the build config.",
  );
  process.exit(1);
}

const offenders = externals
  .map((pkg) => dependencyChain(pkg))
  .filter((chain) => chain !== null);

if (offenders.length === 0) {
  console.log(
    `✔ none of the ${externals.length} externalized packages reach ${TARGET}`,
  );
  process.exit(0);
}

console.error(
  `✘ ${offenders.length} externalized package(s) reach ${TARGET}, which splits Emotion into two live copies:\n${offenders
    .map((chain) => `  ${chain.join(" -> ")}`)
    .join("\n")}`,
);
process.exit(1);
