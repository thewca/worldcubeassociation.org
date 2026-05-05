"use client";

import { Heading } from "@chakra-ui/react";
import { getRoundName } from "@/lib/wca/live/getRoundName";
import { TFunction } from "i18next";
import { useAllRoundsInfo, useRoundInfo } from "@/providers/RoundInfoProvider";

export default function RoundNameHeader({ t }: { t: TFunction }) {
  const { rounds } = useAllRoundsInfo();
  const { id } = useRoundInfo();

  const roundName = getRoundName(id, t, rounds);

  return <Heading textStyle="h1">{roundName}</Heading>;
}
