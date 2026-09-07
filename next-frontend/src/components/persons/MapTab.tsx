import React from "react";
import Map from "@/components/map/Map";
import OpenapiError from "@/components/ui/openapiError";
import { getPersonCompetitions } from "@/lib/wca/persons/getPersonCompetitions";
import { getT } from "@/lib/i18n/get18n";

interface MapTabProps {
  wcaId: string;
}

const MapTab = async ({ wcaId }: MapTabProps) => {
  const { t } = await getT();
  const {
    data: competitions,
    error,
    response,
  } = await getPersonCompetitions(wcaId);

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  return <Map competitions={competitions} />;
};

export default MapTab;
