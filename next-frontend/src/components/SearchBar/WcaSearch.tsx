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
import { LuSearch } from "react-icons/lu";
import WcaFlag from "@/components/WcaFlag";
import useDebounce from "@/lib/hooks/useDebounce";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import type { components } from "@/types/openapi";
import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";
import { TFunction } from "i18next";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

type SearchResult = components["schemas"]["SearchResult"];

// Synthetic option, added client-side, that links to the full search page.
type SearchTextItem = {
  class: "text";
  id: string;
  url: string;
  search: string;
};

type ComboItem = SearchResult | SearchTextItem;

const itemValue = (item: ComboItem) => `${item.class}-${item.id}`;

const itemLabel = (item: ComboItem) => {
  switch (item.class) {
    case "competition":
    case "person":
      return item.name;
    case "incident":
      return item.title;
    case "text":
      return item.search;
    case "regulation":
    default:
      return item.id;
  }
};

function ResultContent({ item, t }: { item: ComboItem; t: TFunction }) {
  switch (item.class) {
    case "competition":
      return (
        <VStack align="start" gap={0}>
          <Text textStyle="bodyEmphasis">{item.name}</Text>
          <HStack gap={1} fontSize="sm">
            {item.country_iso2 && (
              <WcaFlag code={item.country_iso2} width={18} />
            )}
            <Text>{`${item.city} (${item.id})`}</Text>
          </HStack>
        </VStack>
      );
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
            <Text textStyle="bodyEmphasis">{item.name}</Text>
            {item.wca_id && <Text fontSize="sm">{item.wca_id}</Text>}
          </VStack>
        </HStack>
      );
    case "regulation":
      return (
        <HStack gap={1}>
          <Text textStyle="bodyEmphasis">{item.id}:</Text>
          <Box
            // Regulation content is trusted, sanitized WCA content.
            dangerouslySetInnerHTML={{ __html: item.content_html ?? "" }}
          />
        </HStack>
      );
    case "incident":
      return (
        <Text>
          <Text textStyle="bodyEmphasis">{t("incidents_log.incident")}</Text>
          {`${item.title}`}
        </Text>
      );
    case "text":
    default:
      return (
        <I18nHTMLTranslate
          i18nKey="search_results.index.search_for"
          options={{
            search_string: item.search,
          }}
          as={Text}
        />
      );
  }
}

export default function WcaSearch() {
  const { t } = useT();
  const api = useAPI();

  const [query, setQuery] = useState("");

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const hasQuery = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const { data, isFetching: loading } = api.useQuery(
    "get",
    "/v0/search",
    { params: { query: { q: debouncedQuery } } },
    { enabled: hasQuery },
  );

  const items: ComboItem[] = useMemo(() => {
    const searchOption: SearchTextItem = {
      class: "text",
      id: "search",
      search: query,
      url: `/search?q=${encodeURIComponent(query)}`,
    };

    // Results from a previous query are hidden until the current query is long
    // enough and its fetch resolves.
    const visibleResults = hasQuery ? (data?.result ?? []) : [];

    return query.length > 0
      ? [searchOption, ...visibleResults]
      : visibleResults;
  }, [query, data, hasQuery]);

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
      width="full"
      maxW="xl"
      ms="auto"
      me={{ base: "auto", xl: 0 }}
      placeholder={t("common.search_site")}
    >
      <Combobox.Control>
        <Combobox.Input />
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
