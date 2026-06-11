"use client";

import LiveResultsTable from "@/components/live/LiveResultsTable";
import {
  Heading,
  HStack,
  Spacer,
  IconButton,
  Switch,
  VStack,
  Link,
} from "@chakra-ui/react";
import ConnectionPulse from "@/components/live/ConnectionPulse";
import { useLiveResults } from "@/providers/LiveResultProvider";
import PendingResultsTable from "@/components/live/PendingResultsTable";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { useState } from "react";
import AddPersonModal from "@/app/(wca)/(with-background)/competitions/[competitionId]/live/rounds/[roundId]/admin/AddPerson";
import BulkQuitButton from "@/app/(wca)/(with-background)/competitions/[competitionId]/live/rounds/[roundId]/admin/BulkQuitButton";
import { LuCheck, LuEye, LuPencil } from "react-icons/lu";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import { Tooltip } from "@/components/ui/tooltip";
import { useT } from "@/lib/i18n/useI18n";

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
  const { t } = useT();

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
        {isAdminView && <ConnectionPulse connectionState={connectionState} />}
        <Spacer flex={1} />
        {!isAdminView && <ConnectionPulse connectionState={connectionState} />}
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
          <Tooltip
            content={
              isAdminView
                ? t("competitions.live.admin.results_view")
                : t("competitions.live.admin.admin_view")
            }
            showArrow
            openDelay={200}
          >
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
                    <LuEye />
                  </NextLink>
                ) : (
                  <NextLink
                    href={route({
                      pathname:
                        "/competitions/[competitionId]/live/rounds/[roundId]/admin",
                      query: { competitionId, roundId: roundWcifId },
                    })}
                  >
                    <LuPencil />
                  </NextLink>
                )}
              </Link>
            </IconButton>
          </Tooltip>
        )}
        {isAdminView && (
          <>
            <AddPersonModal
              competitionId={competitionId}
              competitors={competitors}
              roundId={roundWcifId}
            />
            <BulkQuitButton
              competitionId={competitionId}
              roundId={roundWcifId}
            />
            <Tooltip
              content={t("competitions.live.admin.double_check")}
              showArrow
              openDelay={200}
            >
              <IconButton variant="ghost">
                <Link asChild>
                  <NextLink
                    href={route({
                      pathname:
                        "/competitions/[competitionId]/live/rounds/[roundId]/admin/double-check",
                      query: { competitionId, roundId: roundWcifId },
                    })}
                  >
                    <LuCheck />
                  </NextLink>
                </Link>
              </IconButton>
            </Tooltip>
          </>
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
