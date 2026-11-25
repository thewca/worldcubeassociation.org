"use client";

import { useState } from "react";
import { orderBy } from "lodash";
import { Button, Icon, Link, Stack, Table, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useT } from "@/lib/i18n/useI18n";
import { formatDateRange } from "@/lib/dates/format";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { route } from "nextjs-routes";
import countries from "@/lib/wca/data/countries";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";

type SortOrder = "asc" | "desc";

interface CompetitionsTabProps {
  wcaId: string;
}

export default function CompetitionsTab({ wcaId }: CompetitionsTabProps) {
  const [order, setOrder] = useState<SortOrder>("desc");
  const api = useAPI();
  const { t } = useT();
  const lng = useLocale();

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

  const orderedCompetitions = orderBy(
    competitions,
    ["start_date", "end_date", "id"],
    [order, order, order],
  );

  const toggleOrder = () =>
    setOrder((current) => (current === "asc" ? "desc" : "asc"));

  return (
    <Stack>
      <Table.ScrollArea maxW="full">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader
                aria-sort={order === "asc" ? "ascending" : "descending"}
              >
                <Button
                  variant="plain"
                  size="sm"
                  p={0}
                  h="auto"
                  fontWeight="inherit"
                  onClick={toggleOrder}
                  title={t(`competitions.index.sort.${order}`)}
                >
                  #
                  <Icon size="sm">
                    {order === "asc" ? <LuArrowUp /> : <LuArrowDown />}
                  </Icon>
                </Button>
              </Table.ColumnHeader>
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
            {orderedCompetitions.map((c, index) => {
              const countryName = countries.byIso2[c.country_iso2]?.name;
              const number =
                order === "asc"
                  ? index + 1
                  : orderedCompetitions.length - index;
              return (
                <Table.Row key={c.id}>
                  <Table.Cell>{number}</Table.Cell>
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
                    {countryName ? `${c.city}, ${countryName}` : c.city}
                  </Table.Cell>
                  <Table.Cell>
                    {formatDateRange(c.start_date, c.end_date, lng)}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Stack>
  );
}
