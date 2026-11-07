import { getRankings } from "@/lib/wca/results/rankings";

import React, { Suspense } from "react";
import FilteredRankings from "@/app/(wca)/(content-pages)/results/rankings/filteredRankings";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import Loading from "@/components/ui/loading";

const GENDER_ALL = "All";
const SHOW_100_PERSONS = "100 persons";
const REGION_WORLD = "world";

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
    gender = GENDER_ALL,
    region = REGION_WORLD,
    show = SHOW_100_PERSONS,
    event_id: eventId = "333",
    type = "single",
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
          show,
        }}
        rankings={data.rankings}
        timestamp={data.timestamp}
      />
    </>
  );
}
