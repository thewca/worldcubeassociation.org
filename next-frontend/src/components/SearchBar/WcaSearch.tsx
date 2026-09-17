"use client";

import React, { useState } from "react";
import {
  Combobox,
  Portal,
  Spinner,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import { useRouter } from "next/navigation";
import useDebounce from "@/lib/hooks/useDebounce";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import SearchResultContent from "@/components/search/SearchResultContent";
import {
  searchPageRoute,
  searchResultRoute,
} from "@/lib/wca/search/searchRoutes";
import type { components } from "@/types/openapi";
import { Trans } from "react-i18next";
import { TFunction } from "i18next";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

// The API returns every competition before the first person, so a search like "ethan" filled the
//   dropdown with competitions and looked like it had found no competitors. Grouping by type and
//   capping each group keeps every kind of match in view; "Search for ..." leads to the full list.
const MAX_RESULTS_PER_GROUP = 5;

const RESULT_GROUPS = [
  { resultClass: "person", labelKey: "search_results.index.people" },
  { resultClass: "competition", labelKey: "search_results.index.competitions" },
  {
    resultClass: "regulation",
    labelKey: "search_results.index.regulations_and_guidelines",
  },
  { resultClass: "incident", labelKey: "search_results.index.incidents" },
] as const;

type SearchResult = components["schemas"]["SearchResult"];

// Synthetic option, added client-side, that links to the full search page.
type SearchTextItem = {
  class: "text";
  id: string;
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
  if (item.class === "text") {
    return (
      <Trans
        parent={Text}
        t={t}
        i18nKey="search_results.index.search_for"
        values={{
          search_string: item.search,
        }}
        components={{ b: <b /> }}
      />
    );
  }

  return <SearchResultContent result={item} t={t} />;
}

export default function WcaSearch() {
  const { t } = useT();
  const api = useAPI();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [highlightedValue, setHighlightedValue] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const hasQuery = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const { data, isFetching: loading } = api.useQuery(
    "get",
    "/v0/search",
    { params: { query: { q: debouncedQuery } } },
    { enabled: hasQuery },
  );

  const searchOption: SearchTextItem = {
    class: "text",
    id: "search",
    search: query,
  };

  // Results from a previous query are hidden until the current query is long
  // enough and its fetch resolves.
  const visibleResults = hasQuery ? (data?.result ?? []) : [];

  const resultGroups = RESULT_GROUPS.map(({ resultClass, labelKey }) => ({
    labelKey,
    results: visibleResults
      .filter((result) => result.class === resultClass)
      .slice(0, MAX_RESULTS_PER_GROUP),
  })).filter((group) => group.results.length > 0);

  const groupedResults = resultGroups.flatMap((group) => group.results);

  const items: ComboItem[] =
    query.length > 0 ? [searchOption, ...groupedResults] : groupedResults;

  const collection = createListCollection({
    items,
    itemToValue: itemValue,
    itemToString: itemLabel,
  });

  // Enter with nothing highlighted used to close the box and go nowhere. Anything the competitor
  //   has typed is a good enough query for the full search page, so send them there.
  //   `isComposing` leaves Enter alone while an IME candidate is being confirmed.
  const handleEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Enter" &&
      highlightedValue === null &&
      !event.nativeEvent.isComposing &&
      query.length > 0
    ) {
      router.push(searchPageRoute(query));
    }
  };

  const handleSelect = (value: string) => {
    const selected = items.find((item) => itemValue(item) === value);

    if (!selected) return;

    // Regulations live in a document that Next.js doesn't route, so they need a
    // full navigation rather than a client-side push.
    if (selected.class === "regulation") {
      window.location.assign(selected.url);
    } else if (selected.class === "text") {
      router.push(searchPageRoute(selected.search));
    } else {
      router.push(searchResultRoute(selected));
    }
  };

  return (
    <Combobox.Root
      collection={collection}
      // We search server-side, so disable Combobox's built-in filtering.
      openOnClick
      // Highlighting the first option (which is always "Search for ...") makes
      // pressing enter open the full search page.
      inputBehavior="autohighlight"
      highlightedValue={highlightedValue}
      onHighlightChange={(e) => setHighlightedValue(e.highlightedValue)}
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
        {/* The combobox recipe sets `sm` (14px) here, and iOS Safari zooms the whole page when
            a focused input is under 16px. */}
        <Combobox.Input onKeyDown={handleEnter} fontSize="md" />
        <Combobox.IndicatorGroup>
          {loading ? <Spinner size="xs" /> : <LuSearch />}
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            {query.length > 0 && (
              <Combobox.Item item={searchOption} key={itemValue(searchOption)}>
                <ResultContent item={searchOption} t={t} />
                <Combobox.ItemIndicator />
              </Combobox.Item>
            )}
            {resultGroups.map((group) => (
              <Combobox.ItemGroup key={group.labelKey}>
                <Combobox.ItemGroupLabel>
                  {t(group.labelKey)}
                </Combobox.ItemGroupLabel>
                {group.results.map((item) => (
                  <Combobox.Item item={item} key={itemValue(item)}>
                    <ResultContent item={item} t={t} />
                    <Combobox.ItemIndicator />
                  </Combobox.Item>
                ))}
              </Combobox.ItemGroup>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
