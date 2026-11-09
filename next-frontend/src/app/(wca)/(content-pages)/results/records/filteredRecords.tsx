"use client";

import React from "react";
import _ from "lodash";
import { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import {
  Alert,
  Box,
  Circle,
  Collapsible,
  Float,
  Heading,
  IconButton,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuFilter } from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";
import Loading from "@/components/ui/loading";
import RecordsTable from "@/components/results/RecordsTable";
import { RecordsFilterBox } from "@/components/results/FilterBox";
import { useT } from "@/lib/i18n/useI18n";
import { getMediumDateString } from "@/lib/wca/dates";
import { useSearchParams } from "next/navigation";
import { route } from "nextjs-routes";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import {
  FilterParams,
  getFilters,
  getRecordsQueryOptions,
} from "@/lib/wca/results/records";

export default function FilteredRecords() {
  const api = useAPI();
  const searchParams = useSearchParams();
  const filters = getFilters(searchParams);
  const { data, isFetching, isPlaceholderData, error } = useQuery({
    ...getRecordsQueryOptions(api, filters),
    placeholderData: keepPreviousData,
  });
  const updateFilters = (changes: Partial<FilterParams>) => {
    const { event, region, gender, view, groupBy, display } = {
      ...getFilters(new URLSearchParams(window.location.search)),
      ...changes,
    };
    const url = route({
      pathname: "/results/records",
      query: {
        event: event && event !== "all events" ? event : undefined,
        region: region === "world" ? undefined : region,
        gender: gender === "All" ? undefined : gender,
        view: view === "current" ? undefined : view,
        group_by: groupBy === "event" ? undefined : groupBy,
        display: display === "standard" ? undefined : display,
      },
    });

    window.history.replaceState(null, "", url);
  };
  const filterActions = {
    setEvents: (events: string[]) => updateFilters({ event: events.join(",") }),
    toggleEvent: (event: string) => {
      const requestedEvents =
        new URLSearchParams(window.location.search).get("event")?.split(",") ??
        [];
      const currentEvents = _.intersection(WCA_EVENT_IDS, requestedEvents);
      const events = currentEvents.includes(event)
        ? currentEvents.filter((selected) => selected !== event)
        : [...currentEvents, event];
      updateFilters({ event: events.join(",") });
    },
    setRegion: (region: string) => updateFilters({ region: region || "world" }),
    setGender: (gender: string) => updateFilters({ gender }),
    setGroupBy: (groupBy: FilterParams["groupBy"]) =>
      updateFilters({ groupBy }),
    setDisplay: (display: FilterParams["display"]) =>
      updateFilters({ display }),
  };
  const { event, view, groupBy, display } = filters;
  const setView = (value: string) => {
    if (value === "current" || value === "history") {
      updateFilters({ view: value });
    }
  };
  const { t } = useT();
  const currentRecords = data?.records ?? {};
  const selectedEvents = _.intersection(WCA_EVENT_IDS, event.split(","));
  const hasActiveFilters =
    selectedEvents.length > 0 ||
    filters.region !== "world" ||
    filters.gender !== "All";
  const filteredRecords =
    selectedEvents.length === 0
      ? currentRecords
      : _.pick(currentRecords, selectedEvents);

  return (
    <VStack align="stretch" gap={4}>
      <Heading size={{ base: "3xl", md: "5xl" }}>
        {t("results.records.title")}
      </Heading>
      {data && (
        <Text fontSize="sm" color="fg.muted">
          {t("results.last_updated_html", {
            timestamp: getMediumDateString(data.timestamp),
          })}
        </Text>
      )}
      <Collapsible.Root overflowPadding>
        <Tabs.Root
          value={view}
          onValueChange={({ value }) => setView(value)}
          variant="line"
        >
          <Tabs.List aria-label={t("results.records.title")}>
            <Tabs.Trigger value="current">
              {t("results.records.current")}
            </Tabs.Trigger>
            <Tabs.Trigger value="history">
              {t("results.selector_elements.show_selector.history")}
            </Tabs.Trigger>
            <Tooltip content={t("common.filter")}>
              <Collapsible.Trigger asChild>
                <IconButton
                  aria-label={t("common.filter")}
                  aria-description={
                    hasActiveFilters
                      ? t("results.records.filters_applied")
                      : undefined
                  }
                  variant="ghost"
                  colorPalette={hasActiveFilters ? "blue" : undefined}
                  color={hasActiveFilters ? "colorPalette.fg" : undefined}
                  size="sm"
                  marginStart="auto"
                  alignSelf="center"
                  position="relative"
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
            </Tooltip>
          </Tabs.List>
        </Tabs.Root>
        <Collapsible.Content pt="4" pb="3" mb="-2">
          <RecordsFilterBox
            filterState={{ ...filters, events: selectedEvents }}
            filterActions={filterActions}
          />
        </Collapsible.Content>
      </Collapsible.Root>
      <VStack align="stretch" gap="4" pt="2">
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
              display={display}
            />
          )
        )}
      </VStack>
    </VStack>
  );
}
