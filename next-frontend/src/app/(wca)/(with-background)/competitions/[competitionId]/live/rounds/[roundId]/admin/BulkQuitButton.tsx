"use client";

import { useState } from "react";
import {
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Portal,
  Table,
} from "@chakra-ui/react";
import { useLiveResults } from "@/providers/LiveResultProvider";
import useAPI from "@/lib/wca/useAPI";
import { toaster } from "@/components/ui/toaster";
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

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

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

  const openDialog = () => {
    setSelected(new Set(emptyRegistrationIds));
    setOpen(true);
  };

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const handleConfirm = () => {
    bulkQuit({
      params: { path: { competitionId, roundId } },
      body: { registration_ids: [...selected] },
    });
    setOpen(false);
  };

  return (
    <Dialog.Root
      lazyMount
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      size="md"
    >
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
          onClick={openDialog}
        >
          {t("competitions.live.admin.quit.bulk.menu")}
        </Button>
      </Tooltip>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {t("competitions.live.admin.quit.bulk.menu")}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader />
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
                        <Table.Cell>
                          <Checkbox.Root
                            checked={selected.has(id)}
                            onCheckedChange={() => toggle(id)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                          </Checkbox.Root>
                        </Table.Cell>
                        <Table.Cell>{competitor?.registrant_id}</Table.Cell>
                        <Table.Cell>{competitor?.name}</Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">
                  {t("competitions.live.admin.quit.cancel")}
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="red"
                disabled={selected.size === 0}
                onClick={handleConfirm}
              >
                {t("competitions.live.admin.quit.quit_confirm", {
                  count: selected.size,
                })}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
