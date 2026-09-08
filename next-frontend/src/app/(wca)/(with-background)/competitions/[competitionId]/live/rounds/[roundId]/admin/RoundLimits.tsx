"use client";

import { Stack, Text } from "@chakra-ui/react";
import {
  parseActivityCode,
  timeLimitToString,
  cutoffToString,
} from "@/lib/wca/wcif/rounds";
import { useT } from "@/lib/i18n/useI18n";
import { useRoundInfo, useAllRoundsInfo } from "@/providers/RoundInfoProvider";

export default function RoundLimits() {
  const round = useRoundInfo();
  const { rounds } = useAllRoundsInfo();
  const { t } = useT();

  const { eventId } = parseActivityCode(round.id);

  return (
    <Stack gap={1}>
      <Text>
        {t("competitions.events.time_limit")}:{" "}
        {timeLimitToString(t, round.timeLimit, eventId, rounds)}
      </Text>
      <Text>
        {t("competitions.events.cutoff")}:{" "}
        {round.cutoff ? cutoffToString(t, round.cutoff, eventId) : "None"}
      </Text>
    </Stack>
  );
}
