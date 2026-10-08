
"use client";

import React, { useState } from "react";
import { Box, Button, Card, Text, Table } from "@chakra-ui/react";

import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import CompetitorTable from "@/components/competitions/CompetitorTable";
import PsychSheet from "@/components/competitions/PsychSheet";
import { FormEventSelector } from "@/components/EventSelector";
import Loading from "@/components/ui/loading";
import RailsLink from "@/components/RailsLink";
import events from "@/lib/wca/data/events";

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

  const api = useAPI();
  const { t } = useT();

  const {
    data: registrationsQuery,
    isPending,
    isError,
  } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/registrations",
    {
      params: {
        path: {
          competitionId: id,
        },
      },
    },
  );

  if (isError) {
    return (
      <Text>
        {t("competitions.registration_v2.errors.-1001")}
      </Text>
    );
  }

  if (isPending) {
    return <Loading />;
  }

  // All registrations for the competition
  const totalRegistrations = registrationsQuery.length;

  // Filter competitors by the selected event.
  // Without an event selection, include everyone.
  const selectedRegistrations = psychSheetEvent
    ? registrationsQuery.filter((registration) =>
        registration.competing.event_ids.includes(
          psychSheetEvent,
        ),
      )
    : registrationsQuery;

  // Counts for the current view
  const totalCount = selectedRegistrations.length;

  const returnerCount = selectedRegistrations.filter(
    (registration) => Boolean(registration.user.wca_id),
  ).length;

  const newcomerCount = totalCount - returnerCount;

  // Summary title
  const summaryTitle = psychSheetEvent
    ? `${events.byId[psychSheetEvent]?.name ?? psychSheetEvent} (${totalCount})`
    : `Registrations (${totalRegistrations})`;

  return (
    <Card.Root>
      <Card.Body>
        {/* Registration and psych sheet summary */}
        <Box
          bg="black"
          color="white"
          width="full"
          borderRadius="md"
          mb={3}
          p={3}
        >
          <Text fontWeight="semibold">
            {summaryTitle}
          </Text>
          <Text>
            {totalCount} participants = {returnerCount}{" "}
            returners + {newcomerCount} newcomers
          </Text>
        </Box>

        {/* Add on-the-spot registrations */}
        {canAddOnTheSpot && (
          <Button asChild alignSelf="flex-end" mb={2}>
            <RailsLink
              href={`/competitions/${id}/registrations/add`}
            >
              Add on the spot registration
            </RailsLink>
          </Button>
        )}

        {/* Event selector */}
        <Card.Title>
          <FormEventSelector
            title="Events"
            selectedEvents={
              psychSheetEvent ? [psychSheetEvent] : []
            }
            eventList={eventIds}
            onEventClick={setPsychSheetEvent}
            onClearClick={
              psychSheetEvent === null
                ? undefined
                : () => setPsychSheetEvent(null)
            }
          />
        </Card.Title>

        {/* Competitors / Psych Sheet */}
        <Table.ScrollArea borderWidth="1px" maxW="full">
          {psychSheetEvent ? (
            <PsychSheet
              key={psychSheetEvent}
              competitionId={id}
              eventId={psychSheetEvent}
              t={t}
            />
          ) : (
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
