"use client";

import React from "react";
import { Link, Table, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useT } from "@/lib/i18n/useI18n";
import { formatDateRange } from "@/lib/dates/format";
import { route } from "nextjs-routes";
import countries from "@/lib/wca/data/countries";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";

interface CompetitionsTabProps {
  wcaId: string;
}

export default function CompetitionsTab({ wcaId }: CompetitionsTabProps) {
  const api = useAPI();
  const { t } = useT();

  const {
    data: competitions,
    isLoading,
    error,
  } = api.useQuery("get", "/v0/persons/{wca_id}/competitions", {
    params: { path: { wca_id: wcaId } },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error || !competitions) {
    return <Text>{t("errors.next_frontend.title")}</Text>;
  }

  return (
    <Table.ScrollArea maxW="full">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>#</Table.ColumnHeader>
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
          {competitions.map((c, index) => (
            <Table.Row key={c.id}>
              <Table.Cell>{index + 1}</Table.Cell>
              <Table.Cell>
                <Link asChild>
                  <NextLink
                    href={route({
                      pathname: "/competitions/[competitionId]",
                      query: { competitionId: c.id },
                    })}
                  >
                    {c.name}
                  </NextLink>
                </Link>
              </Table.Cell>
              <Table.Cell>
                {c.city}
                {`, ${countries.byIso2[c.country_iso2].name}`}
              </Table.Cell>
              <Table.Cell>
                <Text>{formatDateRange(c.start_date, c.end_date)}</Text>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
