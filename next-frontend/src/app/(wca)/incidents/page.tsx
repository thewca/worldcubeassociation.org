"use client";

import {
  ButtonGroup,
  Container,
  IconButton,
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
import { useCallback, useMemo, useState } from "react";
import Loading from "@/components/ui/loading";
import _ from "lodash";
import {
  CompetitionTag,
  MiscTag,
  RegulationTag,
} from "@/components/incidents/Tags";

const itemsPerPageChoices = createListCollection({
  items: [5, 10, 15, 20, 30, 40],
  itemToValue: (n) => n.toString(),
  itemToString: (n) => n.toString(),
});

export default function IncidentsPage() {
  const api = useAPIClient();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [searchTags, setSearchTags] = useState<string[]>([]);

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
    <Container>
      <VStack align="left">
        <Heading size="5xl">Incidents Log</Heading>
        <Input
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isFetching && <Loading />}
        <Table.Root size="sm" variant="outline" striped>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Title</Table.ColumnHeader>
              <Table.ColumnHeader>Tags</Table.ColumnHeader>
              <Table.ColumnHeader>Happened during</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader>Sent in digest</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {incidents.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell>{item.title}</Table.Cell>
                <Table.Cell>
                  {item.tags.map(
                    ({ name, id: tagId, url, content_html: contentHtml }) =>
                      // non-regulation/guideline tags will only have a name
                      tagId !== undefined ? (
                        <RegulationTag
                          key={tagId}
                          id={tagId.toString()}
                          type={
                            url.indexOf("guideline") === -1
                              ? "Regulation"
                              : "Guideline"
                          }
                          link={url}
                          description={contentHtml}
                          addToSearch={addTagToSearch}
                        />
                      ) : (
                        <MiscTag
                          key={name}
                          tag={name}
                          addToSearch={addTagToSearch}
                        />
                      ),
                  )}
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
                  {item.resolved_at ? "Resolved" : "Pending"}
                </Table.Cell>
                <Table.Cell>
                  {item.digest_worthy && item.digest_sent_at
                    ? "Sent"
                    : "Pending"}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        <HStack justify="space-between">
          <Text as="span">
            Showing entries {topEntryIndex + 1} to {bottomEntryIndex + 1} of{" "}
            {totalEntries} entries with{" "}
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
            per page
          </Text>

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
