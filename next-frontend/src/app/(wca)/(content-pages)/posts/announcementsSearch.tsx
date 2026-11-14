"use client";

import { Input, InputGroup, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { route } from "nextjs-routes";
import { useRef, useTransition } from "react";

const DEBOUNCE_MS = 300;

export default function AnnouncementsSearch({
  searchQuery,
}: {
  searchQuery?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const debounceTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = (query: string) => {
    clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(
      () =>
        startTransition(() =>
          router.replace(
            route({ pathname: "/posts", query: { q: query || undefined } }),
          ),
        ),
      DEBOUNCE_MS,
    );
  };

  return (
    <form action="/posts">
      <InputGroup endElement={isPending && <Spinner size="sm" />}>
        <Input
          type="search"
          name="q"
          defaultValue={searchQuery}
          placeholder="Search announcements"
          aria-label="Search announcements"
          onChange={(event) => search(event.target.value)}
        />
      </InputGroup>
    </form>
  );
}
