"use client";

import { Heading, Table, VStack } from "@chakra-ui/react";
import { components } from "@/types/openapi";
import _ from "lodash";
import {
  HistoryRow,
  MixedRecordsRow,
  SeparateRecordsRow,
  SlimRecordsRow,
} from "@/components/results/RecordsRow";
import { useT } from "@/lib/i18n/useI18n";
import events, { EventId, WCA_EVENT_IDS } from "@/lib/wca/data/events";
import React from "react";
import EventIcon from "@/components/EventIcon";

interface WrapperTableProps {
  records: components["schemas"]["RecordByEvent"];
  show: string;
}

interface HistoryTableProps {
  records: components["schemas"]["RecordByEvent"];
}

interface MixedHistoryTableProps {
  records: components["schemas"]["Record"][];
}

interface RecordsTableProps {
  records: components["schemas"]["Record"][];
}

interface SlimRecordsTableProps {
  records: components["schemas"]["RecordByEvent"];
}

interface SeparateRecordsTableProps {
  recordsByType: {
    single: components["schemas"]["Record"][];
    average: components["schemas"]["Record"][];
  };
}

export default function RecordsTable({ records, show }: WrapperTableProps) {
  if (show === "mixed") {
    return WCA_EVENT_IDS.map((event) => {
      const recordsByEvent = records[event as EventId];

      return (
        recordsByEvent && (
          <React.Fragment key={event}>
            {show === "mixed" && (
              <Heading size="2xl" key={event}>
                <EventIcon eventId={event} /> {events.byId[event].name}
              </Heading>
            )}
            <MixedRecordsTable records={recordsByEvent} />
          </React.Fragment>
        )
      );
    });
  }

  if (show === "slim") {
    return <SlimRecordsTable records={records} />;
  }

  if (show === "separate") {
    // Make sure we don't include any unofficial events and keep the right order
    const allRecords = WCA_EVENT_IDS.reduce(
      (acc, event) => [...records[event as EventId]!, ...acc],
      [] as components["schemas"]["Record"][],
    ).toReversed();

    const average = allRecords.filter((record) => record.type === "average");
    const single = allRecords.filter((record) => record.type === "single");

    return <SeparateRecordsTable recordsByType={{ average, single }} />;
  }

  if (show === "history") {
    return <HistoryTable records={records} />;
  }

  if (show === "mixed history") {
    const allRecords = WCA_EVENT_IDS.reduce(
      (acc, event) => [...records[event as EventId]!, ...acc],
      [] as components["schemas"]["Record"][],
    ).sort((a, b) => b.start_date.localeCompare(a.start_date));

    return <MixedHistoryTable records={allRecords} />;
  }
}

function MixedHistoryTable({ records }: MixedHistoryTableProps) {
  const { t } = useT();

  return (
    <Table.Root>
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
  );
}

function HistoryTable({ records }: HistoryTableProps) {
  const { t } = useT();

  return WCA_EVENT_IDS.map((eventId) => {
    if (!records[eventId as EventId]) return;

    const groupedByType = _.groupBy(
      records[eventId as EventId],
      (record) => record.type,
    );
    const single = groupedByType["single"];
    const average = groupedByType["average"];

    return (
      <VStack key={eventId} align="left">
        <Heading size="2xl">
          <EventIcon eventId={eventId} /> {events.byId[eventId].name}
        </Heading>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>
                {t("results.table_elements.date_circa")}
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
            {single?.map((record) => (
              <HistoryRow key={record.id} record={record} />
            ))}
            {average?.map((record) => (
              <HistoryRow key={record.id} record={record} />
            ))}
          </Table.Body>
        </Table.Root>
      </VStack>
    );
  });
}

function SlimRecordsTable({ records }: SlimRecordsTableProps) {
  const { t } = useT();

  return (
    <Table.Root>
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
            <SlimRecordsRow key={eventId} singles={single} averages={average} />
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}

function SeparateRecordsTable({ recordsByType }: SeparateRecordsTableProps) {
  const { t } = useT();

  return ["single", "average"].map((type) => (
    <VStack align="left" key={type}>
      <Heading size="2xl">
        {t(`results.selector_elements.type_selector.${type}`)}
      </Heading>
      <Table.Root>
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
    </VStack>
  ));
}

function MixedRecordsTable({ records }: RecordsTableProps) {
  const { t } = useT();

  const groupedByType = _.groupBy(records, (record) => record.type);
  const single = groupedByType["single"];
  const average = groupedByType["average"];

  return (
    <Table.Root>
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
  );
}
