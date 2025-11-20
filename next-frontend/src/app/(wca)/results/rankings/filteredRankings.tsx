"use client";

import React, { useMemo } from "react";
import useAPI from "@/lib/wca/useAPI";
import { Alert, Heading, VStack } from "@chakra-ui/react";
import Loading from "@/components/ui/loading";
import { RankingsFilterBox } from "@/components/results/FilterBox";
import { useT } from "@/lib/i18n/useI18n";
import RankingsTable from "@/components/results/RankingsTable";
import { useRouter, useSearchParams } from "next/navigation";
import { route } from "nextjs-routes";

type FilterParams = {
  event: string;
  region: string;
  gender: string;
  show: string;
  rankingType: string;
};

function createUrl(params: FilterParams) {
  const { event, region, gender, show, rankingType } = params;
  return route({
    pathname: "/results/rankings",
    query: { event_id: event, region, gender, show, type: rankingType },
  });
}

export default function FilteredRecords() {
  const searchParams = useSearchParams();

  const router = useRouter();

  const filterState = useMemo(() => {
    return {
      gender: searchParams.get("gender") ?? "All",
      region: searchParams.get("region") ?? "world",
      show: searchParams.get("show") ?? "100 persons",
      event: searchParams.get("event_id") ?? "333",
      rankingType: searchParams.get("type") ?? "single",
    };
  }, [searchParams]);

  const { event, region, gender, show, rankingType } = filterState;

  const filterActions = useMemo(
    () => ({
      setEvent: (event: string) => {
        if (event === "333mbf") {
          router.replace(
            createUrl({
              event,
              region,
              gender,
              show,
              rankingType: "single",
            }),
          );
        } else {
          router.replace(
            createUrl({
              event,
              region,
              gender,
              show,
              rankingType,
            }),
          );
        }
      },
      setRegion: (region: string) =>
        router.replace(
          createUrl({
            event,
            region,
            gender,
            show,
            rankingType,
          }),
        ),
      setGender: (gender: string) =>
        router.replace(
          createUrl({
            event,
            region,
            gender,
            show,
            rankingType,
          }),
        ),
      setShow: (show: string) =>
        router.replace(
          createUrl({
            event,
            region,
            gender,
            show,
            rankingType,
          }),
        ),
      setType: (rankingType: string) =>
        router.replace(
          createUrl({
            event,
            region,
            gender,
            show,
            rankingType,
          }),
        ),
    }),
    [event, gender, rankingType, region, router, show],
  );

  const { t } = useT();

  const api = useAPI();

  const { data, isFetching, isError } = api.useQuery(
    "get",
    "/v0/results/rankings/{event_id}/{type}",
    {
      params: {
        path: { event_id: event, type: rankingType },
        query: { region, gender, show: show },
      },
    },
    {
      refetchOnMount: false,
    },
  );

  if (isError) {
    return (
      <Alert.Root status="error">
        <Alert.Title>Error fetching Records</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <VStack align="left" gap={4}>
      <Heading size="5xl">{t("results.rankings.title")}</Heading>
      {t("results.last_updated_html", { timestamp: data?.timestamp })}
      <RankingsFilterBox
        filterState={filterState}
        filterActions={filterActions}
        valueLabelMap={{
          single: t("results.selector_elements.type_selector.single"),
          average: t("results.selector_elements.type_selector.average"),
          All: t("results.selector_elements.gender_selector.gender_all"),
          Male: t("results.selector_elements.gender_selector.male"),
          Female: t("results.selector_elements.gender_selector.female"),
          "100 persons": t("results.selector_elements.show_selector.persons"),
          "100 results": t("results.selector_elements.show_selector.results"),
          "by region": t("results.selector_elements.show_selector.by_region"),
        }}
      />
      {isFetching ? (
        <Loading />
      ) : (
        <RankingsTable
          rankings={data!.rankings}
          isAverage={rankingType === "average"}
          isByRegion={show === "by region"}
        />
      )}
    </VStack>
  );
}
