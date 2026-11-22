"use client";
import React, { useState } from "react";
import { Text } from "@chakra-ui/react";
import { TFunction } from "i18next";
import useAPI from "@/lib/wca/useAPI";
import PsychsheetTable from "@/components/competitions/PsychsheetTable";
import Loading from "@/components/ui/loading";
import type { components, paths } from "@/types/openapi";

type PsychSheetSortBy = components["schemas"]["PsychSheet"]["sort_by"];
export type PsychSheetRankingPeriod = NonNullable<
  NonNullable<
    paths["/v0/competitions/{competitionId}/psych-sheet/{eventId}"]["get"]["parameters"]["query"]
  >["ranking_period"]
>;

export default function PsychSheet({
  competitionId,
  eventId,
  rankingPeriod,
  setRankingPeriod,
  t,
}: {
  competitionId: string;
  eventId: string;
  rankingPeriod: PsychSheetRankingPeriod;
  setRankingPeriod: (period: PsychSheetRankingPeriod) => void;
  t: TFunction;
}) {
  // Until the user picks a column, the backend sorts by the event's
  // recommended format, so 333bf and friends open on single rather than average.
  const [sortBy, setSortBy] = useState<PsychSheetSortBy>();

  const api = useAPI();

  const allTimeQuery = api.useQuery(
    "get",
    "/v0/competitions/{competitionId}/psych-sheet/{eventId}",
    {
      params: {
        path: { competitionId, eventId },
        query: { sort_by: sortBy, ranking_period: "all_time" },
      },
    },
  );
  const recentQuery = api.useQuery(
    "get",
    "/v0/competitions/{competitionId}/psych-sheet/{eventId}",
    {
      params: {
        path: { competitionId, eventId },
        query: { sort_by: sortBy, ranking_period: "last_12_months" },
      },
    },
  );

  if (allTimeQuery.isError) {
    return <Text p={4}>{t("competitions.registration_v2.errors.-1001")}</Text>;
  }

  if (allTimeQuery.isPending) {
    return <Loading />;
  }

  return (
    <>
      <Text p={4} textStyle="sm" whiteSpace="normal">
        {t(
          "competitions.registration_v2.list.psychsheets.ranking_comparison_hint",
        )}
      </Text>
      {recentQuery.isError && (
        <Text p={4} textStyle="sm" whiteSpace="normal">
          {t(
            "competitions.registration_v2.list.psychsheets.recent_rankings_unavailable",
          )}
        </Text>
      )}
      {(allTimeQuery.isFetching || recentQuery.isFetching) && <Loading />}
      <PsychsheetTable
        allTimePsychSheet={allTimeQuery.data}
        recentPsychSheet={recentQuery.isSuccess ? recentQuery.data : undefined}
        eventId={eventId}
        sortBy={allTimeQuery.data.sort_by}
        t={t}
        setSortBy={setSortBy}
        rankingPeriod={rankingPeriod}
        setRankingPeriod={setRankingPeriod}
      />
    </>
  );
}
