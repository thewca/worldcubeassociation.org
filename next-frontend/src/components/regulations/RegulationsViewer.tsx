"use client";

import { MouseEvent, useCallback, useMemo, useState } from "react";
import {
  Box,
  Combobox,
  Portal,
  Text,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 50;

interface SearchItem {
  id: string;
  text: string;
}

const HTML_ENTITIES: Record<string, string> = {
  "&quot;": '"',
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&#39;": "'",
  "&nbsp;": " ",
};

// Builds the search index straight from the HTML string, so it works during
// server render with no dependency on the live DOM. For each regulation `<li>`
// we capture only its own text (up to a nested list) to keep snippets tidy.
function extractSearchItems(html: string): SearchItem[] {
  const items: SearchItem[] = [];
  const regex = /<li\s+id="([^"]+)"[^>]*>([\s\S]*?)(?=<ul|<li|<\/li>)/g;

  for (const [, id, rawText] of html.matchAll(regex)) {
    const text = rawText
      .replace(/<[^>]+>/g, " ")
      .replace(/&#?\w+;/g, (entity) => HTML_ENTITIES[entity] ?? entity)
      .replace(/\s+/g, " ")
      .trim();
    items.push({ id, text });
  }

  return items;
}

// Styling for the raw regulations HTML fragment. Chakra's CSS reset strips
// list/heading defaults, so we restore just enough to keep the document
// readable while preserving every deep-link anchor in the markup untouched.
const contentStyles = {
  "& h1": { fontSize: "3xl", fontWeight: "bold", mt: 6, mb: 2 },
  "& h2": { fontSize: "2xl", fontWeight: "bold", mt: 6, mb: 2 },
  "& h3": { fontSize: "xl", fontWeight: "bold", mt: 4, mb: 2 },
  "& p": { my: 3 },
  "& ul": { listStyleType: "none", pl: 6, my: 2 },
  "& a": { color: "blue.500", textDecoration: "underline" },
  "& li[id]": { my: 2, scrollMarginTop: "6rem" },
  "& h2[id], & h3[id]": { scrollMarginTop: "6rem" },
  "& .label": {
    display: "inline-block",
    px: 2,
    borderRadius: "sm",
    bg: "bg.muted",
    fontSize: "xs",
    fontWeight: "bold",
    textTransform: "uppercase",
    mr: 1,
  },
  "& .version": { color: "fg.muted", fontSize: "sm", mb: 4 },
} as const;

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.history.replaceState(null, "", `#${id}`);
  el.scrollIntoView({ behavior: "smooth" });
}

export default function RegulationsViewer({
  contentHtml,
}: {
  contentHtml: string;
}) {
  const [query, setQuery] = useState("");

  const items = useMemo(() => extractSearchItems(contentHtml), [contentHtml]);

  // Intercept clicks on in-page fragment links (e.g. `#1a`, `./#contents`)
  // so they scroll to the anchor regardless of the route's trailing slash,
  // which the raw regulations markup relies on. External and cross-page links
  // fall through to default navigation.
  const handleContentClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const anchor = (event.target as HTMLElement).closest("a");
      const href = anchor?.getAttribute("href");
      if (!href) return;

      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      const beforeHash = href.slice(0, hashIndex);
      if (beforeHash !== "" && beforeHash !== "." && beforeHash !== "./")
        return;

      const id = decodeURIComponent(href.slice(hashIndex + 1));
      if (document.getElementById(id)) {
        event.preventDefault();
        scrollToId(id);
      }
    },
    [],
  );

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < MIN_QUERY_LENGTH) return [];
    return items
      .filter(
        (item) =>
          item.id.toLowerCase().includes(normalized) ||
          item.text.toLowerCase().includes(normalized),
      )
      .slice(0, MAX_RESULTS);
  }, [query, items]);

  // The collection holds the already-filtered matches; the Combobox renders it
  // as-is (no built-in filtering) and handles opening/closing, click-outside,
  // Escape, and closing on select for us.
  const collection = useMemo(
    () =>
      createListCollection({
        items: matches,
        itemToValue: (item) => item.id,
        itemToString: (item) => item.id,
      }),
    [matches],
  );

  const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <VStack align="stretch" gap={4}>
      <Box position="sticky" top={0} zIndex={1} bg="bg" py={2}>
        <Combobox.Root
          collection={collection}
          openOnClick={false}
          selectionBehavior="clear"
          placeholder="Search the regulations…"
          onInputValueChange={(details) => setQuery(details.inputValue)}
          onValueChange={(details) => {
            const id = details.value[0];
            if (id) scrollToId(id);
          }}
        >
          <Combobox.Control>
            <Combobox.Input />
            <Combobox.IndicatorGroup>
              <LuSearch />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner>
              <Combobox.Content maxH="20rem" overflowY="auto">
                {hasQuery && (
                  <Combobox.Empty>No matching regulations.</Combobox.Empty>
                )}
                {collection.items.map((item) => (
                  <Combobox.Item item={item} key={item.id}>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="bold">{item.id}</Text>
                      <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                        {item.text}
                      </Text>
                    </VStack>
                    <Combobox.ItemIndicator />
                  </Combobox.Item>
                ))}
              </Combobox.Content>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>
      </Box>

      <Box
        onClick={handleContentClick}
        css={contentStyles}
        // The fragment comes from our own regulations API and is trusted; it
        // must be injected verbatim so every anchor id keeps working.
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </VStack>
  );
}
