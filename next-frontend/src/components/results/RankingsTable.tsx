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

  const ranks = rankings.reduce<number[]>(
    (previousRanks, ranking, index) => [
      ...previousRanks,
      ranking.value === rankings[index - 1]?.value
        ? previousRanks[index - 1]
        : index + 1,
    ],
    [],
  );

  return (
    <Table.ScrollArea rounded="md">
      <Table.Root size="xs" striped>
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
              rank={ranks[index]}
              isAverage={isAverage}
              isByRegion={isByRegion}
            />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
