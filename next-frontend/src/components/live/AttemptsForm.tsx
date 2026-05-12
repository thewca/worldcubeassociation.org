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
import { LiveCompetitor, LiveRoundAdminBase } from "@/types/live";
import { useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import type { KeyboardEvent, ReactNode } from "react";
import { attemptResultsWarning, meetsCutoff } from "@/lib/live/attempt-result";
import { useT } from "@/lib/i18n/useI18n";
import { useConfirm } from "@/providers/ConfirmProvider";
import { FocusScope, useFocusManager } from "@react-aria/focus";

interface AttemptsFormProps {
  solveCount: number;
  header: string;
  eventId: string;
  cutoff?: LiveRoundAdminBase["cutoff"];
}

const toCompetitorString = (competitor: LiveCompetitor) =>
  `${competitor.name} (${competitor.registrant_id})`;

export default function AttemptsForm({
  solveCount,
  cutoff,
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

  const inputRef = useRef<HTMLInputElement>(null);

  const { collection, filter } = useListCollection({
    initialItems: Array.from(competitors.values()).toSorted(
      (a, b) => a.registrant_id - b.registrant_id,
    ),
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
    const refocusInput = () => inputRef.current?.focus();

    if (submissionWarning) {
      confirm({
        content: submissionWarning,
        confirmButton: "Submit",
      }).then(() => handleSubmit(refocusInput));
    } else {
      handleSubmit(refocusInput);
    }
  }, [attempts, eventId, t, handleSubmit, confirm]);

  const hasMetCutoff = meetsCutoff(attempts, cutoff);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <VStack align="left">
        <Combobox.Root
          collection={collection}
          onInputValueChange={(e) => filter(e.inputValue)}
          inputValue={inputDisplayValue}
          onValueChange={(e) => {
            if (e.value.length > 0) {
              handleRegistrationIdChange(parseInt(e.value[0], 10));
            } else {
              handleRegistrationIdChange(undefined);
            }
          }}
          value={registrationId ? [registrationId.toString()] : []}
          inputBehavior="autohighlight"
        >
          <Combobox.Label>
            <Heading size="2xl">{header}</Heading>
          </Combobox.Label>
          <Combobox.Control>
            <Combobox.Input ref={inputRef} placeholder="Type to search" />
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
        <FocusScope>
          <AttemptFieldsNav onFocusCompetitor={() => inputRef.current?.focus()}>
            {_.times(solveCount).map((index) => (
              <AttemptResultField
                eventId={eventId}
                key={index}
                value={attempts[index]}
                onChange={(value) => handleAttemptChange(index, value)}
                resultType="single"
                placeholder={`Attempt ${index + 1}`}
                disabled={!hasMetCutoff && index > 1}
              />
            ))}
          </AttemptFieldsNav>
          <Button
            onClick={confirmSubmission}
            disabled={isPending || attempts.length === 0}
          >
            Submit Results
          </Button>
        </FocusScope>
      </VStack>
    </form>
  );
}

interface AttemptFieldsNavProps {
  children: ReactNode;
  onFocusCompetitor: () => void;
}

function AttemptFieldsNav({
  children,
  onFocusCompetitor,
}: AttemptFieldsNavProps) {
  const focusManager = useFocusManager();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) return;

    if (e.key === " ") {
      e.preventDefault();
      onFocusCompetitor();
      return;
    }

    if (e.key === "Enter" || e.key === "ArrowDown" || e.code === "NumpadAdd") {
      e.preventDefault();
      const from = e.target as HTMLElement;
      flushSync(() => from.blur());
      focusManager?.focusNext({ wrap: false, from });
      return;
    }

    if (e.key === "ArrowUp" || e.code === "NumpadSubtract") {
      e.preventDefault();
      const from = e.target as HTMLElement;
      flushSync(() => from.blur());
      focusManager?.focusPrevious({ wrap: false, from });
    }
  };

  return (
    <VStack align="left" onKeyDown={handleKeyDown}>
      {children}
    </VStack>
  );
}
