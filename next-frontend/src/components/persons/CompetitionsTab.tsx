import React from "react";
import { Link, Table, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { getT } from "@/lib/i18n/get18n";
import { formatDateRange } from "@/lib/dates/format";
import { route } from "nextjs-routes";
import countries from "@/lib/wca/data/countries";
import OpenapiError from "@/components/ui/openapiError";
import { getPersonCompetitions } from "@/lib/wca/persons/getPersonCompetitions";

interface CompetitionsTabProps {
  wcaId: string;
}

const CompetitionsTab = async ({ wcaId }: CompetitionsTabProps) => {
  const { t } = await getT();
  const {
    data: competitions,
    error,
    response,
  } = await getPersonCompetitions(wcaId);

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  return (
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
  );
};

export default CompetitionsTab;
