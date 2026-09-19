"use client";
import React, { useMemo, useState } from "react";
import { Box, Button, Card, Text, Table } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import CompetitorTable from "@/components/competitions/CompetitorTable";
import PsychsheetTable from "@/components/competitions/PsychsheetTable";
import { FormEventSelector } from "@/components/EventSelector";
import Loading from "@/components/ui/loading";
import RailsLink from "@/components/RailsLink";
import { hasPassed, hasNotPassed } from "@/lib/wca/dates";
import events from "@/lib/wca/data/events";
import type { components } from "@/types/openapi";

interface CompetitorData {
  id: string;
  isLive?: boolean;
  canAddOnTheSpot?: boolean;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}

const TabCompetitors: React.FC<CompetitorData> = ({
  id,
  isLive = false,
  canAddOnTheSpot = false,
  competitionInfo,
}) => {
  const [psychSheetEvent, setPsychSheetEvent] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("average");

  const api = useAPI();
  const { t } = useT();

  const {
    data: registrationsQuery,
    isFetching,
    isError,
  } = api.useQuery("get", "/v1/competitions/{competitionId}/registrations", {
    params: { path: { competitionId: id } },
  });

  const { data: psychSheetQuery, isFetching: isFetchingPsychsheets } =
    api.useQuery(
      "get",
      "/v0/competitions/{competitionId}/psych-sheet/{eventId}",
      {
        _params: {
          path: { competitionId: id, eventId: psychSheetEvent! },
          query: { sort_by: sortBy },
        },
        get params() {
          return this._params;
        },
        set params(value) {
          this._params = value;
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

  if (isError) {
    return <Text>{t("competitions.registration_v2.errors.-1001")}</Text>;
  }

  if (isFetching || isFetchingPsychsheets || !registrationsQuery) {
    return <Loading />;
  }

  // Normal Top Vars
  const registrationIsOpen =
    hasPassed(competitionInfo.registration_open) &&
    hasNotPassed(competitionInfo.registration_close);

  const totalCount = registrationsQuery.length;

  const returnerCount = registrationsQuery.filter(
    (reg) => reg.user.wca_id,
  ).length;

  const newcomerCount = totalCount - returnerCount;

  return (
    <Card.Root>
      <Card.Body>
        {!psychSheetEvent && registrationIsOpen && totalCount > 0 && (
          <Box
            bg="black"
            color="white"
            width="full"
            borderRadius="md"
            mb={2}
            p={3}
          >
            <Text fontWeight="semibold">
              Registrations {totalCount > 0 ? `(${totalCount})` : ""}
            </Text>
            <Text>
              {totalCount} participants = {returnerCount} returners +{" "}
              {newcomerCount} newcomers
            </Text>
          </Box>
        )}
        {psychSheetEvent && registrationIsOpen && totalCount > 0 && (
          <Box
            bg="black"
            color="white"
            width="full"
            borderRadius="md"
            mb={2}
            p={3}
          >
            <Text fontWeight="semibold">
              {events.byId[psychSheetEvent]?.name} | ({totalCount})
              participants{" "}
            </Text>
            <Text>
              {totalCount} participants = {returnerCount} returners +{" "}
              {newcomerCount} newcomers
            </Text>
          </Box>
        )}
        {canAddOnTheSpot && (
          <Button asChild alignSelf="flex-end" mb={2}>
            <RailsLink href={`/competitions/${id}/registrations/add`}>
              Add on the spot registration
            </RailsLink>
          </Button>
        )}
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
