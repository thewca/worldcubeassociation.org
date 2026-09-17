"use client";
import React, { useState } from "react";
import { Text } from "@chakra-ui/react";
import { keepPreviousData } from "@tanstack/react-query";
import { TFunction } from "i18next";
import useAPI from "@/lib/wca/useAPI";
import PsychsheetTable from "@/components/competitions/PsychsheetTable";
import Loading from "@/components/ui/loading";
import type { components } from "@/types/openapi";

type PsychSheetSortBy = components["schemas"]["PsychSheet"]["sort_by"];

export default function Psychsheet({
  competitionId,
  eventId,
  t,
}: {
  competitionId: string;
  eventId: string;
  t: TFunction;
}) {
  // Until the user picks a column, the backend sorts by the event's
  // recommended format, so 333bf and friends open on single rather than average.
  const [sortBy, setSortBy] = useState<PsychSheetSortBy>();

  const api = useAPI();

  const { data, isPending, isFetching, isError } = api.useQuery(
    "get",
    "/v0/competitions/{competitionId}/psych-sheet/{eventId}",
    {
      params: {
        path: { competitionId, eventId },
        query: sortBy ? { sort_by: sortBy } : {},
      },
    },
    { placeholderData: keepPreviousData },
  );

  if (isError) {
    return <Text p={4}>{t("competitions.registration_v2.errors.-1001")}</Text>;
  }

  if (isPending) {
    return <Loading />;
  }

  return (
    <>
      {isFetching && <Loading />}
      <PsychsheetTable
        psychSheet={data}
        eventId={eventId}
        sortBy={data.sort_by}
        t={t}
        setSortBy={setSortBy}
      />
    </>
  );
}
