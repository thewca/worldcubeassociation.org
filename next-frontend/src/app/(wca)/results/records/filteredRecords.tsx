"use client";

import React, { useMemo, useState } from "react";
import { EventId } from "@/lib/wca/data/events";
import { Heading, VStack } from "@chakra-ui/react";
import RecordsTable from "@/components/results/RecordsTable";
import { RecordsFilterBox } from "@/components/results/FilterBox";
import { useT } from "@/lib/i18n/useI18n";
import { components } from "@/types/openapi";
import { useRouter } from "next/navigation";
import { route } from "nextjs-routes";

type FilterParams = {
  event: EventId | "all events";
  region: string;
  gender: string;
  show: string;
};

interface filteredRecordsProps {
  searchParams: FilterParams;
  records: components["schemas"]["RecordByEvent"];
  timestamp: string;
}

export default function FilteredRecords({
  searchParams,
  timestamp,
  records,
}: filteredRecordsProps) {
  const router = useRouter();
  // We are fetching all events at once so switching events doesn't fire another request
  const [event, setEvent] = useState(searchParams.event);

  const filterActions = useMemo(
    () => ({
      setEvent: (event: string) => setEvent(event),
      setRegion: (region: string) =>
        router.push(
          route({
            pathname: "/results/records",
            query: { ...searchParams, region },
          }),
        ),
      setGender: (gender: string) =>
        router.push(
          route({
            pathname: "/results/records",
            query: { ...searchParams, gender },
          }),
        ),
      setShow: (show: string) =>
        router.push(
          route({
            pathname: "/results/records",
            query: { ...searchParams, show },
          }),
        ),
    }),
    [router, searchParams],
  );

  const { show } = searchParams;

  const { t } = useT();

  const filteredRecords =
    event === "all events"
      ? records
      : {
          [event as EventId]: records[event],
        };

  return (
    <VStack align="left" gap={4}>
      <Heading size="5xl">{t("results.records.title")}</Heading>
      {t("results.last_updated_html", { timestamp })}
      <RecordsFilterBox
        filterState={searchParams}
        filterActions={filterActions}
      />
      <RecordsTable records={filteredRecords} show={show} />
    </VStack>
  );
}
