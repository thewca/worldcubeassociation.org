"use client";

import { Button, HStack, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import ActionButtons from "@/app/(wca)/competitions/[competitionId]/live/admin/ActionButtons";
import { useState } from "react";
import { LiveRoundAdmin, LiveRoundState } from "@/types/live";
import { useT } from "@/lib/i18n/useI18n";
import { components } from "@/types/openapi";
import { getRoundName } from "@/lib/wca/live/getRoundName";

export default function RoundActions({
  competitionId,
  round,
  rounds,
}: {
  competitionId: string;
  round: components["schemas"]["LiveRoundAdmin"];
  rounds: LiveRoundAdmin[];
}) {
  const { t } = useT();

  const [state, setState] = useState<LiveRoundState>(round.state);

  const isOpen = ["open", "locked"].includes(state);

  const roundName = getRoundName(round.id, t, rounds);

  return (
    <HStack justify="space-between">
      <Button
        asChild
        variant="subtle"
        flex="1"
        justifyContent="flex-start"
        textAlign="left"
        disabled={["ready", "pending"].includes(state)}
      >
        {isOpen ? (
          <Link asChild>
            <NextLink
              href={route({
                pathname:
                  "/competitions/[competitionId]/live/rounds/[roundId]/admin",
                query: {
                  competitionId,
                  roundId: round.id,
                },
              })}
            >
              {roundName}{" "}
              {round.state == "open" &&
                `(${t("competitions.live.admin.competitors_entered", {
                  competitors_live_results_entered:
                    round.competitors_live_results_entered,
                  total_competitors: round.total_competitors,
                })})`}
              {round.state == "locked" &&
                `(${t("competitions.live.admin.round_locked", {
                  total_competitors: round.total_competitors,
                })})`}
            </NextLink>
          </Link>
        ) : (
          <Text>{roundName}</Text>
        )}
      </Button>
      <ActionButtons
        state={state}
        setState={setState}
        roundId={round.id}
        competitionId={competitionId}
      />
    </HStack>
  );
}
