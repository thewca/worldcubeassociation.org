import { getRecords } from "@/lib/wca/results/records";
import { Container } from "@chakra-ui/react";
import React from "react";
import FilteredRecords from "@/app/(wca)/results/records/filteredRecords";
import { HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/query-core";

const GENDER_ALL = "All";
const EVENTS_ALL = "all events";
const SHOW_MIXED = "mixed";
const REGION_WORLD = "world";

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const {
    gender = GENDER_ALL,
    region = REGION_WORLD,
    show = SHOW_MIXED,
  } = await searchParams;

  const queryClient = new QueryClient();

  const isHistory = show === "history";

  await queryClient.prefetchQuery({
    queryFn: () =>
      getRecords({
        gender,
        region,
        show: isHistory ? "history" : "mixed",
      }) // We need to take out the response as Next can't serialize it
        .then((res) => ({
          data: res.data,
          error: res.error,
        })),
    queryKey: ["records", region, gender, isHistory],
  });

  return (
    <Container bg="bg">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <FilteredRecords
          // We always fetch all events, so we get filtering for free on the frontend
          searchParams={{ gender, region, show, event: EVENTS_ALL }}
        />
      </HydrationBoundary>
    </Container>
  );
}
