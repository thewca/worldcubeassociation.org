"use client";

import { Heading, Table } from "@chakra-ui/react";
import { components } from "@/types/openapi";
import _ from "lodash";
import {
  MixedRecordsRow,
  SlimRecordsRow,
} from "@/components/results/RecordsRow";
import { useT } from "@/lib/i18n/useI18n";
import events, { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import { CurrentEventId } from "@wca/helpers";
import React from "react";
import EventIcon from "@/components/EventIcon";

interface WrapperTableProps {
  records: components["schemas"]["RecordByEvent"];
  show: string;
}

interface RecordsTableProps {
  records: components["schemas"]["Record"][];
}

interface SlimRecordsTableProps {
  records: components["schemas"]["RecordByEvent"];
}

export default function RecordsTable({ records, show }: WrapperTableProps) {
  if (show === "mixed") {
    return WCA_EVENT_IDS.map((event) => {
      const recordsByEvent = records[event as CurrentEventId];

      return (
        recordsByEvent && (
          <React.Fragment key={event}>
            {show === "mixed" && (
              <Heading size={"2xl"} key={event}>
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
          <Table.ColumnHeader>
            {t("results.table_elements.solves")}
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {WCA_EVENT_IDS.map((eventId) => {
          const eventRecords = records[eventId as CurrentEventId];
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
          <Table.ColumnHeader>
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
