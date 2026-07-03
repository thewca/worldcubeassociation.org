"use client";

import { Fragment, useMemo, useState } from "react";
import { Box, Heading, HStack, Link, Text, VStack } from "@chakra-ui/react";
import { route } from "nextjs-routes";
import NextLink from "next/link";
import _ from "lodash";
import { TFunction } from "i18next";
import { components } from "@/types/openapi";
import events from "@/lib/wca/data/events";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";
import {
  computeMatchScores,
  groupMatchesIntoStages,
  H2hMatch,
  H2hRound,
} from "@/lib/wca/results/headToHead";

export default function HeadToHeadBrackets({
  h2hRounds,
}: {
  h2hRounds: components["schemas"]["H2hRound"][];
}) {
  const eventIds = _.uniq(h2hRounds.map((round) => round.event_id));
  const [activeEventId, setActiveEventId] = useState<string>(eventIds[0]);

  const { t } = useT();

  const activeRounds = h2hRounds.filter(
    (round) => round.event_id === activeEventId,
  );

  return (
    <VStack align="left" gap={4}>
      {eventIds.length > 1 && (
        <SingleEventSelector
          title=""
          selectedEvent={activeEventId}
          onEventClick={setActiveEventId}
          eventList={eventIds}
        />
      )}
      {activeRounds.map((round) => (
        <Fragment key={round.id}>
          <Heading textStyle="h3">
            {events.byId[round.event_id].name}{" "}
            {t(`rounds.${round.round_type_id}.name`)}
          </Heading>
          <Bracket round={round} t={t} />
        </Fragment>
      ))}
    </VStack>
  );
}

function Bracket({ round, t }: { round: H2hRound; t: TFunction }) {
  const stages = useMemo(
    () => groupMatchesIntoStages(round.matches),
    [round.matches],
  );

  return (
    <Box overflowX="auto">
      <HStack align="stretch" gap={8} minW="fit-content">
        {stages.map((stageMatches, stageIndex) => {
          const isLastStage = stageIndex === stages.length - 1;

          return (
            <VStack key={stageIndex} align="stretch" minW="18rem" gap={4}>
              <Heading textStyle="h5">
                {isLastStage && stages.length > 1
                  ? t("competitions.h2h.finals")
                  : t("competitions.h2h.round_number", {
                      number: stageIndex + 1,
                    })}
              </Heading>
              <VStack flex="1" align="stretch" justify="space-around" gap={6}>
                {stageMatches.map((match) => (
                  <MatchCard
                    key={match.match_number}
                    match={match}
                    label={isLastStage ? finalsMatchLabel(match, t) : undefined}
                  />
                ))}
              </VStack>
            </VStack>
          );
        })}
      </HStack>
    </Box>
  );
}

function finalsMatchLabel(match: H2hMatch, t: TFunction) {
  const positions = match.competitors.map((competitor) => competitor.final_pos);
  if (positions.includes(1)) return t("competitions.h2h.final");
  if (positions.includes(3)) return t("competitions.h2h.third_place");
  return undefined;
}

function MatchCard({ match, label }: { match: H2hMatch; label?: string }) {
  const { scores, winnerUserId } = computeMatchScores(match);

  return (
    <Box borderWidth="1px" rounded="md">
      {label && (
        <Text
          textStyle="xs"
          color="fg.muted"
          px={3}
          pt={2}
          textTransform="uppercase"
        >
          {label}
        </Text>
      )}
      {match.competitors.map((competitor, index) => {
        const score = scores[index];
        const isWinner = competitor.user_id === winnerUserId;

        return (
          <HStack
            key={competitor.user_id}
            justify="space-between"
            px={3}
            py={2}
            borderTopWidth={index > 0 ? "1px" : undefined}
            fontWeight={isWinner ? "bold" : "normal"}
          >
            {competitor.wca_id ? (
              <Link asChild>
                <NextLink
                  href={route({
                    pathname: "/persons/[wcaId]",
                    query: { wcaId: competitor.wca_id },
                  })}
                >
                  {competitor.name}
                </NextLink>
              </Link>
            ) : (
              <Text>{competitor.name}</Text>
            )}
            <HStack gap={3}>
              <HStack gap={2}>
                {score.raceWinsPerSet.map((raceWins, setIndex) => (
                  <Text key={setIndex} color="fg.muted">
                    {raceWins}
                  </Text>
                ))}
              </HStack>
              <Text fontWeight="bold">{score.setWins}</Text>
            </HStack>
          </HStack>
        );
      })}
    </Box>
  );
}
