"use client";

import { useState } from "react";
import { Button, Checkbox, Table } from "@chakra-ui/react";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";
import { ConfirmDialog } from "@/providers/ConfirmProvider";
import { useLiveResults } from "@/providers/LiveResultProvider";
import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";
import { LiveCompetitor } from "@/types/live";
import useAPI from "@/lib/wca/useAPI";
import { toaster } from "@/components/ui/toaster";
import { useT } from "@/lib/i18n/useI18n";
import { Tooltip } from "@/components/ui/tooltip";

type SortColumn = "registrant_id" | "name";
type SortDirection = "asc" | "desc";

export default function BulkQuitButton({
  competitionId,
  roundId,
}: {
  competitionId: string;
  roundId: string;
}) {
  const { liveResultsByRegistrationId, pendingLiveResults, competitors } =
    useLiveResults();
  const { batchAttemptsByRegistrationId } = useResultsAdmin();
  const api = useAPI();
  const { t } = useT();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sort, setSort] = useState<{
    column: SortColumn;
    direction: SortDirection;
  }>({ column: "registrant_id", direction: "asc" });

  const emptyCompetitors = Array.from(competitors.values()).filter(
    (competitor) =>
      liveResultsByRegistrationId[competitor.id]?.every(
        (r) => r.attempts.length === 0,
      ) && !batchAttemptsByRegistrationId.has(competitor.id),
  );

  const emptyRegistrationIds = emptyCompetitors.map(
    (competitor) => competitor.id,
  );

  const compareCompetitors = (a: LiveCompetitor, b: LiveCompetitor) =>
    sort.column === "registrant_id"
      ? a.registrant_id - b.registrant_id
      : a.name.localeCompare(b.name);

  const orderedCompetitors = emptyCompetitors.toSorted((a, b) =>
    sort.direction === "asc"
      ? compareCompetitors(a, b)
      : compareCompetitors(b, a),
  );

  const toggleSort = (column: SortColumn) =>
    setSort((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));

  const ariaSort = (column: SortColumn) => {
    if (sort.column !== column) return "none";
    return sort.direction === "asc" ? "ascending" : "descending";
  };

  const sortIcon = (column: SortColumn) => {
    if (sort.column !== column) return null;
    return sort.direction === "asc" ? <LuArrowUp /> : <LuArrowDown />;
  };

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
    setSelected(new Set());
    setOpen(true);
  };

  const toggle = (registrationId: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(registrationId)) {
        next.delete(registrationId);
      } else {
        next.add(registrationId);
      }
      return next;
    });

  // A competitor can receive results while the dialog is open, so only
  // count selections that are still eligible for bulk quitting.
  const selectedRegistrationIds = emptyRegistrationIds.filter(
    (registrationId) => selected.has(registrationId),
  );

  const allSelected =
    emptyRegistrationIds.length > 0 &&
    selectedRegistrationIds.length === emptyRegistrationIds.length;

  const someSelected = selectedRegistrationIds.length > 0;
  const selectAllState = allSelected || (someSelected && "indeterminate");

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(emptyRegistrationIds));

  const handleConfirm = () => {
    bulkQuit({
      params: { path: { competitionId, roundId } },
      body: { registration_ids: selectedRegistrationIds },
    });
    setOpen(false);
  };

  return (
    <>
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
      <ConfirmDialog
        lazyMount
        size="md"
        open={open}
        title={t("competitions.live.admin.quit.bulk.menu")}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
        cancelButton={t("competitions.live.admin.quit.cancel")}
        confirmButton={t("competitions.live.admin.quit.quit_confirm", {
          count: selectedRegistrationIds.length,
        })}
        confirmDisabled={!someSelected}
      >
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>
                <Checkbox.Root
                  aria-label={t("competitions.live.admin.quit.bulk.select_all")}
                  checked={selectAllState}
                  onCheckedChange={toggleAll}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              </Table.ColumnHeader>
              <Table.ColumnHeader aria-sort={ariaSort("registrant_id")}>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => toggleSort("registrant_id")}
                >
                  {t("competitions.live.admin.quit.bulk.id")}
                  {sortIcon("registrant_id")}
                </Button>
              </Table.ColumnHeader>
              <Table.ColumnHeader aria-sort={ariaSort("name")}>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => toggleSort("name")}
                >
                  {t("competitions.live.admin.quit.bulk.name")}
                  {sortIcon("name")}
                </Button>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {orderedCompetitors.map((competitor) => (
              <Table.Row key={competitor.id}>
                <Table.Cell>
                  <Checkbox.Root
                    aria-label={competitor.name}
                    checked={selected.has(competitor.id)}
                    onCheckedChange={() => toggle(competitor.id)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.Cell>
                <Table.Cell>{competitor.registrant_id}</Table.Cell>
                <Table.Cell>{competitor.name}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </ConfirmDialog>
    </>
  );
}
