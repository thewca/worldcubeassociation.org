"use client";

import { Button, HStack, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import ActionButtons from "@/app/(wca)/competitions/[competitionId]/live/admin/ActionButtons";
import { useState } from "react";
import { LiveRoundState } from "@/types/live";
import { useT } from "@/lib/i18n/useI18n";
import { components } from "@/types/openapi";
import { getRoundTypeId, parseActivityCode } from "@/lib/wca/wcif/rounds";

export default function RoundActions({
  competitionId,
  round,
  totalRounds,
}: {
  competitionId: string;
  round: components["schemas"]["LiveRoundAdmin"];
  totalRounds: number;
}) {
  const { t } = useT();

  const [state, setState] = useState<LiveRoundState>(round.state);

  const { roundNumber } = parseActivityCode(round.id);
  const roundTypeId = getRoundTypeId(roundNumber!, totalRounds, false);

  const isOpen = ["open", "locked"].includes(round.state);

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
              {t(`rounds.${roundTypeId}.name`)}{" "}
              {round.state == "open" &&
                `(${round.competitors_live_results_entered}/${round.total_competitors} entered)`}
              {round.state == "locked" && `${round.total_competitors} locked`}
            </NextLink>
          </Link>
        ) : (
          t(`rounds.${roundTypeId}.name`)
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
