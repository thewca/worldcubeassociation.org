"use client";

import React, { useMemo, useState, useTransition } from "react";
import { EventId } from "@/lib/wca/data/events";
import { Box, Center, Heading, Spinner, VStack } from "@chakra-ui/react";
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
  const [isPending, startTransition] = useTransition();
  // We are fetching all events at once so switching events doesn't fire another request
  const [event, setEvent] = useState(searchParams.event);

  const filterActions = useMemo(() => {
    const navigate = (params: Partial<FilterParams>) =>
      startTransition(() =>
        router.push(
          route({
            pathname: "/results/records",
            query: { ...searchParams, event, ...params },
          }),
        ),
      );

    return {
      setEvent: (event: string) => {
        setEvent(event as FilterParams["event"]);
        // Keep the URL in sync without refetching, so links that only change
        // another filter (e.g. clicking a region) keep the selected event
        const params = new URLSearchParams({ ...searchParams, event });
        window.history.replaceState(null, "", `?${params}`);
      },
      setRegion: (region: string) => navigate({ region }),
      setGender: (gender: string) => navigate({ gender }),
      setShow: (show: string) => navigate({ show }),
    };
  }, [router, searchParams, event]);

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
        filterState={{ ...searchParams, event }}
        filterActions={filterActions}
      />
      <Box position="relative" opacity={isPending ? 0.4 : 1}>
        {isPending && (
          <Center position="absolute" inset={0} zIndex={1}>
            <Spinner size="xl" position="sticky" top="50%" />
          </Center>
        )}
        <RecordsTable records={filteredRecords} show={show} />
      </Box>
    </VStack>
  );
}
