"use client";

import { Heading, Table, VStack } from "@chakra-ui/react";
import { components } from "@/types/openapi";
import _ from "lodash";
import { DateTime } from "luxon";
import {
  HistoryRow,
  MixedRecordsRow,
  SeparateRecordsRow,
  SlimRecordsRow,
} from "@/components/results/RecordsRow";
import { useT } from "@/lib/i18n/useI18n";
import events, { EventId, WCA_EVENT_IDS } from "@/lib/wca/data/events";
import EventIcon from "@/components/EventIcon";
import { FilterParams } from "@/lib/wca/results/records";

interface WrapperTableProps extends Pick<
  FilterParams,
  "view" | "groupBy" | "display"
> {
  records: components["schemas"]["RecordByEvent"];
}

interface HistoryTableProps {
  records: components["schemas"]["Record"][];
}

interface RecordsTableProps {
  records: components["schemas"]["Record"][];
}

interface SlimRecordsTableProps {
  records: components["schemas"]["RecordByEvent"];
}

interface SeparateRecordsTableProps {
  display: FilterParams["display"];
  recordsByType: {
    single: components["schemas"]["Record"][];
    average: components["schemas"]["Record"][];
  };
}

export default function RecordsTable({
  records,
  view,
  groupBy,
  display,
}: WrapperTableProps) {
  if (view === "history") {
    const allRecords = WCA_EVENT_IDS.toReversed()
      .flatMap((eventId) => records[eventId] ?? [])
      .toSorted(
        (a, b) =>
          DateTime.fromISO(b.start_date).toMillis() -
          DateTime.fromISO(a.start_date).toMillis(),
      );

    return <HistoryTable records={allRecords} />;
  }

  if (groupBy === "type") {
    // Make sure we don't include any unofficial events and keep the right order
    const allRecords = WCA_EVENT_IDS.flatMap((eventId) =>
      (records[eventId] ?? []).toReversed(),
    );

    const average = allRecords.filter((record) => record.type === "average");
    const single = allRecords.filter((record) => record.type === "single");

    return (
      <SeparateRecordsTable
        recordsByType={{ average, single }}
        display={display}
      />
    );
  }

  if (display === "compact") {
    return <SlimRecordsTable records={records} />;
  }

  return (
    <VStack align="stretch" gap={6}>
      {WCA_EVENT_IDS.map((event) => {
        const recordsByEvent = records[event];

        return (
          recordsByEvent && (
            <VStack key={event} align="stretch">
              <Heading
                size={{ base: "xl", md: "2xl" }}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <EventIcon eventId={event} flexShrink={0} />
                {events.byId[event].name}
              </Heading>
              <MixedRecordsTable records={recordsByEvent} />
            </VStack>
          )
        );
      })}
    </VStack>
  );
}

function HistoryTable({ records }: HistoryTableProps) {
  const { t } = useT();

  return (
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
          {records.map((record, index) => (
            <HistoryRow key={`${record.id}-${index}`} record={record} mixed />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

function SlimRecordsTable({ records }: SlimRecordsTableProps) {
  const { t } = useT();

  return (
    <Table.ScrollArea rounded="md">
      <Table.Root size="xs" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>
              {t("results.table_elements.name")}
            </Table.ColumnHeader>
            <Table.ColumnHeader>{t("common.single")}</Table.ColumnHeader>
            <Table.ColumnHeader>
              {t("results.table_elements.event")}
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              {t("results.table_elements.name")}
            </Table.ColumnHeader>
            <Table.ColumnHeader>{t("common.average")}</Table.ColumnHeader>
            <Table.ColumnHeader colSpan={5}>
              {t("results.table_elements.solves")}
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {WCA_EVENT_IDS.map((eventId) => {
            const eventRecords = records[eventId as EventId];
            if (!eventRecords) {
              return null;
            }
            const single = eventRecords.filter(
              (record) => record.type === "single",
            );
            const average = eventRecords.filter(
              (record) => record.type === "average",
            );

            return (
              <SlimRecordsRow
                key={eventId}
                singles={single}
                averages={average}
              />
            );
          })}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

function SeparateRecordsTable({
  recordsByType,
  display,
}: SeparateRecordsTableProps) {
  const { t } = useT();
  const compact = display === "compact";

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
                  {!compact && (
                    <Table.ColumnHeader>
                      {t("results.table_elements.region")}
                    </Table.ColumnHeader>
                  )}
                  {!compact && (
                    <Table.ColumnHeader>
                      {t("results.table_elements.competition")}
                    </Table.ColumnHeader>
                  )}
                  {!compact && type === "average" && (
                    <Table.ColumnHeader colSpan={5}>
                      {t("results.table_elements.solves")}
                    </Table.ColumnHeader>
                  )}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {recordsByType[type as "single" | "average"].map((record) => (
                  <SeparateRecordsRow
                    key={record.id}
                    record={record}
                    compact={compact}
                  />
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
      <Table.Root size="xs" striped>
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
