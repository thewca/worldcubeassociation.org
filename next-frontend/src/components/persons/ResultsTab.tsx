"use client";
import React, { useState } from "react";
import { Text, VStack } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { ByCompetitionTable } from "@/components/results/ResultsTable";
import { useT } from "@/lib/i18n/useI18n";
import EventSelector from "@/components/EventSelector";

interface ResultsTabProps {
  wcaId: string;
}

const ResultsTab: React.FC<ResultsTabProps> = ({ wcaId }) => {
  const api = useAPI();
  const { t } = useT();

  const [eventId, setEventId] = useState("333");

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

  return (
    <VStack>
      <EventSelector
        title=""
        selectedEvents={[eventId]}
        onEventClick={(e) => setEventId(e)}
        hideAllButton={true}
        hideClearButton={true}
      />
      <ByCompetitionTable results={resultsQuery} t={t} />
    </VStack>
  );
};

export default ResultsTab;
