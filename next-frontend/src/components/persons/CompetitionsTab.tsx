"use client";

import React from "react";
import { Table, Text } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import { formatDateRange } from "@/lib/dates/format";

interface CompetitionsTabProps {
  wcaId: string;
}

const CompetitionsTab: React.FC<CompetitionsTabProps> = ({ wcaId }) => {
  const api = useAPI();
  const { t } = useT();

  const { data: competitionQuery, isLoading } = api.useQuery(
    "get",
    "/v0/persons/{wca_id}/competitions",
    {
      params: { path: { wca_id: wcaId } },
    },
  );

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!competitionQuery) {
    return <Text>Failed fetching results</Text>;
  }

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>
            {t("persons.show.competition")}
          </Table.ColumnHeader>
          <Table.ColumnHeader>
            {t("competitions.competition_info.city")}
          </Table.ColumnHeader>
          <Table.ColumnHeader>
            {t("competitions.competition_info.date")}
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {competitionQuery.map((c) => (
          <Table.Row key={c.id}>
            <Table.Cell>{c.name}</Table.Cell>
            <Table.Cell>{c.city}</Table.Cell>
            <Table.Cell>
              <Text>{formatDateRange(c.start_date, c.end_date)}</Text>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default CompetitionsTab;
