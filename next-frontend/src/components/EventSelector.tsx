"use client";

import { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import {
  Button,
  ButtonGroup,
  CheckboxCard,
  CheckboxGroup,
  Fieldset,
  RadioCard,
  VisuallyHidden,
  Wrap,
  Stack,
} from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import { Tooltip } from "@/components/ui/tooltip";
import EventIcon, { LabelledEventIcon } from "@/components/EventIcon";

interface SingleEventSelectorProps {
  title: string;
  eventList?: string[];
  selectedEvent: string;
  onEventClick: (eventId: string) => void;
  disabled?: boolean;
  eventButtonsCompact?: boolean;
}

const commonControlStyle = {
  p: 0,
  justifyContent: "center",
  alignItems: "center",
};

export function SingleEventSelector({
  title,
  eventList = WCA_EVENT_IDS,
  selectedEvent,
  onEventClick,
  disabled,
  eventButtonsCompact = false,
}: SingleEventSelectorProps) {
  return (
    <RadioCard.Root
      disabled={disabled}
      size={eventButtonsCompact ? "sm" : undefined}
      orientation="vertical"
      align="center"
      value={selectedEvent}
      onValueChange={(e) => onEventClick(e.value!)}
    >
      {title && <RadioCard.Label>{title}</RadioCard.Label>}
      <Wrap>
        {eventList.map((eventId) => {
          return (
            <RadioCard.Item
              key={eventId}
              colorPalette="green"
              disabled={disabled}
              value={eventId}
              maxW={{ base: "8", lg: "14" }}
              aspectRatio="1"
            >
              <RadioCard.ItemHiddenInput />
              <RadioCard.ItemControl {...commonControlStyle}>
                <LabelledEventIcon
                  fontSize="3xl"
                  eventId={eventId}
                  p={{ base: 1, lg: 0 }}
                  fullWidth
                />
              </RadioCard.ItemControl>
            </RadioCard.Item>
          );
        })}
      </Wrap>
    </RadioCard.Root>
  );
}

interface MultiEventSelectorProps {
  eventList?: string[];
  selectedEvents: string[];
  onEventClick: (eventId: string) => void;
  disabled?: boolean;
  eventButtonsCompact?: boolean;
  maxEvents?: number;
  eventsDisabled?: string[];
  disabledText?: (eventId: string) => string;
}

export function MultiEventSelector({
  eventList = WCA_EVENT_IDS,
  selectedEvents,
  onEventClick = () => {},
  disabled = false,
  eventButtonsCompact = false,
  maxEvents = Infinity,
  eventsDisabled = [],
  disabledText = () => "",
}: MultiEventSelectorProps) {
  const { t } = useT();

  return (
    <CheckboxGroup disabled={disabled}>
      <Wrap>
        {eventList.map((eventId) => {
          const currentEventSelected = selectedEvents.includes(eventId);
          const currentEventDisabled = eventsDisabled.includes(eventId);

          const isDisabled =
            disabled ||
            (!currentEventSelected && selectedEvents.length >= maxEvents) ||
            currentEventDisabled;

          return (
            <CheckboxCard.Root
              key={eventId}
              variant="surface"
              colorPalette="green"
              align="center"
              disabled={isDisabled}
              size={eventButtonsCompact ? "sm" : undefined}
              checked={currentEventSelected}
              onCheckedChange={() => onEventClick(eventId)}
              w="12"
              flex="none"
              aspectRatio="1"
              cursor={isDisabled ? "not-allowed" : "pointer"}
            >
              <CheckboxCard.HiddenInput />
              <CheckboxCard.Control
                {...commonControlStyle}
                alignItems="stretch"
              >
                <CheckboxCard.Content
                  justifyContent="center"
                  alignItems="center"
                >
                  <EventIcon
                    eventId={eventId}
                    fontSize="3xl"
                    color={currentEventDisabled ? "#FFBBBB" : undefined}
                    disabledLabel={
                      currentEventDisabled ? disabledText(eventId) : undefined
                    }
                    p={{ base: 1, lg: 0 }}
                    fullWidth
                  />
                  <VisuallyHidden>
                    <CheckboxCard.Label>
                      {t(`events.${eventId}`)}
                    </CheckboxCard.Label>
                  </VisuallyHidden>
                </CheckboxCard.Content>
              </CheckboxCard.Control>
            </CheckboxCard.Root>
          );
        })}
      </Wrap>
    </CheckboxGroup>
  );
}

interface FormEventSelectorProps extends MultiEventSelectorProps {
  title: string;
  onAllClick?: () => void;
  onClearClick?: () => void;
  showBreakBeforeButtons?: boolean;
}

export function FormEventSelector({
  title,
  eventList = WCA_EVENT_IDS,
  selectedEvents,
  onEventClick = () => {},
  onAllClick = undefined,
  onClearClick = undefined,
  disabled = false,
  showBreakBeforeButtons = true,
  eventButtonsCompact = false,
  maxEvents = Infinity,
  eventsDisabled = [],
  disabledText = () => "",
}: FormEventSelectorProps) {
  const { t } = useT();

  return (
    <Fieldset.Root>
      <Fieldset.Legend textStyle="label" asChild>
        <Stack
          align="baseline"
          direction={showBreakBeforeButtons ? "column" : "row"}
        >
          {title}
          <ButtonGroup size="sm">
            {onAllClick !== undefined && (
              <Tooltip
                disabled={!Number.isFinite(maxEvents)}
                content={t(
                  "competitions.registration_v2.register.event_limit",
                  {
                    max_events: maxEvents,
                  },
                )}
              >
                <Button
                  disabled={disabled || eventList.length >= maxEvents}
                  onClick={onAllClick}
                  colorPalette="blue"
                >
                  {t("competitions.index.all_events")}
                </Button>
              </Tooltip>
            )}
            {onClearClick !== undefined && (
              <Button
                disabled={disabled}
                onClick={onClearClick}
                colorPalette="blue"
                variant="outline"
              >
                {t("competitions.index.clear")}
              </Button>
            )}
          </ButtonGroup>
        </Stack>
      </Fieldset.Legend>
      <MultiEventSelector
        eventList={eventList}
        selectedEvents={selectedEvents}
        onEventClick={onEventClick}
        disabled={disabled}
        eventButtonsCompact={eventButtonsCompact}
        maxEvents={maxEvents}
        eventsDisabled={eventsDisabled}
        disabledText={disabledText}
      />
    </Fieldset.Root>
  );
}
