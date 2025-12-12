import { getRankings } from "@/lib/wca/results/rankings";
import { Container } from "@chakra-ui/react";
import React from "react";
import FilteredRankings from "@/app/(wca)/results/rankings/filteredRankings";
import { HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/query-core";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";

const GENDER_ALL = "All";
const SHOW_100_PERSONS = "100 persons";
const REGION_WORLD = "world";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("results.rankings.title"),
  };
}

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const {
    gender = GENDER_ALL,
    region = REGION_WORLD,
    show = SHOW_100_PERSONS,
    event_id: eventId = "333",
    type = "single",
  } = await searchParams;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryFn: () =>
      getRankings({
        gender,
        region,
        show,
        eventId,
        type,
      }) // We need to take out the response as Next can't serialize it
        .then((res) => ({
          data: res.data,
          error: res.error,
        })),
    queryKey: ["rankings", region, gender, show, eventId, type],
  });

  return (
    <Container bg="bg">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <FilteredRankings />
      </HydrationBoundary>
    </Container>
  );
}
