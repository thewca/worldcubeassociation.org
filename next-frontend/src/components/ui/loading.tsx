import { Box, Progress } from "@chakra-ui/react";

export default function Loading() {
  return (
    <Box w="100%">
      <Progress.Root value={null}>
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
    </Box>
  );
}
