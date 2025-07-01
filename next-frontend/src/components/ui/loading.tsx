import { Progress } from "@chakra-ui/react";

export default function Loading() {
  return (
    <Progress.Root value={null}>
      <Progress.Track>
        <Progress.Range />
      </Progress.Track>
    </Progress.Root>
  );
}
