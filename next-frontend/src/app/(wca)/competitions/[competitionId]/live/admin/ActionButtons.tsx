"use client";

import { Button } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { toaster } from "@/components/ui/toaster";
import { LiveRoundState } from "@/types/live";
import { useT } from "@/lib/i18n/useI18n";
import { useConfirm } from "@/providers/ConfirmProvider";
import { useAllRoundsInfo } from "@/providers/RoundInfoProvider";

export default function ActionButtons({
  state,
  roundId,
  competitionId,
}: {
  state: LiveRoundState;
  roundId: string;
  competitionId: string;
}) {
  const api = useAPI();
  const { refetch } = useAllRoundsInfo();

  const { isPending: isPendingOpen, mutate: openRound } = api.useMutation(
    "put",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/open",
    {
      onSuccess: () => {
        toaster.create({
          description: "Round Opened",
          type: "success",
        });
        refetch();
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
        refetch();
      },
      onError: () => {
        toaster.create({
          description: "Round clearing failed",
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
