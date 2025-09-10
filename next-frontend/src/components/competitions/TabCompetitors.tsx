"use client";
import React, { useMemo, useState } from "react";
import {
  Card,
  Text,
  Table,
  Center,
  Spinner,
  Link,
  HStack,
  Icon,
} from "@chakra-ui/react";
import EventIcon from "@/components/EventIcon";
import CountryMap from "@/components/CountryMap";
import { useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import { route } from "nextjs-routes";
import Flag from "react-world-flags";
import EventSelector from "@/components/EventSelector";
import CompetitorTable from "@/components/competitions/CompetitorTable";
import PsychsheetTable from "@/components/competitions/PsychsheetTable";

interface CompetitorData {
  id: string;
}

const TabCompetitors: React.FC<CompetitorData> = ({ id }) => {
  const [psychSheetEvent, setPsychSheetEvent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("average");

  const api = useAPI(true);
  const v0api = useAPI(false);
  const { t } = useT();

  const { data: registrationsQuery, isFetching } = useQuery({
    queryKey: ["registrations", id],
    queryFn: () =>
      api.GET("/v0/competitions/{competitionId}/registrations", {
        params: { path: { competitionId: id } },
      }),
  });

  const { data: psychSheetQuery, isFetching: isFetchingPsychsheets } = useQuery(
    {
      queryKey: ["psychSheets", id, psychSheetEvent, sortBy],
      queryFn: () =>
        v0api.GET("/competitions/{competitionId}/psych-sheet/{eventId}", {
          params: {
            path: { competitionId: id, eventId: psychSheetEvent! },
            query: { sort_by: sortBy },
          },
        }),
      enabled: psychSheetEvent !== null,
    },
  );

  const eventIds = useMemo(() => {
    const flatEventList = registrationsQuery?.data?.flatMap(
      (reg) => reg.competing.event_ids,
    );

    const eventSet = new Set(flatEventList);
    return Array.from(eventSet);
  }, [registrationsQuery?.data]);

  if (isFetching || isFetchingPsychsheets) {
    return (
      <Center py={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!registrationsQuery?.data) {
    return <Text>{t("competitions.registration_v2.errors.-1001")}</Text>;
  }

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title>
          <EventSelector
            title="Events"
            selectedEvents={psychSheetEvent ? [psychSheetEvent] : []}
            eventList={eventIds}
            hideAllButton
            hideClearButton={psychSheetEvent === null}
            onEventClick={(event) => setPsychSheetEvent(event)}
            onClearClick={() => setPsychSheetEvent(null)}
          />
        </Card.Title>
        {psychSheetEvent && (
          <PsychsheetTable pychsheet={psychSheetQuery!.data!} t={t} />
        )}
        {!psychSheetEvent && (
          <CompetitorTable
            eventIds={eventIds}
            registrations={registrationsQuery.data}
            setPsychSheetEvent={setPsychSheetEvent}
            t={t}
          />
        )}
      </Card.Body>
    </Card.Root>
  );
};

export default TabCompetitors;
