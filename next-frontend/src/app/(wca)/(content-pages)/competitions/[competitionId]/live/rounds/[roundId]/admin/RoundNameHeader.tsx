"use client";

import { Heading } from "@chakra-ui/react";
import { useRoundName } from "@/lib/wca/live/getRoundName";

export default function RoundNameHeader() {
  const roundName = useRoundName();

  return <Heading textStyle="h1">{roundName}</Heading>;
}
