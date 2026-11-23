"use client";

import React from "react";
import { Alert, Heading, Tabs, Text, VStack } from "@chakra-ui/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Loading from "@/components/ui/loading";
import { RankingsFilterBox } from "@/components/results/FilterBox";
import ResultsFilterPanel from "@/components/results/ResultsFilterPanel";
import { useT } from "@/lib/i18n/useI18n";
import { getMediumDateString } from "@/lib/wca/dates";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import RankingsTable from "@/components/results/RankingsTable";
import { useSearchParams } from "next/navigation";
import { route } from "nextjs-routes";
import useAPI from "@/lib/wca/useAPI";
import {
  GENDER_ALL,
  getRankingsFilters,
  getRankingsQueryOptions,
  REGION_WORLD,
} from "@/lib/wca/results/rankings";
import type { RankingsFilters } from "@/lib/wca/results/types";

function createUrl(params: RankingsFilters) {
  const { event, region, gender, show, rankingType } = params;
  return route({
    pathname: "/results/rankings",
    query: {
      event_id: event === "333" ? undefined : event,
      region: region === REGION_WORLD ? undefined : region,
      gender: gender === GENDER_ALL ? undefined : gender,
      show: show === "100 persons" ? undefined : show,
      type: rankingType === "single" ? undefined : rankingType,
    },
  });
}

export default function FilteredRankings() {
  const api = useAPI();
  const searchParams = useSearchParams();
  const filters = getRankingsFilters(searchParams);
  const { data, isFetching, isPlaceholderData, error } = useQuery({
    ...getRankingsQueryOptions(api, filters),
    placeholderData: keepPreviousData,
  });
  const updateFilters = (changes: Partial<RankingsFilters>) => {
    const url = createUrl({
      ...getRankingsFilters(new URLSearchParams(window.location.search)),
      ...changes,
    });

    window.history.replaceState(null, "", url);
  };
  const filterActions = {
    setEvent: (event: string) =>
      updateFilters(
        event === "333mbf" ? { event, rankingType: "single" } : { event },
      ),
    setRegion: (region: string) =>
      updateFilters({ region: region || REGION_WORLD }),
    setGender: (gender: string) => updateFilters({ gender }),
    setShow: (show: string) => updateFilters({ show }),
    setType: (rankingType: string) => updateFilters({ rankingType }),
  };

  const { event, region, gender, show, rankingType } = filters;
  const { t } = useT();
  const lng = useLocale();
  const isByRegion = show === "by region";
  const hasRegionFilter =
    !isByRegion && Boolean(region) && region !== REGION_WORLD;
  const hasActiveFilters =
    hasRegionFilter ||
    event !== "333" ||
    gender !== GENDER_ALL ||
    rankingType !== "single";

  return (
    <VStack align="left" gap={2}>
      <Heading size={{ base: "3xl", md: "5xl" }}>
        {t("results.rankings.title")}
      </Heading>
      {data && (
        <Text textStyle={{ base: "xs", md: "body" }} color="fg.muted">
          {t("results.last_updated_html", {
            timestamp: getMediumDateString(data.timestamp, lng),
          })}
        </Text>
      )}
      <ResultsFilterPanel
        hasActiveFilters={hasActiveFilters}
        tabs={
          <Tabs.Root
            value={show}
            onValueChange={({ value }) => filterActions.setShow(value)}
            variant="line"
            minW={0}
            overflowX="auto"
          >
            <Tabs.List
              aria-label={t("results.rankings.title")}
              borderBottomWidth="0"
            >
              <Tabs.Trigger value="100 persons">
                {t("results.selector_elements.show_selector.persons")}
              </Tabs.Trigger>
              <Tabs.Trigger value="100 results">
                {t("results.selector_elements.show_selector.results")}
              </Tabs.Trigger>
              <Tabs.Trigger value="by region">
                {t("results.selector_elements.show_selector.by_region")}
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        }
      >
        <RankingsFilterBox
          filterState={filters}
          filterActions={filterActions}
        />
      </ResultsFilterPanel>
      {isFetching && <Loading />}
      {error ? (
        <Alert.Root status="error">
          <Alert.Title>{t("results.rankings.load_error")}</Alert.Title>
        </Alert.Root>
      ) : (
        data &&
        !isPlaceholderData && (
          <RankingsTable
            rankings={data.rankings}
            isAverage={rankingType === "average"}
            isByRegion={isByRegion}
          />
        )
      )}
    </VStack>
  );
}
