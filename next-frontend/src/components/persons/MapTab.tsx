"use client";

import React from "react";
import { Text } from "@chakra-ui/react";
import Map from "@/components/map/Map";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";

interface MapTabProps {
  wcaId: string;
}

export default function MapTab({ wcaId }: MapTabProps) {
  const api = useAPI();
  const { t } = useT();

  const {
    data: competitions,
    isLoading,
    error,
  } = api.useQuery("get", "/v0/persons/{wca_id}/competitions", {
    params: { path: { wca_id: wcaId } },
  });

  if (error) {
    return <Text>{t("errors.next_frontend.title")}</Text>;
  }

  return <Map competitions={competitions ?? []} isLoading={isLoading} />;
}
