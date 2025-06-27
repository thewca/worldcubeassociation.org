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
} from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import useAPI from "@/lib/wca/useAPI";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import Loading from "@/components/ui/loading";
import _ from "lodash";
import {
  CompetitionTag,
  MiscTag,
  RegulationTag,
} from "@/components/incidents/Tags";

const ITEMS_PER_PAGE = 10;

export default function IncidentsPage() {
  const api = useAPI();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [searchTags, setSearchTags] = useState<string[]>([]);

  const { data: incidentQuery, isLoading } = useQuery({
    queryFn: () =>
      api.GET("/incidents", {
        params: {
          query: {
            per_page: ITEMS_PER_PAGE,
            query,
            page,
            tags: searchTags.length === 0 ? undefined : searchTags.join(","),
          },
        },
      }),
    queryKey: ["incidents", page, query, ...searchTags],
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
        headers.get("per-page") ?? `${ITEMS_PER_PAGE}`,
        10,
      );
      const totalPages = Math.ceil(totalEntries / entriesPerPage);

      return {
        totalEntries,
        entriesPerPage,
        totalPages,
      };
    }
  }, [incidentQuery]);

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
      <VStack align={"left"}>
        <Heading size="5xl">Incidents Log</Heading>
        <Input
          placeholder={"Search"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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

        <Pagination.Root count={totalEntries} pageSize={totalPages} page={page}>
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
      </VStack>
    </Container>
  );
}
