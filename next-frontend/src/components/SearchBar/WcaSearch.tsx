"use client";

import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Combobox,
  HStack,
  Portal,
  Spinner,
  Text,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { LuSearch } from "react-icons/lu";
import WcaFlag from "@/components/WcaFlag";
import useDebounce from "@/lib/hooks/useDebounce";
import { useT } from "@/lib/i18n/useI18n";
import type { components } from "@/types/openapi";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

type SearchResultItem = {
  id: string;
  class: "competition" | "user" | "person" | "regulation" | "incident" | "text";
  url: string;
  name?: string;
  // competition
  city?: string;
  country_iso2?: string;
  // user / person
  wca_id?: string;
  avatar?: components["schemas"]["UserAvatar"];
  // regulation
  content_html?: string;
  // incident
  title?: string;
  // synthetic "search for" item
  search?: string;
};

const itemValue = (item: SearchResultItem) => `${item.class}-${item.id}`;

const itemLabel = (item: SearchResultItem) =>
  item.name ?? item.title ?? item.search ?? item.id;

function ResultContent({
  item,
  t,
}: {
  item: SearchResultItem;
  t: ReturnType<typeof useT>["t"];
}) {
  switch (item.class) {
    case "competition":
      return (
        <VStack align="start" gap={0}>
          <Text>{item.name}</Text>
          <HStack gap={1} color="fg.muted" fontSize="sm">
            {item.country_iso2 && (
              <WcaFlag code={item.country_iso2} width={18} />
            )}
            <Text>{`${item.city} (${item.id})`}</Text>
          </HStack>
        </VStack>
      );
    case "user":
    case "person":
      return (
        <HStack gap={2}>
          <Avatar.Root size="xs">
            <Avatar.Fallback name={item.name} />
            {item.avatar && !item.avatar.is_default && (
              <Avatar.Image src={item.avatar.thumb_url ?? item.avatar.url} />
            )}
          </Avatar.Root>
          <VStack align="start" gap={0}>
            <Text>{item.name}</Text>
            {item.wca_id && (
              <Text color="fg.muted" fontSize="sm">
                {item.wca_id}
              </Text>
            )}
          </VStack>
        </HStack>
      );
    case "regulation":
      return (
        <HStack gap={1}>
          <Text fontWeight="medium">{item.id}:</Text>
          <Box
            // Regulation content is trusted, sanitized WCA content.
            dangerouslySetInnerHTML={{ __html: item.content_html ?? "" }}
          />
        </HStack>
      );
    case "incident":
      return <Text>{`${t("incidents_log.incident")} ${item.title}`}</Text>;
    case "text":
    default:
      return (
        <Text>
          {t("search_results.index.search_for", {
            search_string: item.search,
          })}
        </Text>
      );
  }
}

export default function WcaSearch() {
  const { t } = useT();

  const [query, setQuery] = useState("");

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const hasQuery = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const { data: results = [], isFetching: loading } = useQuery({
    queryKey: ["omni-search", debouncedQuery],
    queryFn: async ({ signal }): Promise<SearchResultItem[]> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WCA_FRONTEND_API_URL}v0/search?q=${encodeURIComponent(
          debouncedQuery,
        )}`,
        { signal },
      );
      const data = await response.json();
      return data.result ?? [];
    },
    enabled: hasQuery,
  });

  const items: SearchResultItem[] = useMemo(() => {
    const searchOption: SearchResultItem = {
      id: "search",
      class: "text",
      search: query,
      url: `/search?q=${encodeURIComponent(query)}`,
    };

    // Results from a previous query are hidden until the current query is long
    // enough and its fetch resolves.
    const visibleResults = hasQuery ? results : [];

    return query.length > 0
      ? [searchOption, ...visibleResults]
      : visibleResults;
  }, [query, results, hasQuery]);

  const collection = useMemo(
    () =>
      createListCollection({
        items,
        itemToValue: itemValue,
        itemToString: itemLabel,
      }),
    [items],
  );

  const handleSelect = (value: string) => {
    const selected = items.find((item) => itemValue(item) === value);
    if (selected?.url) {
      window.location.href = selected.url;
    }
  };

  return (
    <Combobox.Root
      collection={collection}
      // We search server-side, so disable Combobox's built-in filtering.
      openOnClick
      onInputValueChange={(e) => setQuery(e.inputValue)}
      onValueChange={(e) => handleSelect(e.value[0])}
      selectionBehavior="clear"
      width="100%"
      maxW="md"
      placeholder={t("common.search_site")}
    >
      <Combobox.Control>
        <Combobox.Input placeholder={t("common.search_site")} />
        <Combobox.IndicatorGroup>
          {loading ? <Spinner size="xs" /> : <LuSearch />}
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            {collection.items.map((item) => (
              <Combobox.Item item={item} key={itemValue(item)}>
                <ResultContent item={item} t={t} />
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
