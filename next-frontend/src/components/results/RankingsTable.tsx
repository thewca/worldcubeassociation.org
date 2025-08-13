"use client";

import { useT } from "@/lib/i18n/useI18n";
import { components } from "@/types/openapi";
import { Table } from "@chakra-ui/react";
import { RankingsRow } from "@/components/results/RankingsRow";

interface RankingsTableProps {
  rankings: components["schemas"]["Result"][];
  isAverage?: boolean;
}

export default function RankingsTable({
  rankings,
  isAverage = false,
}: RankingsTableProps) {
  const { t } = useT();

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>#</Table.ColumnHeader>
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
          {isAverage && (
            <Table.ColumnHeader>
              {t("results.table_elements.solves")}
            </Table.ColumnHeader>
          )}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rankings.map((ranking, index) => (
          <RankingsRow ranking={ranking} index={index} key={ranking.id} />
        ))}
      </Table.Body>
    </Table.Root>
  );
}
