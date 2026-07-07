"use client";

import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";
import useAPI from "@/lib/wca/useAPI";
import {
  Alert,
  Button,
  CloseButton,
  Combobox,
  createListCollection,
  Dialog,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LiveCompetitor } from "@/types/live";
import React, { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/useI18n";
import Loading from "@/components/ui/loading";
import { RegistrationData } from "@/types/registrations";

export default function AddPersonModal({
  competitionId,
  competitors,
  roundId,
}: {
  competitionId: string;
  roundId: string;
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
                roundId={roundId}
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
  roundId,
  setSelectedCompetitor,
}: {
  competitionId: string;
  roundId: string;
  competitors: Map<number, LiveCompetitor>;
  close: () => void;
  setSelectedCompetitor: (registrationId: number) => void;
}) {
  const { t } = useT();

  const api = useAPI();
  const { data: registrationsQuery, isFetching } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}/addable_competitors",
    { params: { path: { competitionId, roundId } } },
  );

  if (isFetching) return <Loading />;
  if (!registrationsQuery)
    return <Text>{t("competitions.registration_v2.errors.-1001")}</Text>;

  const { registrations, colinked_status, event_edits_allowed } =
    registrationsQuery;

  return (
    <AddPersonCombobox
      coLinkedStatus={colinked_status}
      registrations={registrations.filter((r) => !competitors.has(r.id))}
      setSelectedCompetitor={setSelectedCompetitor}
      eventEditsAllowed={event_edits_allowed}
      eventId={roundId.split("-r")[0]}
    />
  );
}

function AddPersonCombobox({
  registrations,
  setSelectedCompetitor,
  coLinkedStatus,
  eventEditsAllowed,
  eventId,
}: {
  setSelectedCompetitor: (registrationId: number) => void;
  registrations: RegistrationData[];
  coLinkedStatus: string[];
  eventEditsAllowed: boolean;
  eventId: string;
}) {
  const { t } = useT();

  const [filterText, setFilterText] = useState("");
  const [selected, setSelected] = useState<RegistrationData>();

  // Derived from `registrations` (instead of useListCollection's mount-time
  // snapshot) so the list stays correct when the dialog is reopened after
  // competitors were added or quit (the dialog stays mounted via lazyMount).
  const collection = useMemo(() => {
    const items = registrations
      .toSorted((a, b) => a.registrant_id - b.registrant_id)
      .filter(
        (competitor) =>
          !filterText ||
          competitor.user.name
            .toLowerCase()
            .includes(filterText.toLowerCase()) ||
          parseInt(filterText, 10) === competitor.registrant_id,
      );

    return createListCollection({
      items,
      itemToValue: (competitor) => competitor.id.toString(),
      itemToString: (competitor) => competitor.user.name,
    });
  }, [registrations, filterText]);

  const isDualRound = coLinkedStatus.length > 0;

  return (
    <VStack>
      <Text>
        {t(
          `competitions.live.admin.add_competitor.${isDualRound ? "multiple_rounds" : "single_round"}`,
          {
            count: coLinkedStatus.filter((s) => s === "open").length,
          },
        )}
      </Text>
      <Combobox.Root
        collection={collection}
        inputBehavior="autohighlight"
        onInputValueChange={(e) => setFilterText(e.inputValue)}
        onValueChange={(e) => {
          const registrationId = parseInt(e.value[0], 10);
          setSelectedCompetitor(registrationId);
          setSelected(registrations.find((r) => r.id === registrationId));
        }}
      >
        <Combobox.Control>
          <Combobox.Input placeholder="Type to search" />
          <Combobox.IndicatorGroup>
            <Combobox.ClearTrigger />
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>
        {/* No Portal: render inside Dialog.Content so option clicks don't
            retarget to the table rows behind the modal. */}
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
      </Combobox.Root>
      {!eventEditsAllowed &&
        selected &&
        !selected.competing.event_ids.includes(eventId) && (
          <Alert.Root status="warning">
            <Alert.Indicator />
            <Alert.Content>
              {t("competitions.live.admin.add_competitor.event_edit_warning")}
            </Alert.Content>
          </Alert.Root>
        )}
    </VStack>
  );
}
