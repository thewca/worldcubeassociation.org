"use client";
import React, { useState } from "react";
import { Text } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { ByCompetitionTable } from "@/components/results/ResultsTable";
import { useT } from "@/lib/i18n/useI18n";

interface ResultsTabProps {
  wcaId: string;
}

const ResultsTab: React.FC<ResultsTabProps> = ({ wcaId }) => {
  const api = useAPI();
  const { t } = useT();

  const [eventId] = useState("333");

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
