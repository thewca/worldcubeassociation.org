"use client";
import React, { useState } from "react";
import { Button, Card, Link, Text, Table } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import CompetitorTable from "@/components/competitions/CompetitorTable";
import Psychsheet from "@/components/competitions/Psychsheet";
import { FormEventSelector } from "@/components/EventSelector";
import Loading from "@/components/ui/loading";

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

  const { data: registrationsQuery, isError } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/registrations",
    {
      params: { path: { competitionId: id } },
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
            onEventClick={setPsychSheetEvent}
            onClearClick={
              psychSheetEvent === null
                ? undefined
                : () => setPsychSheetEvent(null)
            }
          />
        </Card.Title>
        <Table.ScrollArea borderWidth="1px" maxW="full">
          {psychSheetEvent ? (
            // Remounting per event keeps one event's rows from ever being
            // rendered with another event's result formatting.
            <Psychsheet
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
