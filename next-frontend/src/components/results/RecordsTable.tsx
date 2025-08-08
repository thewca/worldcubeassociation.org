"use client";

import { Table } from "@chakra-ui/react";
import { components } from "@/types/openapi";
import _ from "lodash";
import RecordsRow from "@/components/results/RecordsRow";
import { useT } from "@/lib/i18n/useI18n";

interface RecordsTableProps {
  records: components["schemas"]["Record"][];
}

export default function RecordsTable({ records }: RecordsTableProps) {
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
          <RecordsRow key={record.id} record={record} t={t} />
        ))}
        {average?.map((record) => (
          <RecordsRow key={record.id} record={record} t={t} />
        ))}
      </Table.Body>
    </Table.Root>
  );
}
