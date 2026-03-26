"use client";

import { components } from "@/types/openapi";
import { Button } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";

export default function ActionButtons({
  state,
  roundId,
  competitionId,
}: {
  state: components["schemas"]["LiveRoundAdmin"]["state"];
  roundId: string;
  competitionId: string;
}) {
  const api = useAPI();

  const { isPending: isPendingOpen, mutate: openRound } = api.useMutation(
    "put",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/open",
  );

  const { isPending: isPendingClear, mutate: clearRound } = api.useMutation(
    "put",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/clear",
  );

  const { t } = useT();

  if (state == "ready") {
    return (
      <Button
        variant="outline"
        size="sm"
        loading={isPendingOpen}
        onClick={() =>
          openRound({ params: { path: { roundId, competitionId } } })
        }
      >
        {t("competitions.live.admin.open")}
      </Button>
    );
  }

  if (state == "open") {
    return (
      <Button
        variant="outline"
        size="sm"
        loading={isPendingClear}
        onClick={() =>
          clearRound({ params: { path: { roundId, competitionId } } })
        }
      >
        {t("competitions.live.admin.clear")}
      </Button>
    );
  }

  return undefined;
}
