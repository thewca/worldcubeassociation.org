import { getRankings } from "@/lib/wca/results/rankings";

import React, { Suspense } from "react";
import FilteredRankings from "@/app/(wca)/(content-pages)/results/rankings/filteredRankings";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import Loading from "@/components/ui/loading";
import {
  DEFAULT_RANKINGS_FILTERS,
  getRankingsShow,
} from "@/lib/wca/results/rankingsFilters";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("results.rankings.title"),
  };
}

type RankingsPageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default function RankingsPage({ searchParams }: RankingsPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <Rankings searchParams={searchParams} />
    </Suspense>
  );
}

async function Rankings({ searchParams }: RankingsPageProps) {
  const {
    gender = DEFAULT_RANKINGS_FILTERS.gender,
    region = DEFAULT_RANKINGS_FILTERS.region,
    show = DEFAULT_RANKINGS_FILTERS.show,
    event_id: eventId = DEFAULT_RANKINGS_FILTERS.event,
    type = DEFAULT_RANKINGS_FILTERS.rankingType,
  } = await searchParams;

  const { data, error, response } = await getRankings({
    gender,
    region,
    show,
    eventId,
    type,
  });

  const { t } = await getT();

  if (error) return <OpenapiError response={response} t={t} />;

  return (
    <>
      <FilteredRankings
        searchParams={{
          gender,
          region,
          event: eventId,
          rankingType: type,
          show: getRankingsShow(show),
        }}
        rankings={data.rankings}
        timestamp={data.timestamp}
      />
    </>
  );
}
