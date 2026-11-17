"use client";

import { Input, InputGroup, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { route } from "nextjs-routes";
import { useEffect, useState, useTransition } from "react";
import { useT } from "@/lib/i18n/useI18n";
import useDebounce from "@/lib/hooks/useDebounce";

const DEBOUNCE_MS = 300;

export default function AnnouncementsSearch({
  searchQuery,
}: {
  searchQuery?: string;
}) {
  const router = useRouter();
  const { t } = useT();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchQuery ?? "");
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedQuery === (searchQuery ?? "")) return;

    const searchRoute = route({
      pathname: "/posts",
      query: { q: debouncedQuery || undefined },
    });

    startTransition(() => router.replace(searchRoute));
  }, [debouncedQuery, searchQuery, router]);

  return (
    <form action="/posts">
      <InputGroup endElement={isPending && <Spinner size="sm" />}>
        <Input
          type="search"
          name="q"
          value={query}
          placeholder={t("posts.search")}
          aria-label={t("posts.search")}
          onChange={(event) => setQuery(event.target.value)}
        />
      </InputGroup>
    </form>
  );
}
