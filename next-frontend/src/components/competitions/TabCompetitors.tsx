"use client";
import React, { useState } from "react";
import { Button, Card, Link, Text, Table } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import CompetitorTable from "@/components/competitions/CompetitorTable";
import PsychsheetTable from "@/components/competitions/PsychsheetTable";
import { FormEventSelector } from "@/components/EventSelector";
import Loading from "@/components/ui/loading";
import type { components } from "@/types/openapi";

type PsychSheetSortBy = components["schemas"]["PsychSheet"]["sort_by"];

interface CompetitorData {
  id: string;
  eventIds: string[];
  isLive?: boolean;
  canAddOnTheSpot?: boolean;
}

const TabCompetitors: React.FC<CompetitorData> = ({
  id,
  eventIds,
  isLive = false,
  canAddOnTheSpot = false,
}) => {
  const [psychSheetEvent, setPsychSheetEvent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<PsychSheetSortBy>();

  const showPsychSheetFor = (eventId: string) => {
    setPsychSheetEvent(eventId);
    setSortBy(undefined);
  };

  const api = useAPI();
  const { t } = useT();

  const { data: registrationsQuery, isError } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/registrations",
    {
      params: { path: { competitionId: id } },
    },
  );

  const {
    data: psychSheetQuery,
    isFetching: isFetchingPsychsheets,
    isError: isPsychSheetError,
  } = api.useQuery(
    "get",
    "/v0/competitions/{competitionId}/psych-sheet/{eventId}",
    {
      params: {
        path: { competitionId: id, eventId: psychSheetEvent! },
        query: sortBy ? { sort_by: sortBy } : {},
      },
    },
    {
      enabled: psychSheetEvent !== null,
      // Re-sorting the event we're already looking at should not tear the table
      // down, but data from a *different* event would be formatted with the
      // wrong event's units, so we only hold on to it within one event.
      placeholderData: (previousData, previousQuery) =>
        previousQuery?.queryKey[2].params.path.eventId === psychSheetEvent
          ? previousData
          : undefined,
    },
  );

  if (isError) {
    return <Text>{t("competitions.registration_v2.errors.-1001")}</Text>;
  }

  if (!registrationsQuery) {
    return <Loading />;
  }

  return (
    <Card.Root>
      <Card.Body>
        {canAddOnTheSpot && (
          <Button asChild alignSelf="flex-end" mb={2}>
            <Link href={`/competitions/${id}/registrations/add`}>
              Add on the spot registration
            </Link>
          </Button>
        )}
        <Card.Title>
          <FormEventSelector
            title="Events"
            selectedEvents={psychSheetEvent ? [psychSheetEvent] : []}
            eventList={eventIds}
            onEventClick={showPsychSheetFor}
            onClearClick={
              psychSheetEvent === null
                ? undefined
                : () => setPsychSheetEvent(null)
            }
          />
        </Card.Title>
        <Table.ScrollArea borderWidth="1px" maxW="full">
          {psychSheetEvent && isFetchingPsychsheets && <Loading />}
          {psychSheetEvent && isPsychSheetError && (
            <Text p={4}>{t("competitions.registration_v2.errors.-1001")}</Text>
          )}
          {psychSheetEvent && psychSheetQuery && !isPsychSheetError && (
            <PsychsheetTable
              psychSheet={psychSheetQuery}
              eventId={psychSheetEvent}
              sortBy={psychSheetQuery.sort_by}
              t={t}
              setSortBy={setSortBy}
            />
          )}
          {!psychSheetEvent && (
            <CompetitorTable
              eventIds={eventIds}
              registrations={registrationsQuery}
              setPsychSheetEvent={showPsychSheetFor}
              t={t}
              linkToLive={isLive}
              competitionId={id}
            />
          )}
        </Table.ScrollArea>
      </Card.Body>
    </Card.Root>
  );
};

export default TabCompetitors;
