"use client";

import { Button, Table } from "@chakra-ui/react";
import { useLiveResults } from "@/providers/LiveResultProvider";
import useAPI from "@/lib/wca/useAPI";
import { toaster } from "@/components/ui/toaster";
import { useConfirm } from "@/providers/ConfirmProvider";
import { useT } from "@/lib/i18n/useI18n";
import { Tooltip } from "@/components/ui/tooltip";

export default function BulkQuitButton({
  competitionId,
  roundId,
}: {
  competitionId: string;
  roundId: string;
}) {
  const { liveResultsByRegistrationId, pendingLiveResults, competitors } =
    useLiveResults();
  const api = useAPI();
  const { t } = useT();

  const confirm = useConfirm();

  const emptyRegistrationIds = Object.entries(liveResultsByRegistrationId)
    .filter(([, results]) => results.every((r) => r.attempts.length === 0))
    .map(([id]) => Number(id));

  const { mutate: bulkQuit, isPending } = api.useMutation(
    "delete",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/bulk_quit",
    {
      onSuccess: (data) => {
        toaster.create({
          description: t("competitions.live.admin.quit.bulk.success", {
            count: data.quit,
          }),
          type: "success",
        });
      },
      onError: () => {
        toaster.create({
          description: t("competitions.live.admin.quit.bulk.failure"),
          type: "error",
        });
      },
    },
  );

  const handleBulkQuit = () => {
    if (emptyRegistrationIds.length === 0) return;
    confirm({
      confirmButton: t("competitions.live.admin.quit.quit_confirm", {
        count: emptyRegistrationIds.length,
      }),
      content: (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>
                {t("competitions.live.admin.quit.bulk.id")}
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                {t("competitions.live.admin.quit.bulk.name")}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {emptyRegistrationIds.map((id) => {
              const competitor = competitors.get(id);
              return (
                <Table.Row key={id}>
                  <Table.Cell>{competitor?.registrant_id}</Table.Cell>
                  <Table.Cell>{competitor?.name}</Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      ),
    }).then(() =>
      bulkQuit({
        params: { path: { competitionId, roundId } },
        body: { registration_ids: emptyRegistrationIds },
      }),
    );
  };

  return (
    <Tooltip
      content={t("competitions.live.admin.quit.still_processing")}
      disabled={pendingLiveResults.length === 0}
    >
      <Button
        variant="outline"
        colorPalette="red"
        size="sm"
        disabled={
          emptyRegistrationIds.length === 0 ||
          isPending ||
          pendingLiveResults.length > 0
        }
        loading={isPending}
        onClick={handleBulkQuit}
      >
        {t("competitions.live.admin.quit.bulk.menu")}
      </Button>
    </Tooltip>
  );
}
