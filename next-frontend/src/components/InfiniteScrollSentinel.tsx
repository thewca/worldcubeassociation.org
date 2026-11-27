"use client";

import { Box, Text } from "@chakra-ui/react";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import { useOnInView } from "react-intersection-observer";
import Loading from "@/components/ui/loading";
import { useT } from "@/lib/i18n/useI18n";

type InfiniteScrollSentinelProps = Pick<
  UseInfiniteQueryResult,
  "hasNextPage" | "isFetchingNextPage" | "isFetchNextPageError"
> & { fetchNextPage: () => void };

export default function InfiniteScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  fetchNextPage,
}: InfiniteScrollSentinelProps) {
  const { t } = useT();

  const bottomRef = useOnInView((inView) => {
    if (inView) {
      fetchNextPage();
    }
  });

  if (isFetchingNextPage) {
    return (
      <Box width="full">
        <Loading />
      </Box>
    );
  }

  // Mounting the sentinel again would immediately repeat the failed request.
  if (isFetchNextPageError) {
    return <Text>{t("errors.next_frontend.title")}</Text>;
  }

  return hasNextPage && <Box ref={bottomRef} />;
}
