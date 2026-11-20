"use client";

import React from "react";
import {
  Alert,
  Box,
  Circle,
  Collapsible,
  Float,
  Heading,
  HStack,
  IconButton,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import { LuFilter } from "react-icons/lu";
import Loading from "@/components/ui/loading";
import RecordsTable from "@/components/results/RecordsTable";
import { RecordsFilterBox } from "@/components/results/FilterBox";
import { useT } from "@/lib/i18n/useI18n";
import { getMediumDateString } from "@/lib/wca/dates";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useSearchParams } from "next/navigation";
import { route } from "nextjs-routes";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import {
  GENDER_ALL,
  getFilters,
  getRecordsQueryOptions,
  REGION_WORLD,
} from "@/lib/wca/results/records";
import type { RecordsFilters } from "@/lib/wca/results/types";

export default function FilteredRecords() {
  const api = useAPI();
  const searchParams = useSearchParams();
  const filters = getFilters(searchParams);
  const { data, isFetching, isPlaceholderData, error } = useQuery({
    ...getRecordsQueryOptions(api, filters),
    placeholderData: keepPreviousData,
  });
  const updateFilters = (changes: Partial<RecordsFilters>) => {
    const { eventIds, region, gender, view, groupBy } = {
      ...getFilters(new URLSearchParams(window.location.search)),
      ...changes,
    };
    const url = route({
      pathname: "/results/records",
      query: {
        event:
          view === "history" ? eventIds[0] : eventIds.join(",") || undefined,
        region: region === REGION_WORLD ? undefined : region,
        gender: gender === GENDER_ALL ? undefined : gender,
        view: view === "history" ? view : undefined,
        group_by: groupBy === "type" ? groupBy : undefined,
      },
    });

    window.history.replaceState(null, "", url);
  };
  const filterActions = {
    setSelectedEventIds: (eventIds: string[]) => updateFilters({ eventIds }),
    setRegion: (region: string) =>
      updateFilters({ region: region || REGION_WORLD }),
    setGender: (gender: string) => updateFilters({ gender }),
    setGroupBy: (groupBy: RecordsFilters["groupBy"]) =>
      updateFilters({ groupBy }),
  };
  const { eventIds, view, groupBy } = filters;
  const { t } = useT();
  const currentRecords = data?.records ?? {};
  const lng = useLocale();
  const hasActiveFilters =
    eventIds.length > 0 ||
    filters.region !== REGION_WORLD ||
    filters.gender !== GENDER_ALL;

  const filteredRecords =
    eventIds.length === 0
      ? currentRecords
      : Object.fromEntries(
          eventIds.map((eventId) => [eventId, currentRecords[eventId] ?? []]),
        );

  return (
    <VStack align="left" gap={2}>
      <Heading size={{ base: "3xl", md: "5xl" }}>
        {t("results.records.title")}
      </Heading>
      {data &&
        t("results.last_updated_html", {
          timestamp: getMediumDateString(data.timestamp, lng),
        })}
      <Collapsible.Root width="full" overflowPadding lazyMount>
        <HStack
          justify="space-between"
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Tabs.Root
            value={view}
            onValueChange={({ value }) =>
              updateFilters({
                view: value === "history" ? "history" : "current",
              })
            }
            variant="line"
          >
            <Tabs.List
              aria-label={t("results.records.title")}
              borderBottomWidth="0"
            >
              <Tabs.Trigger value="current">
                {t("results.records.current")}
              </Tabs.Trigger>
              <Tabs.Trigger value="history">
                {t("results.selector_elements.show_selector.history")}
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
          <RecordsFilterToggle hasActiveFilters={hasActiveFilters} />
        </HStack>
        <Collapsible.Content>
          <Box py={3}>
            <RecordsFilterBox
              filterState={filters}
              filterActions={filterActions}
            />
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
      {isFetching && <Loading />}
      {error ? (
        <Alert.Root status="error">
          <Alert.Title>{t("results.records.load_error")}</Alert.Title>
        </Alert.Root>
      ) : (
        data &&
        !isPlaceholderData && (
          <RecordsTable
            records={filteredRecords}
            view={view}
            groupBy={groupBy}
          />
        )
      )}
    </VStack>
  );
}

function RecordsFilterToggle({
  hasActiveFilters,
}: {
  hasActiveFilters: boolean;
}) {
  const { t } = useT();

  return (
    <Collapsible.Trigger asChild>
      <IconButton
        aria-label={t("common.filter")}
        aria-description={
          hasActiveFilters ? t("results.records.filters_applied") : undefined
        }
        variant="ghost"
        colorPalette={hasActiveFilters ? "blue" : undefined}
        color={hasActiveFilters ? "colorPalette.fg" : undefined}
        size="sm"
      >
        <Box as="span" position="relative" display="inline-flex">
          <LuFilter />
          {hasActiveFilters && (
            <Float placement="top-end" pointerEvents="none">
              <Circle
                as="span"
                size="1.5"
                bg="colorPalette.solid"
                outlineWidth="2px"
                outlineStyle="solid"
                outlineColor="bg"
                aria-hidden="true"
              />
            </Float>
          )}
        </Box>
      </IconButton>
    </Collapsible.Trigger>
  );
}
