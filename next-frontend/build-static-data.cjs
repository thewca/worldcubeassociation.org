#!/usr/bin/env node

/* eslint @typescript-eslint/no-require-imports: 0 */
const fs = require("fs");
const path = require("path");

// The Rails app owns lib/static_data/. Copy it in rather than symlinking:
// Turbopack resolves symlinks to their real path and refuses to load anything
// outside the project root. Docker builds get these files copied in by CI
// (.github/actions/build-js-image), so a missing source directory is not an
// error there.
const staticDataDir = process.env.STATIC_DATA_DIR || "../lib/static_data/";

const inputDir = path.resolve(__dirname, staticDataDir);
const outputDir = path.resolve(__dirname, "./src/lib/staticData");

if (!fs.existsSync(inputDir)) {
  console.log(`↷ Skipped static data: ${inputDir} does not exist`);
  process.exit(0);
}

fs.mkdirSync(outputDir, { recursive: true });

fs.readdirSync(inputDir)
  .filter((file) => file.endsWith(".json"))
  .forEach((file) => {
    const outputPath = path.join(outputDir, file);
    fs.copyFileSync(path.join(inputDir, file), outputPath);
    console.log(`✔ Wrote ${outputPath}`);
  });
