"use client";

import LiveResultsTable from "@/components/live/LiveResultsTable";
import {
  Heading,
  HStack,
  IconButton,
  Spacer,
  Switch,
  VStack,
  Link,
} from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";
import { useLiveResults } from "@/providers/LiveResultProvider";
import PendingResultsTable from "@/components/live/PendingResultsTable";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { useState } from "react";
import AddPersonModal from "@/app/(wca)/competitions/[competitionId]/live/rounds/[roundId]/admin/AddPerson";
import { LuLock, LuLockOpen } from "react-icons/lu";
import NextLink from "next/link";
import { route } from "nextjs-routes";

export default function LiveUpdatingResultsTable({
  roundWcifId,
  formatId,
  competitionId,
  title,
  isAdminView = false,
  showEmpty = true,
  isLinkedRound = false,
  canManage = false,
}: {
  roundWcifId: string;
  formatId: string;
  competitionId: string;
  title: string;
  isAdminView?: boolean;
  showEmpty?: boolean;
  isLinkedRound?: boolean;
  canManage?: boolean;
}) {
  const [showLinkedRoundsView, setShowLinkedRoundsView] =
    useState(isLinkedRound);

  const {
    connectionState,
    liveResultsByRegistrationId,
    pendingLiveResults,
    competitors,
    pendingQuitCompetitors,
  } = useLiveResults();

  const { eventId } = parseActivityCode(roundWcifId);

  return (
    <VStack align="left">
      <HStack>
        <Heading textStyle={{ sm: "h3", md: "h2", lg: "h1" }}>{title}</Heading>
        <ConnectionPulse connectionState={connectionState} />
        <Spacer flex={1} />
        {isLinkedRound && (
          <Switch.Root
            checked={showLinkedRoundsView}
            onCheckedChange={(e) => setShowLinkedRoundsView(e.checked)}
            colorPalette="green"
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>Show combined Results</Switch.Label>
          </Switch.Root>
        )}
        {canManage && (
          <IconButton variant="ghost">
            <Link asChild>
              {isAdminView ? (
                <NextLink
                  href={route({
                    pathname:
                      "/competitions/[competitionId]/live/rounds/[roundId]",
                    query: { competitionId, roundId: roundWcifId },
                  })}
                >
                  <LuLockOpen />
                </NextLink>
              ) : (
                <NextLink
                  href={route({
                    pathname:
                      "/competitions/[competitionId]/live/rounds/[roundId]/admin",
                    query: { competitionId, roundId: roundWcifId },
                  })}
                >
                  <LuLock />
                </NextLink>
              )}
            </Link>
          </IconButton>
        )}
        {isAdminView && (
          <AddPersonModal
            competitionId={competitionId}
            competitors={competitors}
          />
        )}
      </HStack>
      <PendingResultsTable
        pendingLiveResults={pendingLiveResults}
        formatId={formatId}
        eventId={eventId}
        competitors={competitors}
      />
      <LiveResultsTable
        resultsByRegistrationId={liveResultsByRegistrationId}
        roundWcifId={roundWcifId}
        formatId={formatId}
        competitionId={competitionId}
        competitors={competitors}
        pendingQuitCompetitors={pendingQuitCompetitors}
        pendingLiveResults={pendingLiveResults}
        isAdmin={isAdminView}
        showEmpty={showEmpty}
        showLinkedRoundsView={showLinkedRoundsView}
        isLinkedRound={isLinkedRound}
      />
    </VStack>
  );
}
