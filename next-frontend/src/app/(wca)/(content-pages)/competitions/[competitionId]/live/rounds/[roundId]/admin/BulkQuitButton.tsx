"use client";

import { useState } from "react";
import _ from "lodash";
import { Button, Checkbox, HStack, Table } from "@chakra-ui/react";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";
import { ConfirmDialog } from "@/providers/ConfirmProvider";
import { useLiveResults } from "@/providers/LiveResultProvider";
import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";
import useAPI from "@/lib/wca/useAPI";
import { toaster } from "@/components/ui/toaster";
import { useT } from "@/lib/i18n/useI18n";
import { Tooltip } from "@/components/ui/tooltip";

type SortColumn = "id" | "name";
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
  }>({ column: "id", direction: "asc" });

  const emptyCompetitors = Object.entries(liveResultsByRegistrationId)
    .filter(([, results]) => results.every((r) => r.attempts.length === 0))
    .map(([id]) => competitors.get(Number(id)))
    // Results and competitors arrive in the same round payload, so a miss
    // here would mean the backend omitted a competitor. Skip it rather than
    // rendering an empty row that could still be selected and quit.
    .filter((competitor) => competitor !== undefined)
    .filter((competitor) => !batchAttemptsByRegistrationId.has(competitor.id));

  const emptyRegistrationIds = emptyCompetitors.map(
    (competitor) => competitor.id,
  );

  const orderedCompetitors = _.orderBy(
    emptyCompetitors,
    (competitor) =>
      sort.column === "id"
        ? competitor.registrant_id
        : competitor.name.toLowerCase(),
    sort.direction,
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

  const allSelected =
    emptyRegistrationIds.length > 0 &&
    selected.size === emptyRegistrationIds.length;

  const someSelected = selected.size > 0;
  const selectAllState = allSelected || (someSelected && "indeterminate");

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(emptyRegistrationIds));

  const handleConfirm = () => {
    bulkQuit({
      params: { path: { competitionId, roundId } },
      body: { registration_ids: [...selected] },
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
          count: selected.size,
        })}
        confirmDisabled={selected.size === 0}
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
              <Table.ColumnHeader
                cursor="pointer"
                aria-sort={ariaSort("id")}
                onClick={() => toggleSort("id")}
              >
                <HStack gap="1">
                  {t("competitions.live.admin.quit.bulk.id")}
                  {sortIcon("id")}
                </HStack>
              </Table.ColumnHeader>
              <Table.ColumnHeader
                cursor="pointer"
                aria-sort={ariaSort("name")}
                onClick={() => toggleSort("name")}
              >
                <HStack gap="1">
                  {t("competitions.live.admin.quit.bulk.name")}
                  {sortIcon("name")}
                </HStack>
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
