"use client";
import React, { useMemo, useState } from "react";
import { Card, Text, Table } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import CompetitorTable from "@/components/competitions/CompetitorTable";
import PsychsheetTable from "@/components/competitions/PsychsheetTable";
import { FormEventSelector } from "@/components/EventSelector";
import Loading from "@/components/ui/loading";

interface CompetitorData {
  id: string;
  isLive?: boolean;
}

const TabCompetitors: React.FC<CompetitorData> = ({ id, isLive = false }) => {
  const [psychSheetEvent, setPsychSheetEvent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("average");

  const api = useAPI();
  const { t } = useT();

  const { data: registrationsQuery, isFetching } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/registrations",
    {
      params: { path: { competitionId: id } },
    },
  );

  const { data: psychSheetQuery, isFetching: isFetchingPsychsheets } =
    api.useQuery(
      "get",
      "/v0/competitions/{competitionId}/psych-sheet/{eventId}",
      {
        params: {
          path: { competitionId: id, eventId: psychSheetEvent! },
          query: { sort_by: sortBy },
        },
      },
      {
        enabled: psychSheetEvent !== null,
      },
    );

  const eventIds = useMemo(() => {
    const flatEventList = registrationsQuery?.flatMap(
      (reg) => reg.competing.event_ids,
    );

    const eventSet = new Set(flatEventList);
    return Array.from(eventSet);
  }, [registrationsQuery]);

  if (isFetching || isFetchingPsychsheets) {
    return <Loading />;
  }

  if (!registrationsQuery) {
    return <Text>{t("competitions.registration_v2.errors.-1001")}</Text>;
  }

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title>
          <FormEventSelector
            title="Events"
            selectedEvents={psychSheetEvent ? [psychSheetEvent] : []}
            eventList={eventIds}
            onEventClick={(event) => setPsychSheetEvent(event)}
            onClearClick={
              psychSheetEvent === null
                ? undefined
                : () => setPsychSheetEvent(null)
            }
          />
        </Card.Title>
        <Table.ScrollArea borderWidth="1px" maxW="full">
          {psychSheetEvent && (
            <PsychsheetTable
              pychsheet={psychSheetQuery!}
              t={t}
              setSortBy={setSortBy}
            />
          )}
          {!psychSheetEvent && (
            <CompetitorTable
              eventIds={eventIds}
              registrations={registrationsQuery}
              setPsychSheetEvent={setPsychSheetEvent}
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
