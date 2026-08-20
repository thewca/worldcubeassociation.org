"use client";

import React from "react";
import { Text } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import Map from "@/components/map/Map";
import Loading from "@/components/ui/loading";

interface MapTabProps {
  wcaId: string;
}

const MapTab: React.FC<MapTabProps> = ({ wcaId }) => {
  const api = useAPI();

  const { data: competitionQuery, isLoading } = api.useQuery(
    "get",
    "/v0/persons/{wca_id}/competitions",
    {
      params: { path: { wca_id: wcaId } },
    },
  );

  if (isLoading) {
    return <Loading />;
  }

  if (!competitionQuery) {
    return <Text>Failed fetching competitions</Text>;
  }

  return <Map competitions={competitionQuery} />;
};

export default MapTab;
