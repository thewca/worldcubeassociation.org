"use client";

import React from "react";
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
import { getRecordsQueryOptions, getFilters } from "@/lib/wca/results/records";
import type { RecordsFilterParams } from "@/lib/wca/results/types";

function getUpdatedFilterParams(
  search: string,
  changes: Partial<RecordsFilterParams>,
) {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(changes)) params.set(key, value);
  const { eventIds } = getFilters(params);
  if (eventIds.length > 0) params.set("event", eventIds.join(","));
  else params.delete("event");
  return params;
}

export default function FilteredRecords() {
  const api = useAPI();
  const searchParams = useSearchParams();
  const filters = getFilters(searchParams);
  const { data, isFetching, isPlaceholderData, error } = useQuery({
    ...getRecordsQueryOptions(api, filters),
    placeholderData: keepPreviousData,
  });
  const updateFilters = (changes: Partial<RecordsFilterParams>) => {
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
