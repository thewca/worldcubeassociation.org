"use client";

import { Button } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BookmarkIcon from "@/components/icons/BookmarkIcon";
import { Tooltip } from "@/components/ui/tooltip";
import { useT } from "@/lib/i18n/useI18n";
import useAPI from "@/lib/wca/useAPI";
import { SERVER_SEEDED_STALE_TIME } from "@/providers/WCAQueryClientProvider";
import { components } from "@/types/openapi";

type CompetitionBookmark = components["schemas"]["CompetitionBookmark"];

export default function BookmarkButton({
  competitionId,
  initialBookmark,
}: {
  competitionId: string;
  initialBookmark: CompetitionBookmark;
}) {
  const { t } = useT();
  const api = useAPI();
  const queryClient = useQueryClient();

  const bookmarkQueryOptions = api.queryOptions(
    "get",
    "/v1/competitions/{competitionId}/bookmark",
    { params: { path: { competitionId } } },
  );

  const { data: bookmark } = useQuery({
    ...bookmarkQueryOptions,
    initialData: initialBookmark,
    refetchOnMount: true,
    staleTime: SERVER_SEEDED_STALE_TIME,
  });

  const onSuccess = (updatedBookmark: CompetitionBookmark) =>
    queryClient.setQueryData(bookmarkQueryOptions.queryKey, updatedBookmark);

  const addBookmark = api.useMutation(
    "post",
    "/v1/competitions/{competitionId}/bookmark",
    { onSuccess },
  );

  const removeBookmark = api.useMutation(
    "delete",
    "/v1/competitions/{competitionId}/bookmark",
    { onSuccess },
  );

  const toggleMutation = bookmark.bookmarked ? removeBookmark : addBookmark;
  const label = bookmark.bookmarked
    ? t("competitions.competition_info.is_bookmarked")
    : t("competitions.competition_info.bookmark");

  return (
    <Tooltip content={label}>
      <Button
        variant={bookmark.bookmarked ? "solid" : "ghost"}
        aria-label={label}
        aria-pressed={bookmark.bookmarked}
        loading={addBookmark.isPending || removeBookmark.isPending}
        onClick={() =>
          toggleMutation.mutate({ params: { path: { competitionId } } })
        }
      >
        <BookmarkIcon boxSize="6" />
      </Button>
    </Tooltip>
  );
}
