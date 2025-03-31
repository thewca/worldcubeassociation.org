import React from 'react';
import {Box, SimpleGrid} from "@chakra-ui/react";

const RandomBackground = ({ numRows, numCols, density = 3, bias = 3 }: { numRows: number, numCols: number, density?: number, bias?: number }) => {
  // Function to determine color based on probability
  const getColor = (probValue: number): string => {
    if (probValue <= 1 / 6) return '#029347'; // 0.0 - 0.166
    if (probValue <= 2 / 6) return '#FF5800'; // 0.167 - 0.333
    if (probValue <= 3 / 6) return '#0051BA'; // 0.334 - 0.5
    if (probValue <= 4 / 6) return '#FFD313'; // 0.501 - 0.666
    if (probValue <= 5 / 6) return '#C62535'; // 0.667 - 0.833
    return 'transparent'; // 0.834 - 1, mock version of white
  };
  var keyVal = 0;

  return (
    <Box
      position="fixed"
      right={0}
      top={0}
      zIndex="hide" // Places it underneath other elements
      pointerEvents="none" // Prevents interaction with the grid
    >
      <SimpleGrid columns={numCols}>
        {[...Array(numRows)].flatMap(() =>
          [...Array(numCols)].map((_, i) => {
            const colorPickThreshold = 1 - Math.exp(-density * ((i + 1) / numCols) ** bias);
            const randomNumber = Math.random();
            keyVal++;

            if (randomNumber <= colorPickThreshold) {
              const randomColor = getColor(randomNumber / colorPickThreshold);

              return (
                <Box width="2vw" height="2vw" bg={randomColor} key={keyVal}/>
              )
            }

            return (
                <Box width="2vw" height="2vw"  key={keyVal}/>
            );
          }))}
      </SimpleGrid>
    </Box>
  );
};

export default RandomBackground;
