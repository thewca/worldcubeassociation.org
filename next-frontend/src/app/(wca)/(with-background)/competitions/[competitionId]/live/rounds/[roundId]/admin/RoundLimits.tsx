"use client";

import { Stack, Text } from "@chakra-ui/react";
import _ from "lodash";
import {
  parseActivityCode,
  timeLimitToString,
  cutoffToString,
} from "@/lib/wca/wcif/rounds";
import { useT } from "@/lib/i18n/useI18n";
import { useRoundInfo, useAllRoundsInfo } from "@/providers/RoundInfoProvider";
import type { components } from "@/types/openapi";

type WcifEvent = components["schemas"]["WcifEvent"];

export default function RoundLimits() {
  const round = useRoundInfo();
  const { rounds } = useAllRoundsInfo();
  const { t } = useT();

  const { eventId } = parseActivityCode(round.id);

  // timeLimitToString needs the surrounding events to render cumulative time
  // limits that span multiple rounds, so reconstruct them from all rounds.
  const siblingEvents: WcifEvent[] = Object.entries(
    _.groupBy(rounds, (r) => parseActivityCode(r.id).eventId),
  ).map(([id, eventRounds]) => ({ id, rounds: eventRounds, extensions: [] }));

  return (
    <Stack gap={1}>
      <Text>
        {t("competitions.events.time_limit")}:{" "}
        {timeLimitToString(t, round.timeLimit, eventId, siblingEvents)}
      </Text>
      <Text>
        {t("competitions.events.cutoff")}:{" "}
        {round.cutoff ? cutoffToString(t, round.cutoff, eventId) : "None"}
      </Text>
    </Stack>
  );
}
