import { getRankings } from "@/lib/wca/results/rankings";
import { Container } from "@chakra-ui/react";
import React from "react";
import FilteredRankings from "@/app/(wca)/results/rankings/filteredRankings";
import { HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/query-core";

const GENDER_ALL = "All";
const SHOW_MIXED = "mixed";
const REGION_WORLD = "world";

export default async function RecordsPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
  params: Promise<{ eventId: string; type: string }>;
}) {
  const {
    gender = GENDER_ALL,
    region = REGION_WORLD,
    show = SHOW_MIXED,
  } = await searchParams;

  const { eventId, type } = await params;

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
        <FilteredRankings
          // We always fetch all events, so we get filtering for free on the frontend
          searchParams={{
            gender,
            region,
            show,
            event: eventId,
            rankingType: type,
          }}
        />
      </HydrationBoundary>
    </Container>
  );
}
