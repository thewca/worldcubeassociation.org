"use client";

import React from "react";
import _ from "lodash";
import { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import { Alert, Heading, VStack } from "@chakra-ui/react";
import Loading from "@/components/ui/loading";
import RecordsTable from "@/components/results/RecordsTable";
import { RecordsFilterBox } from "@/components/results/FilterBox";
import { useT } from "@/lib/i18n/useI18n";
import { getMediumDateString } from "@/lib/wca/dates";
import { useSearchParams } from "next/navigation";
import { route } from "nextjs-routes";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import { getRecordsQueryOptions } from "@/lib/wca/results/records";

type FilterParams = {
  event: string;
  region: string;
  gender: string;
  show: string;
};

export default function FilteredRecords() {
  const api = useAPI();
  const searchParams = useSearchParams();
  const filters: FilterParams = {
    event: searchParams.get("event") ?? "all events",
    region: searchParams.get("region") ?? "world",
    gender: searchParams.get("gender") ?? "All",
    show: searchParams.get("show") ?? "mixed",
  };
  const { data, isFetching, isPlaceholderData, error } = useQuery({
    ...getRecordsQueryOptions(api, filters),
    placeholderData: keepPreviousData,
  });
  const updateFilters = (changes: Partial<FilterParams>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (key === "event" && !value) params.delete(key);
      else params.set(key, value);
    }
    const url = route({
      pathname: "/results/records",
      query: Object.fromEntries(params),
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
    setShow: (show: string) => updateFilters({ show }),
  };
  const { event, show } = filters;
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
          <RecordsTable records={filteredRecords} show={show} />
        )
      )}
    </VStack>
  );
}
