"use client";
import {
  Button,
  Checkbox,
  Combobox,
  createListCollection,
  Heading,
  Portal,
  VStack,
  Text,
} from "@chakra-ui/react";
import AttemptResultField from "@/app/(wca)/(with-background)/dashboard/AttemptResultField";
import _ from "lodash";
import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";
import { useLiveResults } from "@/providers/LiveResultProvider";
import { LiveCompetitor } from "@/types/live";
import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import type { KeyboardEvent, ReactNode, Ref } from "react";
import { attemptResultsWarning, meetsCutoff } from "@/lib/live/attempt-result";
import { useT } from "@/lib/i18n/useI18n";
import { useConfirm } from "@/providers/ConfirmProvider";
import { useRoundInfo } from "@/providers/RoundInfoProvider";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import formats from "@/lib/wca/data/formats";
import { FocusScope, useFocusManager } from "@react-aria/focus";

interface AttemptsFormProps {
  header: string;
}

const toCompetitorString = (competitor: LiveCompetitor) =>
  `${competitor.name} (${competitor.registrant_id})`;

export default function AttemptsForm({ header }: AttemptsFormProps) {
  const { t } = useT();

  const { id, format: formatId, cutoff } = useRoundInfo();
  const { eventId } = parseActivityCode(id);
  const format = formats.byId[formatId];
  const solveCount = format.expected_solve_count;

  const {
    handleRegistrationIdChange,
    handleSubmit,
    attempts,
    handleAttemptChange,
    registrationId,
    isPending,
    batchMode,
    setBatchMode,
    batchCount,
    submitBatch,
  } = useResultsAdmin();

  const confirm = useConfirm();

  const { competitors } = useLiveResults();

  const inputRef = useRef<HTMLInputElement>(null);
  const attemptFieldsRef = useRef<AttemptFieldsNavHandle>(null);

  const [filterText, setFilterText] = useState("");

  // Derived from `competitors` (instead of useListCollection's mount-time
  // snapshot) so websocket updates like quits are reflected in the dropdown.
  const collection = useMemo(() => {
    const items = Array.from(competitors.values())
      .toSorted((a, b) => a.registrant_id - b.registrant_id)
      .filter(
        (competitor) =>
          !filterText ||
          toCompetitorString(competitor)
            .toLowerCase()
            .includes(filterText.toLowerCase()) ||
          parseInt(filterText, 10) === competitor.registrant_id,
      );

    return createListCollection({
      items,
      itemToValue: (competitor) => competitor.id.toString(),
      itemToString: toCompetitorString,
    });
  }, [competitors, filterText]);

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
        content: <Text>{submissionWarning}</Text>,
        confirmButton: "Submit",
      }).then(() => handleSubmit(refocusInput));
    } else {
      handleSubmit(refocusInput);
    }
  }, [attempts, eventId, t, handleSubmit, confirm]);

  const batchConfirmation = useCallback(
    (e: Checkbox.CheckedChangeDetails) => {
      if (e.checked) {
        setBatchMode(true);
      } else {
        confirm({
          content: (
            <Text>
              Are you sure you want to exit Batch Mode? All unsubmitted results
              will be lost.
            </Text>
          ),
          confirmButton: "Confirm",
        }).then(() => setBatchMode(false));
      }
    },
    [confirm, setBatchMode],
  );

  const hasMetCutoff = meetsCutoff(attempts, cutoff);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <VStack align="left">
        <Combobox.Root
          collection={collection}
          onInputValueChange={(e) => setFilterText(e.inputValue)}
          inputValue={inputDisplayValue}
          onValueChange={(e) => {
            if (e.value.length > 0) {
              handleRegistrationIdChange(parseInt(e.value[0], 10));
              setTimeout(() => attemptFieldsRef.current?.focusFirst());
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
          <AttemptFieldsNav
            ref={attemptFieldsRef}
            onFocusCompetitor={() => inputRef.current?.focus()}
          >
            {_.times(solveCount).map((index) => (
              <AttemptResultField
                eventId={eventId}
                key={index}
                value={attempts[index]}
                onChange={(value) => handleAttemptChange(index, value)}
                resultType="single"
                placeholder={`Attempt ${index + 1}`}
                disabled={!hasMetCutoff && index >= cutoff!.numberOfAttempts}
              />
            ))}
          </AttemptFieldsNav>
          <Button
            onClick={confirmSubmission}
            disabled={isPending || attempts.length === 0}
          >
            {batchMode
              ? t("competitions.live.admin.add_to_batch")
              : t("competitions.live.admin.submit_results")}
          </Button>
          {batchMode && (
            <Button
              onClick={submitBatch}
              disabled={isPending || batchCount === 0}
            >
              {t("competitions.live.admin.submit_batch", { count: batchCount })}
            </Button>
          )}
        </FocusScope>
        <Checkbox.Root checked={batchMode} onCheckedChange={batchConfirmation}>
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>
            {t("competitions.live.admin.batch_mode")}
          </Checkbox.Label>
        </Checkbox.Root>
      </VStack>
    </form>
  );
}

interface AttemptFieldsNavHandle {
  focusFirst: () => void;
}

interface AttemptFieldsNavProps {
  children: ReactNode;
  onFocusCompetitor: () => void;
  ref?: Ref<AttemptFieldsNavHandle>;
}

function AttemptFieldsNav({
  children,
  onFocusCompetitor,
  ref,
}: AttemptFieldsNavProps) {
  const focusManager = useFocusManager();

  useImperativeHandle(
    ref,
    () => ({ focusFirst: () => focusManager?.focusFirst() }),
    [focusManager],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) return;

    if (e.key === " ") {
      e.preventDefault();
      onFocusCompetitor();
      return;
    }

    if (
      e.key === "Enter" ||
      e.key === "ArrowDown" ||
      e.code === "NumpadAdd" ||
      (e.key === "Tab" && !e.shiftKey)
    ) {
      e.preventDefault();
      const from = e.target as HTMLElement;
      // blur() can trigger onBlur handlers that update React state (e.g. saving the attempt).
      // flushSync ensures those updates are committed to the DOM before focusNext runs,
      // so the focus manager doesn't traverse a stale element tree.
      flushSync(() => from.blur());
      focusManager?.focusNext({ wrap: false, from });
      return;
    }

    if (
      e.key === "ArrowUp" ||
      e.code === "NumpadSubtract" ||
      (e.key === "Tab" && e.shiftKey)
    ) {
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
