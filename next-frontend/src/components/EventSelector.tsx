"use client";

import { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import {
  Button,
  ButtonGroup,
  CheckboxCard,
  CheckboxGroup,
  Fieldset,
  HStack,
  RadioCard,
  VisuallyHidden,
} from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import { Tooltip } from "@/components/ui/tooltip";
import EventIcon from "@/components/EventIcon";

interface MultiEventSelectorProps {
  title: string;
  eventList?: string[];
  selectedEvents: string[];
  onEventClick?: (eventId: string) => void;
  hideAllButton?: boolean;
  onAllClick?: () => void;
  hideClearButton?: boolean;
  onClearClick?: () => void;
  disabled?: boolean;
  shouldErrorOnEmpty?: boolean;
  showBreakBeforeButtons?: boolean;
  eventButtonsCompact?: boolean;
  maxEvents?: number;
  eventsDisabled?: string[];
  disabledText?: (eventId: string) => string;
}

interface SingleEventSelectorProps {
  title: string;
  eventList?: string[];
  selectedEvent: string;
  onEventClick: (eventId: string) => void;
  disabled?: boolean;
  eventButtonsCompact?: boolean;
}

export function SingleEventSelector({
  title,
  eventList = WCA_EVENT_IDS,
  selectedEvent,
  onEventClick,
  eventButtonsCompact,
  disabled,
}: SingleEventSelectorProps) {
  return (
    <RadioCard.Root
      disabled={disabled}
      orientation="vertical"
      align="center"
      value={selectedEvent}
      onValueChange={(e) => onEventClick(e.value ?? "")}
    >
      {title && <RadioCard.Label>{title}</RadioCard.Label>}
      <HStack>
        {eventList.map((eventId) => {
          return (
            <RadioCard.Item
              key={eventId}
              colorPalette="green"
              disabled={disabled}
              value={eventId}
            >
              <RadioCard.ItemHiddenInput />
              <RadioCard.ItemControl>
                <EventIcon fontSize="2xl" eventId={eventId} />
              </RadioCard.ItemControl>
            </RadioCard.Item>
          );
        })}
      </HStack>
    </RadioCard.Root>
  );
}

function EventSelectorMulti({
  title,
  eventList = WCA_EVENT_IDS,
  selectedEvents,
  onEventClick = () => {},
  hideAllButton = false,
  onAllClick = () => {},
  hideClearButton = false,
  onClearClick = () => {},
  disabled = false,
  shouldErrorOnEmpty = false,
  showBreakBeforeButtons = true,
  eventButtonsCompact = false,
  maxEvents = Infinity,
  eventsDisabled = [],
  disabledText = () => "",
}: MultiEventSelectorProps) {
  const { t } = useT();

  return (
    <Tooltip
      open={selectedEvents.length === 0}
      disabled={!shouldErrorOnEmpty}
      positioning={{ placement: "bottom-end" }}
      contentProps={{ css: { "--tooltip-bg": "#9f3a38" } }}
      content={t("registrations.errors.must_register")}
    >
      <Fieldset.Root>
        <Fieldset.Legend textStyle="label">
          {title}
          {showBreakBeforeButtons ? <br /> : " "}
          <ButtonGroup size="sm">
            {hideAllButton || (
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
            {hideClearButton || (
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
        </Fieldset.Legend>
        <CheckboxGroup disabled={disabled} flexDirection="row">
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
              >
                <CheckboxCard.HiddenInput />
                <CheckboxCard.Control>
                  <CheckboxCard.Content>
                    <Tooltip
                      content={
                        currentEventDisabled
                          ? disabledText(eventId)
                          : t(`events.${eventId}`)
                      }
                      openDelay={200}
                    >
                      <EventIcon
                        eventId={eventId}
                        fontSize="2xl"
                        color={currentEventDisabled ? "#FFBBBB" : undefined}
                      />
                    </Tooltip>
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
        </CheckboxGroup>
      </Fieldset.Root>
    </Tooltip>
  );
}
