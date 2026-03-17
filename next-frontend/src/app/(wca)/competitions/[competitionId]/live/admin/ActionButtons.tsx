"use client";

import { components } from "@/types/openapi";
import { Button } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";

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
        Open
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
        Clear
      </Button>
    );
  }

  return undefined;
}
