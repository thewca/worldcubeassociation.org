import {
  getRankingsFilters,
  getRankingsQueryOptions,
} from "@/lib/wca/results/rankings";
import {
  toURLSearchParams,
  type ResultsSearchParams,
} from "@/lib/wca/results/searchParams";
import { serverQueryApi } from "@/lib/wca/wcaAPI";
import {
  dehydrate,
  HydrationBoundary,
  noop,
  QueryClient,
} from "@tanstack/react-query";
import React, { Suspense } from "react";
import FilteredRankings from "@/app/(wca)/(content-pages)/results/rankings/filteredRankings";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";
import Loading from "@/components/ui/loading";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("results.rankings.title"),
  };
}

type RankingsPageProps = {
  searchParams: Promise<ResultsSearchParams>;
};

export default function RankingsPage({ searchParams }: RankingsPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <Rankings searchParams={searchParams} />
    </Suspense>
  );
}

async function Rankings({ searchParams }: RankingsPageProps) {
  const params = toURLSearchParams(await searchParams);
  const queryClient = new QueryClient();
  const options = getRankingsQueryOptions(
    serverQueryApi,
    getRankingsFilters(params),
  );
  await queryClient.query(options).catch(noop);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FilteredRankings />
    </HydrationBoundary>
  );
}
