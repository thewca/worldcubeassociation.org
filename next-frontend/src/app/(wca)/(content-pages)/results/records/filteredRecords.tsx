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
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useSearchParams } from "next/navigation";
import { route } from "nextjs-routes";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import {
  getRecordsQueryOptions,
  isRecordsHistory,
} from "@/lib/wca/results/records";

type FilterParams = {
  event: string;
  region: string;
  gender: string;
  show: string;
};

function getSelectedEventIds(params: URLSearchParams) {
  const requestedEventIds = params.get("event")?.split(",") ?? [];
  const selectedEventIds = _.intersection(WCA_EVENT_IDS, requestedEventIds);
  // History supports one event, so use WCA event order to choose consistently.
  return isRecordsHistory(params.get("show"))
    ? selectedEventIds.slice(0, 1)
    : selectedEventIds;
}

function getUpdatedFilterParams(
  search: string,
  changes: Partial<FilterParams>,
) {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(changes)) params.set(key, value);
  const selectedEventIds = getSelectedEventIds(params);
  if (selectedEventIds.length > 0)
    params.set("event", selectedEventIds.join(","));
  else params.delete("event");
  return params;
}

export default function FilteredRecords() {
  const api = useAPI();
  const searchParams = useSearchParams();
  const filters = {
    eventIds: getSelectedEventIds(searchParams),
    region: searchParams.get("region") ?? "world",
    gender: searchParams.get("gender") ?? "All",
    show: searchParams.get("show") ?? "mixed",
  };
  const { data, isFetching, isPlaceholderData, error } = useQuery({
    ...getRecordsQueryOptions(api, filters),
    placeholderData: keepPreviousData,
  });
  const updateFilters = (changes: Partial<FilterParams>) => {
    const params = getUpdatedFilterParams(window.location.search, changes);
    const url = route({
      pathname: "/results/records",
      query: Object.fromEntries(params),
    });

    window.history.replaceState(null, "", url);
  };
  const filterActions = {
    setSelectedEventIds: (eventIds: string[]) =>
      updateFilters({ event: eventIds.join(",") }),
    setRegion: (region: string) => updateFilters({ region: region || "world" }),
    setGender: (gender: string) => updateFilters({ gender }),
    setShow: (show: string) => updateFilters({ show }),
  };
  const { eventIds, show } = filters;
  const { t } = useT();
  const currentRecords = data?.records ?? {};
  const lng = useLocale();

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
      <RecordsFilterBox filterState={filters} filterActions={filterActions} />
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
