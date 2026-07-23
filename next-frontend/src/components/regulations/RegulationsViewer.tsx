"use client";

import {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, Input, InputGroup, Text, VStack } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 50;

interface SearchItem {
  id: string;
  text: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [query, setQuery] = useState("");

  // Once the fragment is in the DOM, index each regulation for searching and
  // honor the initial deep-link hash (the browser doesn't always scroll to it
  // after client-side hydration).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setItems(
      Array.from(container.querySelectorAll<HTMLElement>("li[id]")).map(
        (el) => ({
          id: el.id,
          text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
        }),
      ),
    );

    const hashId = decodeURIComponent(window.location.hash.slice(1));
    if (hashId) {
      document.getElementById(hashId)?.scrollIntoView();
    }
  }, [contentHtml]);

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

  const showEmpty =
    query.trim().length >= MIN_QUERY_LENGTH && matches.length === 0;

  return (
    <VStack align="stretch" gap={4}>
      <Box position="sticky" top={0} zIndex={1} bg="bg" py={2}>
        <InputGroup startElement={<LuSearch />}>
          <Input
            placeholder="Search the regulations…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>

        {matches.length > 0 && (
          <VStack
            align="stretch"
            gap={0}
            mt={2}
            maxH="20rem"
            overflowY="auto"
            borderWidth="1px"
            borderRadius="md"
          >
            {matches.map((item) => (
              <Box
                key={item.id}
                as="button"
                textAlign="left"
                px={3}
                py={2}
                borderBottomWidth="1px"
                _last={{ borderBottomWidth: 0 }}
                _hover={{ bg: "bg.muted" }}
                onClick={() => scrollToId(item.id)}
              >
                <Text fontWeight="bold">{item.id}</Text>
                <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                  {item.text}
                </Text>
              </Box>
            ))}
          </VStack>
        )}

        {showEmpty && (
          <Text mt={2} color="fg.muted">
            No matching regulations.
          </Text>
        )}
      </Box>

      <Box
        ref={containerRef}
        onClick={handleContentClick}
        css={contentStyles}
        // The fragment comes from our own regulations API and is trusted; it
        // must be injected verbatim so every anchor id keeps working.
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </VStack>
  );
}
