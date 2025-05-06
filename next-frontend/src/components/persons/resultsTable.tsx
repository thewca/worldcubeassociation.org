"use client";

import useAPI from "@/lib/wca/useAPI";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Text } from "@chakra-ui/react";

export default function ResultsTable({ wcaId }: { wcaId: string }) {
  const api = useAPI();

  const [eventId] = useState("333");

  const { data: resultsQuery, isLoading } = useQuery({
    queryFn: () =>
      api.GET("/persons/{wca_id}/results", {
        params: { path: { wca_id: wcaId }, query: { event_id: eventId } },
      }),
    queryKey: ["person-results", eventId, wcaId],
  });

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!resultsQuery?.data) {
    return <Text>Failed fetching results</Text>;
  }

  return <Text>{JSON.stringify(resultsQuery.data, null, 2)}</Text>;
}
