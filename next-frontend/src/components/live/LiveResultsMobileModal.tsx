import {
  Button,
  CloseButton,
  DataList,
  Dialog,
  HStack,
  Link,
  VStack,
} from "@chakra-ui/react";
import { route } from "nextjs-routes";
import countries from "@/lib/wca/data/countries";
import React from "react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { recordTagBadge } from "@/components/results/TableCells";
import { CompetitorWithResults } from "@/lib/live/mergeAndOrderResults";
import { Stat } from "@/lib/live/statColumnsForFormat";
import { TFunction } from "i18next";

export default function LiveResultsMobileModal({
  selectedRow,
  setSelectedRow,
  competitionId,
  eventId,
  stats,
  t,
}: {
  selectedRow: CompetitorWithResults | null;
  setSelectedRow: (selectedRow: CompetitorWithResults | null) => void;
  competitionId: string;
  eventId: string;
  stats: Stat[];
  t: TFunction;
}) {
  const onOpenChange = ({ open }: { open: boolean }) => {
    if (!open) setSelectedRow(null);
  };

  return (
    <Dialog.Root
      open={selectedRow !== null}
      onOpenChange={onOpenChange}
      placement="center"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger />
          <Dialog.Header>
            <Dialog.Title>{selectedRow?.name}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            {selectedRow && (
              <DataList.Root orientation="vertical">
                <DataList.Item>
                  <DataList.ItemLabel>Name</DataList.ItemLabel>
                  <DataList.ItemValue>
                    <VStack>
                      {selectedRow.name}
                      <Link
                        href={route({
                          pathname:
                            "/competitions/[competitionId]/live/competitors/[registrationId]",
                          query: {
                            competitionId,
                            registrationId: selectedRow.id.toString(),
                          },
                        })}
                      >
                        All Results
                      </Link>
                    </VStack>
                  </DataList.ItemValue>
                </DataList.Item>
                <DataList.Item>
                  <DataList.ItemLabel>Country</DataList.ItemLabel>
                  <DataList.ItemValue>
                    <HStack>
                      {countries.byIso2[selectedRow.country_iso2].name}
                    </HStack>
                  </DataList.ItemValue>
                </DataList.Item>
                {selectedRow.results.map((r) => (
                  <React.Fragment key={r.round_wcif_id}>
                    <DataList.Item>
                      <DataList.ItemLabel>Attempts</DataList.ItemLabel>
                      <DataList.ItemValue>
                        {r.attempts
                          .map((a) => formatAttemptResult(a.value, eventId))
                          .join(", ")}
                      </DataList.ItemValue>
                    </DataList.Item>
                    {stats.map((stat) => (
                      <DataList.Item key={stat.i18nKey}>
                        <DataList.ItemLabel>
                          {t(stat.i18nKey)}
                        </DataList.ItemLabel>
                        <DataList.ItemValue>
                          {formatAttemptResult(r[stat.field], eventId)}{" "}
                          {recordTagBadge(r[stat.recordTagField])}
                        </DataList.ItemValue>
                      </DataList.Item>
                    ))}
                  </React.Fragment>
                ))}
              </DataList.Root>
            )}
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.ActionTrigger asChild>
              <Button variant="outline">Close</Button>
            </Dialog.ActionTrigger>
          </Dialog.Footer>
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
