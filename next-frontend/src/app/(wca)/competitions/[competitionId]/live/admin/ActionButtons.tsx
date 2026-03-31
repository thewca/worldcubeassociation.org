"use client";

import { Button } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { toaster } from "@/components/ui/toaster";
import { LiveRoundState } from "@/types/live";

export default function ActionButtons({
  state,
  setState,
  roundId,
  competitionId,
}: {
  state: LiveRoundState;
  setState: (state: LiveRoundState) => void;
  roundId: string;
  competitionId: string;
}) {
  const api = useAPI();

  const { isPending: isPendingOpen, mutate: openRound } = api.useMutation(
    "put",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/open",
    {
      onSuccess: () => {
        toaster.create({
          description: "Round Opened",
          type: "success",
        });
        setState("open");
      },
      onError: () => {
        toaster.create({
          description: "Round opening failed",
          type: "error",
        });
      },
    },
  );

  const { isPending: isPendingClear, mutate: clearRound } = api.useMutation(
    "put",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/clear",
    {
      onSuccess: () => {
        toaster.create({
          description: "Round Cleared",
          type: "success",
        });
      },
      onError: () => {
        toaster.create({
          description: "Round clearing failed",
          type: "error",
        });
      },
    },
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
