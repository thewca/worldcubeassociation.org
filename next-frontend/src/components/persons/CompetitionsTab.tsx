"use client";

import React, { useState } from "react";
import { orderBy, sortBy } from "lodash";
import {
  createListCollection,
  Link,
  Select,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useT } from "@/lib/i18n/useI18n";
import { formatDateRange } from "@/lib/dates/format";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { route } from "nextjs-routes";
import countries from "@/lib/wca/data/countries";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";

type SortOrder = "asc" | "desc";

const isSortOrder = (value: string): value is SortOrder =>
  value === "asc" || value === "desc";

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

  const numberedCompetitions = sortBy(competitions, [
    "start_date",
    "end_date",
    "id",
  ]).map((competition, index) => ({ competition, number: index + 1 }));

  const orderedCompetitions = orderBy(numberedCompetitions, "number", order);

  return (
    <Stack>
      <OrderSelect value={order} onChange={setOrder} />
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
            {orderedCompetitions.map(({ competition: c, number }) => {
              const countryName = countries.byIso2[c.country_iso2]?.name;

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

interface OrderSelectProps {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}

function OrderSelect({ value, onChange }: OrderSelectProps) {
  const { t } = useT();

  const collection = createListCollection({
    items: [
      { value: "asc", label: t("competitions.index.sort.asc") },
      { value: "desc", label: t("competitions.index.sort.desc") },
    ],
  });

  return (
    <Select.Root
      collection={collection}
      value={[value]}
      onValueChange={({ value: [selected] }) => {
        if (selected && isSortOrder(selected)) {
          onChange(selected);
        }
      }}
      variant="outline"
      width="fit-content"
      minWidth="xs"
    >
      <Select.HiddenSelect />
      <Select.Label>{t("competitions.index.sort.order")}</Select.Label>

      <Select.Control>
        <Select.Trigger>
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>

      <Select.Positioner>
        <Select.Content>
          {collection.items.map((item) => (
            <Select.Item key={item.value} item={item}>
              {item.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  );
}
