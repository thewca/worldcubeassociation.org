"use client";

import { Button } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { toaster } from "@/components/ui/toaster";
import { LiveRoundState } from "@/types/live";
import { useT } from "@/lib/i18n/useI18n";
import { useConfirm } from "@/providers/ConfirmProvider";

export default function ActionButtons({
  state,
  setState,
  roundId,
  competitionId,
  hasResultsEntered,
}: {
  state: LiveRoundState;
  setState: (state: LiveRoundState) => void;
  roundId: string;
  competitionId: string;
  hasResultsEntered: boolean;
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
      onError: (error) => {
        toaster.create({
          description:
            "status" in error ? error.status : "Round opening failed.",
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

  const { isPending: isPendingClose, mutate: closeRound } = api.useMutation(
    "delete",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/close",
    {
      onSuccess: () => {
        toaster.create({
          description: "Round Closed",
          type: "success",
        });
        setState("ready");
      },
      onError: () => {
        toaster.create({
          description: "Round closing failed",
          type: "error",
        });
      },
    },
  );

  const { t } = useT();

  const confirm = useConfirm();

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
    if (!hasResultsEntered) {
      return (
        <Button
          variant="outline"
          size="sm"
          loading={isPendingClose}
          onClick={() =>
            confirm({ confirmButton: t("competitions.live.admin.close") }).then(
              () =>
                closeRound({ params: { path: { roundId, competitionId } } }),
            )
          }
        >
          {t("competitions.live.admin.close")}
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        loading={isPendingClear}
        onClick={() =>
          confirm({ confirmButton: t("competitions.live.admin.clear") }).then(
            () => clearRound({ params: { path: { roundId, competitionId } } }),
          )
        }
      >
        {t("competitions.live.admin.clear")}
      </Button>
    );
  }

  return undefined;
}
