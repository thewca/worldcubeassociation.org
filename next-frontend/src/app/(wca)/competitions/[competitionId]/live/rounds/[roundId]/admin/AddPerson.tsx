"use client";

import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";
import useAPI from "@/lib/wca/useAPI";
import {
  Button,
  CloseButton,
  Combobox,
  Dialog,
  Portal,
  Text,
  useListCollection,
  VStack,
} from "@chakra-ui/react";
import { LiveCompetitor } from "@/types/live";
import React, { useState } from "react";
import { useT } from "@/lib/i18n/useI18n";
import Loading from "@/components/ui/loading";
import { RegistrationData } from "@/types/registrations";

export default function AddPersonModal({
  competitionId,
  competitors,
}: {
  competitionId: string;
  competitors: Map<number, LiveCompetitor>;
}) {
  const [open, setOpen] = useState(false);

  const [selectedCompetitor, setSelectedCompetitor] = useState<number>();
  const { addCompetitorToRound, isPending } = useResultsAdmin();

  return (
    <Dialog.Root lazyMount open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button variant="outline">Add Competitor</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Add Competitor</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <AddPerson
                competitionId={competitionId}
                competitors={competitors}
                close={() => setOpen(false)}
                setSelectedCompetitor={setSelectedCompetitor}
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                disabled={!selectedCompetitor || isPending}
                onClick={() =>
                  addCompetitorToRound(selectedCompetitor!).then(() =>
                    setOpen(false),
                  )
                }
              >
                Add Competitor to Round
              </Button>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
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

function AddPerson({
  competitionId,
  competitors,
  setSelectedCompetitor,
}: {
  competitionId: string;
  competitors: Map<number, LiveCompetitor>;
  close: () => void;
  setSelectedCompetitor: (registrationId: number) => void;
}) {
  const { t } = useT();

  const api = useAPI();
  const { data: registrationsQuery, isFetching } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/registrations",
    { params: { path: { competitionId } } },
  );

  if (isFetching) return <Loading />;
  if (!registrationsQuery)
    return <Text>{t("competitions.registration_v2.errors.-1001")}</Text>;

  return (
    <AddPersonCombobox
      registrations={registrationsQuery.filter((r) => !competitors.has(r.id))}
      setSelectedCompetitor={setSelectedCompetitor}
    />
  );
}

function AddPersonCombobox({
  registrations,
  setSelectedCompetitor,
}: {
  setSelectedCompetitor: (registrationId: number) => void;
  registrations: RegistrationData[];
}) {
  const { collection, filter } = useListCollection({
    initialItems: registrations.toSorted(
      (a, b) => a.registrant_id - b.registrant_id,
    ),
    itemToValue: (competitor) => competitor.id.toString(),
    itemToString: (competitor) => competitor.user.name,
    filter: (itemText, filterText, item) =>
      itemText.toLowerCase().includes(filterText.toLowerCase()) ||
      parseInt(filterText, 10) === item.registrant_id,
  });

  return (
    <VStack>
      <Combobox.Root
        collection={collection}
        inputBehavior="autohighlight"
        onInputValueChange={(e) => filter(e.inputValue)}
        onValueChange={(e) => setSelectedCompetitor(parseInt(e.value[0], 10))}
      >
        <Combobox.Control>
          <Combobox.Input placeholder="Type to search" />
          <Combobox.IndicatorGroup>
            <Combobox.ClearTrigger />
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>
        <Portal>
          <Combobox.Positioner>
            <Combobox.Content>
              <Combobox.Empty>
                All Competitors are already Part of the Round
              </Combobox.Empty>
              {collection.items.map((item) => (
                <Combobox.Item item={item} key={item.id}>
                  {`${item.user.name} (${item.registrant_id})`}
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>
    </VStack>
  );
}
