"use client";

import { Button, HStack, Link } from "@chakra-ui/react";
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

  return (
    <HStack>
      <Button
        asChild
        variant="subtle"
        flex="1"
        justifyContent="flex-start"
        textAlign="left"
        disabled={["ready", "pending"].includes(state)}
      >
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
            {getRoundName(round.id, t, rounds)}{" "}
            {round.state == "open" &&
              `(${round.competitors_live_results_entered}/${round.total_competitors} entered)`}
            {round.state == "locked" && `${round.total_competitors} locked`}
          </NextLink>
        </Link>
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
