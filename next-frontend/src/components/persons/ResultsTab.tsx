"use client";
import React, { useState } from "react";
import { Text, VStack } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { ByCompetitionTable } from "@/components/results/ResultsTable";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";

interface ResultsTabProps {
  wcaId: string;
  eventsWithResults: string[];
}

const ResultsTab: React.FC<ResultsTabProps> = ({
  wcaId,
  eventsWithResults,
}) => {
  const [eventId, setEventId] = useState("333");

  return (
    <VStack>
      <SingleEventSelector
        title=""
        selectedEvent={eventId}
        onEventClick={setEventId}
        eventList={eventsWithResults}
      />
      <Results wcaId={wcaId} eventId={eventId} />
    </VStack>
  );
};

const Results: React.FC<{ wcaId: string; eventId: string }> = ({
  wcaId,
  eventId,
}) => {
  const api = useAPI();
  const { t } = useT();

  const { data: resultsQuery, isLoading } = api.useQuery(
    "get",
    "/v0/persons/{wca_id}/results",
    {
      params: { path: { wca_id: wcaId }, query: { event_id: eventId } },
    },
  );

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!resultsQuery) {
    return <Text>Failed fetching results</Text>;
  }

  return <ByCompetitionTable results={resultsQuery} t={t} />;
};

export default ResultsTab;
