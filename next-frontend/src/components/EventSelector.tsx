"use client";

import { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import { Button } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import { Tooltip } from "@/components/ui/tooltip";
import EventIcon from "@/components/EventIcon";

interface EventSelectorProps {
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

export default function EventSelector({
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
}: EventSelectorProps) {
  const { t } = useT();

  return (
    <>
      <label htmlFor="events">
        {title}
        {showBreakBeforeButtons ? <br /> : " "}
        {hideAllButton || (
          <Tooltip
            disabled={!Number.isFinite(maxEvents)}
            content={t("competitions.registration_v2.register.event_limit", {
              max_events: maxEvents,
            })}
          >
            <Button
              disabled={disabled || eventList.length >= maxEvents}
              id="select-all-events"
              onClick={onAllClick}
            >
              {t("competitions.index.all_events")}
            </Button>
          </Tooltip>
        )}
        {hideClearButton || (
          <Button
            disabled={disabled}
            id="clear-all-events"
            onClick={onClearClick}
          >
            {t("competitions.index.clear")}
          </Button>
        )}
      </label>
      <Tooltip
        open={selectedEvents.length === 0}
        disabled={!shouldErrorOnEmpty}
        positioning={{ placement: "bottom-end" }}
        contentProps={{ css: { "--tooltip-bg": "#9f3a38" } }}
        content={t("registrations.errors.must_register")}
      >
        <div id="events">
          {eventList.map((eventId) => {
            const isDisabled =
              disabled ||
              (!selectedEvents.includes(eventId) &&
                selectedEvents.length >= maxEvents) ||
              eventsDisabled.includes(eventId);

            return (
              <Tooltip
                key={eventId}
                content={
                  eventsDisabled.includes(eventId)
                    ? disabledText(eventId)
                    : t(`events.${eventId}`)
                }
              >
                {
                  // hover events don't work on disabled buttons, so wrap in a div
                  <div style={{ display: "inline-block" }}>
                    <Button
                      key={eventId}
                      disabled={isDisabled}
                      size={eventButtonsCompact ? "sm" : undefined}
                      id={`checkbox-${eventId}`}
                      onClick={() => onEventClick(eventId)}
                    >
                      <EventIcon
                        eventId={eventId}
                        color={
                          eventsDisabled.includes(eventId)
                            ? "#FFBBBB"
                            : undefined
                        }
                      />
                    </Button>
                  </div>
                }
              </Tooltip>
            );
          })}
        </div>
      </Tooltip>
    </>
  );
}
