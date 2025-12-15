import { getRankings } from "@/lib/wca/results/rankings";
import { Alert, Container } from "@chakra-ui/react";
import React from "react";
import FilteredRankings from "@/app/(wca)/results/rankings/filteredRankings";
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

  const rankingsRequest = await getRankings({
    gender,
    region,
    show,
    eventId,
    type,
  });

  if (rankingsRequest.error) {
    return (
      <Alert.Root status="error">
        <Alert.Title>Error fetching Records</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <Container bg="bg">
      <FilteredRankings
        searchParams={{
          gender,
          region,
          event: eventId,
          rankingType: type,
          show,
        }}
        rankings={rankingsRequest.data.rankings}
        timestamp={rankingsRequest.data.timestamp}
      />
    </Container>
  );
}
