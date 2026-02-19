"use client";

import React, { useMemo } from "react";
import { Heading, VStack } from "@chakra-ui/react";
import { RankingsFilterBox } from "@/components/results/FilterBox";
import { useT } from "@/lib/i18n/useI18n";
import RankingsTable from "@/components/results/RankingsTable";
import { useRouter } from "next/navigation";
import { route } from "nextjs-routes";
import { components } from "@/types/openapi";

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

interface FilteredRecordsProps {
  rankings: components["schemas"]["ExtendedResult"][];
  timestamp: string;
  searchParams: FilterParams;
}

export default function FilteredRecords({
  rankings,
  timestamp,
  searchParams,
}: FilteredRecordsProps) {
  const router = useRouter();

  const { event, region, gender, show, rankingType } = searchParams;

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

  return (
    <VStack align="left" gap={4}>
      <Heading size="5xl">{t("results.rankings.title")}</Heading>
      {t("results.last_updated_html", { timestamp })}
      <RankingsFilterBox
        filterState={searchParams}
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
      <RankingsTable
        rankings={rankings}
        isAverage={rankingType === "average"}
        isByRegion={show === "by region"}
      />
    </VStack>
  );
}
