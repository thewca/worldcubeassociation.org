"use client";

import { Button } from "@chakra-ui/react";
import { useLiveResults } from "@/providers/LiveResultProvider";
import useAPI from "@/lib/wca/useAPI";
import { toaster } from "@/components/ui/toaster";

export default function BulkQuitButton({
  competitionId,
  roundId,
}: {
  competitionId: string;
  roundId: string;
}) {
  const { liveResultsByRegistrationId } = useLiveResults();
  const api = useAPI();

  const emptyRegistrationIds = Object.entries(liveResultsByRegistrationId)
    .filter(([, results]) => results.every((r) => r.attempts.length === 0))
    .map(([id]) => Number(id));

  const { mutate: bulkQuit, isPending } = api.useMutation(
    "delete",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/bulk_quit",
    {
      onSuccess: (data) => {
        toaster.create({
          description: `Successfully quit ${data.quit} competitor(s)`,
          type: "success",
        });
      },
      onError: () => {
        toaster.create({
          description: "Failed to bulk quit competitors",
          type: "error",
        });
      },
    },
  );

  const handleBulkQuit = () => {
    if (emptyRegistrationIds.length === 0) return;
    if (
      !confirm(
        `Quit ${emptyRegistrationIds.length} competitor(s) with no results?`,
      )
    )
      return;
    bulkQuit({
      params: { path: { competitionId, roundId } },
      body: { registration_ids: emptyRegistrationIds },
    });
  };

  return (
    <Button
      variant="outline"
      colorPalette="red"
      size="sm"
      disabled={emptyRegistrationIds.length === 0 || isPending}
      loading={isPending}
      onClick={handleBulkQuit}
    >
      Bulk Quit ({emptyRegistrationIds.length})
    </Button>
  );
}
