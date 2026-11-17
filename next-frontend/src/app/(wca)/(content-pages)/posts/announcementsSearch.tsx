"use client";

import { Input, InputGroup, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { route } from "nextjs-routes";
import { useRef, useTransition } from "react";
import { useT } from "@/lib/i18n/useI18n";

const DEBOUNCE_MS = 300;

export default function AnnouncementsSearch({
  searchQuery,
}: {
  searchQuery?: string;
}) {
  const router = useRouter();
  const { t } = useT();
  const [isPending, startTransition] = useTransition();
  const debounceTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = (query: string) => {
    clearTimeout(debounceTimeout.current);

    const searchRoute = route({
      pathname: "/posts",
      query: { q: query || undefined },
    });
    const navigate = () => startTransition(() => router.replace(searchRoute));

    debounceTimeout.current = setTimeout(navigate, DEBOUNCE_MS);
  };

  return (
    <form action="/posts">
      <InputGroup endElement={isPending && <Spinner size="sm" />}>
        <Input
          type="search"
          name="q"
          defaultValue={searchQuery}
          placeholder={t("posts.search")}
          aria-label={t("posts.search")}
          onChange={(event) => search(event.target.value)}
        />
      </InputGroup>
    </form>
  );
}
