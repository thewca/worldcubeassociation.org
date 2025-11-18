"use client";

import useAPI from "@/lib/wca/useAPI";
import React, { useState } from "react";
import { Text } from "@chakra-ui/react";

export default function ResultsTable({ wcaId }: { wcaId: string }) {
  const api = useAPI();

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

  return <Text>{JSON.stringify(resultsQuery, null, 2)}</Text>;
}
