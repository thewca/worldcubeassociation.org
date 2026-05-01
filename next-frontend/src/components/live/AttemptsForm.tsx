"use client";
import {
  Button,
  Combobox,
  Heading,
  Portal,
  useListCollection,
  VStack,
} from "@chakra-ui/react";
import AttemptResultField from "@/app/(wca)/dashboard/AttemptResultField";
import _ from "lodash";
import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";
import { useLiveResults } from "@/providers/LiveResultProvider";
import { LiveCompetitor } from "@/types/live";
import { useCallback } from "react";
import { attemptResultsWarning } from "@/lib/live/attempt-result";
import { useT } from "@/lib/i18n/useI18n";
import { useConfirm } from "@/providers/ConfirmProvider";

interface AttemptsFormProps {
  solveCount: number;
  header: string;
  eventId: string;
}

const toCompetitorString = (competitor: LiveCompetitor) =>
  `${competitor.name} (${competitor.registrant_id})`;

export default function AttemptsForm({
  solveCount,
  header,
  eventId,
}: AttemptsFormProps) {
  const { t } = useT();

  const {
    handleRegistrationIdChange,
    handleSubmit,
    attempts,
    handleAttemptChange,
    registrationId,
    isPending,
  } = useResultsAdmin();

  const confirm = useConfirm();

  const { competitors } = useLiveResults();

  const { collection, filter } = useListCollection({
    initialItems: Array.from(competitors.values()),
    itemToValue: (competitor) => competitor.id.toString(),
    itemToString: toCompetitorString,
    filter: (itemText, filterText, item) =>
      itemText.toLowerCase().includes(filterText.toLowerCase()) ||
      parseInt(filterText, 10) === item.registrant_id,
  });

  const selectedCompetitor = registrationId
    ? competitors.get(registrationId)
    : undefined;
  const inputDisplayValue = selectedCompetitor
    ? toCompetitorString(selectedCompetitor)
    : "";

  const confirmSubmission = useCallback(() => {
    const submissionWarning = attemptResultsWarning(attempts, eventId, t);

    if (submissionWarning) {
      confirm({
        content: submissionWarning,
        confirmButton: "Submit",
      }).then(() => handleSubmit());
    } else {
      handleSubmit();
    }
  }, [attempts, eventId, t, handleSubmit, confirm]);

  return (
    <form>
      <VStack align="left">
        <Combobox.Root
          collection={collection}
          onInputValueChange={(e) => filter(e.inputValue)}
          inputValue={inputDisplayValue}
          onValueChange={(e) => {
            if (e.value.length > 0) {
              handleRegistrationIdChange(parseInt(e.value[0], 10));
            }
          }}
          value={registrationId ? [registrationId.toString()] : []}
          inputBehavior="autohighlight"
        >
          <Combobox.Label>
            <Heading size="2xl">{header}</Heading>
          </Combobox.Label>
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
                <Combobox.Empty>No items found</Combobox.Empty>
                {collection.items.map((item) => (
                  <Combobox.Item item={item} key={item.id}>
                    {toCompetitorString(item)}
                    <Combobox.ItemIndicator />
                  </Combobox.Item>
                ))}
              </Combobox.Content>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>
        {_.times(solveCount).map((index) => (
          <AttemptResultField
            eventId={eventId}
            key={index}
            value={attempts[index]}
            onChange={(value) => handleAttemptChange(index, value)}
            resultType="single"
            placeholder={`Attempt ${index + 1}`}
          />
        ))}
        <Button
          onClick={confirmSubmission}
          disabled={isPending || attempts.length === 0}
        >
          Submit Results
        </Button>
      </VStack>
    </form>
  );
}
