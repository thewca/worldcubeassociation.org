"use client";

import { Box, Heading, Table, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useOnInView } from "react-intersection-observer";
import { components } from "@/types/openapi";
import _ from "lodash";
import { DateTime } from "luxon";
import {
  HistoryRow,
  MixedRecordsRow,
  SeparateRecordsRow,
} from "@/components/results/RecordsRow";
import { useT } from "@/lib/i18n/useI18n";
import events, { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import EventIcon from "@/components/EventIcon";
import type { RecordsFilters } from "@/lib/wca/results/types";

type WrapperTableProps = Pick<RecordsFilters, "view" | "groupBy"> & {
  records: components["schemas"]["RecordByEvent"];
};

interface RecordsTableProps {
  records: components["schemas"]["Record"][];
}

interface SeparateRecordsTableProps {
  recordsByType: {
    single: components["schemas"]["Record"][];
    average: components["schemas"]["Record"][];
  };
}

export default function RecordsTable({
  records,
  view,
  groupBy,
}: WrapperTableProps) {
  if (view === "history") {
    // Preserve the legacy Mixed History order for records with the same date.
    const sortedRecords = _.orderBy(
      WCA_EVENT_IDS.toReversed().flatMap((eventId) => records[eventId] ?? []),
      (record) => DateTime.fromISO(record.start_date).toMillis(),
      "desc",
    );

    return <HistoryTable records={sortedRecords} />;
  }

  if (groupBy === "event") {
    return (
      <VStack align="stretch" gap={6}>
        {WCA_EVENT_IDS.map((eventId) => {
          const recordsByEvent = records[eventId];

          return (
            recordsByEvent && (
              <VStack key={eventId} align="stretch">
                <Heading
                  size={{ base: "xl", md: "2xl" }}
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <EventIcon eventId={eventId} flexShrink={0} />
                  {events.byId[eventId].name}
                </Heading>
                <MixedRecordsTable records={recordsByEvent} />
              </VStack>
            )
          );
        })}
      </VStack>
    );
  }

  const allRecords = WCA_EVENT_IDS.flatMap((eventId) =>
    (records[eventId] ?? []).toReversed(),
  );
  const average = allRecords.filter((record) => record.type === "average");
  const single = allRecords.filter((record) => record.type === "single");

  return <SeparateRecordsTable recordsByType={{ average, single }} />;
}

const HISTORY_BATCH_SIZE = 100;
const HISTORY_LOAD_MARGIN = "0px 0px 600px 0px";

function HistoryTable({ records }: RecordsTableProps) {
  const { t } = useT();
  const [visibleCount, setVisibleCount] = useState(HISTORY_BATCH_SIZE);
  const loadMoreRef = useOnInView<HTMLDivElement>(
    (inView) => {
      if (inView) setVisibleCount((count) => count + HISTORY_BATCH_SIZE);
    },
    { rootMargin: HISTORY_LOAD_MARGIN },
  );

  return (
    <>
      <Table.ScrollArea rounded="md">
        <Table.Root size="xs" striped>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>
                {t("results.table_elements.date_circa")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                {t("results.table_elements.event")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                {t("results.table_elements.name")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                {t("results.selector_elements.type_selector.single")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                {t("results.selector_elements.type_selector.average")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                {t("results.table_elements.region")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                {t("results.table_elements.competition")}
              </Table.ColumnHeader>
              <Table.ColumnHeader colSpan={5}>
                {t("results.table_elements.solves")}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {records.slice(0, visibleCount).map((record, index) => (
              <HistoryRow key={`${record.id}-${index}`} record={record} />
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      {visibleCount < records.length && (
        <Box ref={loadMoreRef} h="1" aria-hidden="true" />
      )}
    </>
  );
}

function SeparateRecordsTable({ recordsByType }: SeparateRecordsTableProps) {
  const { t } = useT();

  return (
    <VStack align="stretch" gap={6}>
      {["single", "average"].map((type) => (
        <VStack align="stretch" key={type}>
          <Heading size={{ base: "xl", md: "2xl" }}>
            {t(`results.selector_elements.type_selector.${type}`)}
          </Heading>
          <Table.ScrollArea rounded="md">
            <Table.Root size="xs" striped>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>
                    {t("results.table_elements.event")}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>
                    {t("results.table_elements.result")}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>
                    {t("results.table_elements.name")}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>
                    {t("results.table_elements.region")}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>
                    {t("results.table_elements.competition")}
                  </Table.ColumnHeader>
                  {type === "average" && (
                    <Table.ColumnHeader colSpan={5}>
                      {t("results.table_elements.solves")}
                    </Table.ColumnHeader>
                  )}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {recordsByType[type as "single" | "average"].map((record) => (
                  <SeparateRecordsRow key={record.id} record={record} />
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </VStack>
      ))}
    </VStack>
  );
}

function MixedRecordsTable({ records }: RecordsTableProps) {
  const { t } = useT();

  const groupedByType = _.groupBy(records, (record) => record.type);
  const single = groupedByType["single"];
  const average = groupedByType["average"];

  return (
    <Table.ScrollArea rounded="md">
      <Table.Root
        size="xs"
        striped
        tableLayout="fixed"
        minW="6xl"
        whiteSpace="normal"
        overflowWrap="anywhere"
      >
        <Table.ColumnGroup>
          <Table.Column w="16" />
          <Table.Column w={{ base: "3xs", md: "2xs" }} />
          <Table.Column w="24" />
          <Table.Column w="32" />
          <Table.Column w="64" />
          <Table.Column span={5} />
        </Table.ColumnGroup>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>
              {t("results.selector_elements.type_selector.type")}
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              {t("results.table_elements.name")}
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              {t("results.table_elements.result")}
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              {t("results.table_elements.region")}
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              {t("results.table_elements.competition")}
            </Table.ColumnHeader>
            <Table.ColumnHeader colSpan={5}>
              {t("results.table_elements.solves")}
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {single.map((record) => (
            <MixedRecordsRow key={record.id} record={record} t={t} />
          ))}
          {average?.map((record) => (
            <MixedRecordsRow key={record.id} record={record} t={t} />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
