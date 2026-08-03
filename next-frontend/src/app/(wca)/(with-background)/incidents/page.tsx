"use client";

import {
  ButtonGroup,
  Container,
  IconButton,
  Link,
  Pagination,
  Table,
  VStack,
  Heading,
  Input,
  HStack,
  Text,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useAPIClient } from "@/lib/wca/useAPI";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/ui/loading";
import _ from "lodash";
import { Trans } from "react-i18next";
import { CompetitionTag, IncidentTags } from "@/components/incidents/Tags";
import { useT } from "@/lib/i18n/useI18n";

const itemsPerPageChoices = createListCollection({
  items: [5, 10, 15, 20, 30, 40],
  itemToValue: (n) => n.toString(),
  itemToString: (n) => n.toString(),
});

export default function IncidentsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <IncidentsLog />
    </Suspense>
  );
}

function IncidentsLog() {
  const { t } = useT();
  const api = useAPIClient();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [searchTags, setSearchTags] = useState<string[]>(
    () => searchParams.get("tags")?.split(",").filter(Boolean) ?? [],
  );

  // TODO GB: Use "proper" pagination for this endpoint (inifinite?) like in competition_index
  //   or at least fall back to API-typed queryOptions
  const {
    data: incidentQuery,
    isLoading,
    isFetching,
  } = useQuery({
    queryFn: () =>
      api.GET("/v0/incidents", {
        params: {
          query: {
            per_page: itemsPerPage,
            query,
            page,
            tags: searchTags.length === 0 ? undefined : searchTags.join(","),
          },
        },
      }),
    queryKey: ["incidents", page, itemsPerPage, query, ...searchTags],
    placeholderData: keepPreviousData,
  });

  const { totalEntries, totalPages } = useMemo(() => {
    if (!incidentQuery) {
      return {
        totalPages: 0,
        totalEntries: 0,
        entriesPerPage: 0,
      };
    } else {
      const headers = incidentQuery.response.headers;
      const totalEntries = parseInt(headers.get("total") ?? "0", 10);
      const entriesPerPage = parseInt(
        headers.get("per-page") ?? `${itemsPerPage}`,
        10,
      );
      const totalPages = Math.ceil(totalEntries / entriesPerPage);

      return {
        totalEntries,
        entriesPerPage,
        totalPages,
      };
    }
  }, [incidentQuery, itemsPerPage]);

  const [topEntryIndex, bottomEntryIndex] = [
    (page - 1) * itemsPerPage,
    Math.min(page * itemsPerPage, totalEntries) - 1,
  ];

  const addTagToSearch = useCallback(
    (tag: string) => {
      setSearchTags(_.xor(searchTags, [tag]));
    },
    [searchTags],
  );

  const incidents = useMemo(() => incidentQuery?.data ?? [], [incidentQuery]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Container bg="bg">
      <VStack align="left">
        <Heading size="5xl">{t("incidents_log.title")}</Heading>
        <Input
          placeholder={t("incidents_log.search_placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isFetching && <Loading />}
        <Table.Root size="sm" variant="outline" striped>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>
                {t("activerecord.attributes.incident.title")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                {t("activerecord.attributes.incident.tags")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                {t("activerecord.attributes.incident.competition_id")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                {t("incidents_log.status")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                {t("incidents_log.sent_in_digest")}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {incidents.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell>
                  <Link href={`/incidents/${item.id}`}>{item.title}</Link>
                </Table.Cell>
                <Table.Cell>
                  <IncidentTags tags={item.tags} addToSearch={addTagToSearch} />
                </Table.Cell>
                <Table.Cell>
                  {item.competitions.map((competition) => (
                    <CompetitionTag
                      key={competition.id}
                      name={competition.name}
                      id={competition.id}
                      comments={competition.comments}
                    />
                  ))}
                </Table.Cell>
                <Table.Cell>
                  {t(
                    item.resolved_at
                      ? "incidents_log.resolved"
                      : "incidents_log.pending",
                  )}
                </Table.Cell>
                <Table.Cell>
                  {t(
                    item.digest_worthy && item.digest_sent_at
                      ? "incidents_log.sent"
                      : "incidents_log.pending",
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        <HStack justify="space-between">
          <Trans
            parent={Text}
            t={t}
            i18nKey="incidents_log.showing_entries"
            values={{
              first: topEntryIndex + 1,
              last: bottomEntryIndex + 1,
              total: totalEntries,
            }}
            components={{
              select: (
                <Select.Root
                  collection={itemsPerPageChoices}
                  value={[itemsPerPage.toString()]}
                  onValueChange={(e) => setItemsPerPage(parseInt(e.value[0]))}
                  width="5rem"
                  display="inline-block"
                >
                  <Select.HiddenSelect />

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
                      {itemsPerPageChoices.items.map((perPageChoice) => (
                        <Select.Item
                          key={perPageChoice.toString()}
                          item={perPageChoice.toString()}
                        >
                          {perPageChoice}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              ),
            }}
          />

          <Pagination.Root
            count={totalEntries}
            pageSize={totalPages}
            page={page}
          >
            <ButtonGroup variant="ghost" size="sm" wrap="wrap">
              <Pagination.PrevTrigger asChild>
                <IconButton
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <LuChevronLeft />
                </IconButton>
              </Pagination.PrevTrigger>

              <Pagination.Items
                render={(page) => (
                  <IconButton
                    variant={{ base: "ghost", _selected: "outline" }}
                    onClick={() => setPage(page.value)}
                  >
                    {page.value}
                  </IconButton>
                )}
              />

              <Pagination.NextTrigger asChild>
                <IconButton onClick={() => setPage(page + 1)}>
                  <LuChevronRight />
                </IconButton>
              </Pagination.NextTrigger>
            </ButtonGroup>
          </Pagination.Root>
        </HStack>
      </VStack>
    </Container>
  );
}
