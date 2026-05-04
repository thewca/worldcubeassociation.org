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
import { useCallback, useLayoutEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
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

  // Keep a ref to the latest confirmSubmission so deferred callbacks (via
  // setTimeout) always call the version that captures the most recent state.
  const confirmSubmissionRef = useRef(confirmSubmission);
  useLayoutEffect(() => {
    confirmSubmissionRef.current = confirmSubmission;
  });

  const attemptRefs = useRef<(HTMLInputElement | null)[]>([]);
  const competitorInputRef = useRef<HTMLInputElement | null>(null);

  const handleAttemptKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      // Let the form-level handler deal with Ctrl/Meta combos.
      if (e.ctrlKey || e.metaKey) return;

      if (e.key === " ") {
        e.preventDefault();
        competitorInputRef.current?.focus();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (index === solveCount - 1) {
          // Blur first to commit the current draft value, then submit after
          // React has flushed the resulting state update.
          e.currentTarget.blur();
          setTimeout(() => confirmSubmissionRef.current(), 0);
        } else {
          attemptRefs.current[index + 1]?.focus();
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (index < solveCount - 1) {
          attemptRefs.current[index + 1]?.focus();
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (index > 0) {
          attemptRefs.current[index - 1]?.focus();
        }
        return;
      }
    },
    [solveCount],
  );

  const handleFormKeyDown = useCallback((e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const focused = document.activeElement as HTMLElement | null;
      focused?.blur();
      setTimeout(() => confirmSubmissionRef.current(), 0);
    }
  }, []);

  return (
    <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleFormKeyDown}>
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
            <Combobox.Input
              ref={competitorInputRef}
              placeholder="Type to search"
            />
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
            attemptRef={(el: HTMLInputElement | null) => {
              attemptRefs.current[index] = el;
            }}
            eventId={eventId}
            key={index}
            value={attempts[index]}
            onChange={(value) => handleAttemptChange(index, value)}
            resultType="single"
            placeholder={`Attempt ${index + 1}`}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
              handleAttemptKeyDown(index, e)
            }
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
