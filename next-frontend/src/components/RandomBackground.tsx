import React from "react";
import { Box, SimpleGrid } from "@chakra-ui/react";

// The grid is drawn during prerender, so it cannot use Math.random: cache-components
//   rejects it, and deferring to the client makes the background pop in after load.
//   A seeded PRNG keeps the grid random-looking but reproducible - it stays put for the
//   lifetime of a build and reshuffles on the next deploy, or per page via `seed`.
const hashSeed = (seed: string): number => {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  }

  return hash >>> 0;
};

// mulberry32, a 32-bit PRNG small enough to not warrant a dependency
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;

  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const RandomBackground = ({
  numRows,
  numCols,
  density = 3,
  bias = 3,
  seed = process.env.NEXT_PUBLIC_BUILD_SEED,
}: {
  numRows: number;
  numCols: number;
  density?: number;
  bias?: number;
  seed?: string;
}) => {
  const nextRandom = mulberry32(hashSeed(seed ?? "wca"));
  // Function to determine color based on probability
  const getColor = (probValue: number): string => {
    if (probValue <= 1 / 6) return "green"; // 0.0 - 0.166
    if (probValue <= 2 / 6) return "orange"; // 0.167 - 0.333
    if (probValue <= 3 / 6) return "blue"; // 0.334 - 0.5
    if (probValue <= 4 / 6) return "yellow"; // 0.501 - 0.666
    if (probValue <= 5 / 6) return "red"; // 0.667 - 0.833
    return "wcaWhite"; // 0.834 - 1
  };

  return (
    <Box
      position="fixed"
      right={0}
      top={0}
      zIndex="hide" // Places it underneath other elements
      pointerEvents="none" // Prevents interaction with the grid
    >
      <SimpleGrid columns={numCols}>
        {[...Array(numRows)].flatMap((_, row) =>
          [...Array(numCols)].map((_, col) => {
            const keyVal = row * numCols + col;

            const colorPickThreshold =
              1 - Math.exp(-density * ((col + 1) / numCols) ** bias);
            const randomNumber = nextRandom();

            if (randomNumber <= colorPickThreshold) {
              const randomColor = getColor(randomNumber / colorPickThreshold);

              return (
                <Box
                  width="2.5vw"
                  height="2.5vw"
                  colorPalette={randomColor}
                  bg="colorPalette.solid"
                  key={keyVal}
                />
              );
            }

            return <Box width="2.5vw" height="2.5vw" key={keyVal} />;
          }),
        )}
      </SimpleGrid>
    </Box>
  );
};

export default RandomBackground;
