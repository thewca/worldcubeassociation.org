"use client";

import { useT } from "@/lib/i18n/useI18n";
import { components } from "@/types/openapi";
import { Table } from "@chakra-ui/react";
import { RankingsRow } from "@/components/results/RankingsRow";

interface RankingsTableProps {
  rankings: components["schemas"]["ExtendedResult"][];
  isAverage?: boolean;
  isByRegion?: boolean;
}

export default function RankingsTable({
  rankings,
  isAverage = false,
  isByRegion = false,
}: RankingsTableProps) {
  const { t } = useT();

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>
            {isByRegion ? t("results.table_elements.region") : "#"}
          </Table.ColumnHeader>
          <Table.ColumnHeader>
            {t("results.table_elements.name")}
          </Table.ColumnHeader>
          <Table.ColumnHeader>
            {t("results.table_elements.result")}
          </Table.ColumnHeader>
          {!isByRegion && (
            <Table.ColumnHeader>
              {t("results.table_elements.region")}
            </Table.ColumnHeader>
          )}
          <Table.ColumnHeader>
            {t("results.table_elements.competition")}
          </Table.ColumnHeader>
          {isAverage && (
            <Table.ColumnHeader colSpan={5}>
              {t("results.table_elements.solves")}
            </Table.ColumnHeader>
          )}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rankings.map((ranking, index) => (
          <RankingsRow
            key={`${ranking.id}-${index}`}
            ranking={ranking}
            index={index}
            isAverage={isAverage}
            isByRegion={isByRegion}
          />
        ))}
      </Table.Body>
    </Table.Root>
  );
}
