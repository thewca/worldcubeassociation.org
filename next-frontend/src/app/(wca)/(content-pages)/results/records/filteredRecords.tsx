"use client";

import React from "react";
import _ from "lodash";
import { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import { Alert, Heading, Tabs, VStack } from "@chakra-ui/react";
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
    const { groupBy, ...params } = {
      ...getFilters(new URLSearchParams(window.location.search)),
      ...changes,
    };
    const url = route({
      pathname: "/results/records",
      query: { ...params, group_by: groupBy },
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
  const filteredRecords =
    selectedEvents.length === 0
      ? currentRecords
      : _.pick(currentRecords, selectedEvents);

  return (
    <VStack align="left" gap={2}>
      <Heading size={{ base: "3xl", md: "5xl" }}>
        {t("results.records.title")}
      </Heading>
      {data &&
        t("results.last_updated_html", {
          timestamp: getMediumDateString(data.timestamp),
        })}
      <Tabs.Root
        value={view}
        onValueChange={({ value }) => setView(value)}
        variant="line"
        width="full"
      >
        <Tabs.List aria-label={t("results.records.title")}>
          <Tabs.Trigger value="current">
            {t("results.records.current")}
          </Tabs.Trigger>
          <Tabs.Trigger value="history">
            {t("results.selector_elements.show_selector.history")}
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
      <RecordsFilterBox
        filterState={{ ...filters, events: selectedEvents }}
        filterActions={filterActions}
      />
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
            // TODO: clean up this prop
            show={
              view === "history"
                ? "mixed history"
                : groupBy === "type"
                  ? "separate"
                  : display === "compact"
                    ? "slim"
                    : "mixed"
            }
          />
        )
      )}
    </VStack>
  );
}
