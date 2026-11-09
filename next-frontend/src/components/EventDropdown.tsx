"use client";

import {
  Button,
  Menu,
  Portal,
  Stack,
  Text,
  type ButtonProps,
} from "@chakra-ui/react";
import { LuChevronDown, LuShapes } from "react-icons/lu";
import EventIcon from "@/components/EventIcon";
import { useT } from "@/lib/i18n/useI18n";
import { WCA_EVENT_IDS } from "@/lib/wca/data/events";

const CUBE_EVENT_LABELS: Record<string, string> = {
  "333": "3x3",
  "222": "2x2",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
};

interface EventDropdownProps {
  label?: string;
  eventIds?: string[];
  value: string;
  onValueChange: (eventId: string) => void;
  disabled?: boolean;
  size?: ButtonProps["size"];
  allEventsValue?: string;
}

export default function EventDropdown({
  label,
  eventIds = WCA_EVENT_IDS,
  value,
  onValueChange,
  disabled,
  size = "lg",
  allEventsValue,
}: EventDropdownProps) {
  const { t } = useT();
  const hasSelectedEvent = eventIds.includes(value);
  const isAllEvents = allEventsValue !== undefined && value === allEventsValue;
  const fieldLabel =
    label || t("results.selector_elements.events_selector.event");
  const selectedEventName = hasSelectedEvent
    ? t(`events.${value}`)
    : isAllEvents
      ? t("competitions.index.all_events")
      : fieldLabel;
  const selectedEventLabel = hasSelectedEvent
    ? (CUBE_EVENT_LABELS[value] ?? selectedEventName)
    : selectedEventName;

  return (
    <Stack align="start" gap={2}>
      {label && <Text textStyle="label">{label}</Text>}
      <Menu.Root
        lazyMount
        unmountOnExit
        positioning={{ placement: "bottom-start" }}
      >
        <Menu.Trigger asChild>
          <Button
            type="button"
            variant="ghost"
            size={size}
            disabled={disabled || eventIds.length === 0}
            aria-label={`${fieldLabel}: ${selectedEventName}`}
            title={selectedEventName}
            gap={3}
          >
            {hasSelectedEvent ? (
              <EventIcon eventId={value} boxSize={6} />
            ) : (
              <LuShapes />
            )}
            <Text as="span" hideBelow="sm">
              {selectedEventLabel}
            </Text>
            <LuChevronDown />
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content
              aria-label={fieldLabel}
              minW="0"
              maxW="calc(100vw - {spacing.4})"
              p={2}
              borderRadius="xl"
              colorPalette="blue"
            >
              <Menu.RadioItemGroup
                value={value}
                onValueChange={({ value }) => onValueChange(value)}
                display="grid"
                gridTemplateColumns="repeat(5, 1fr)"
                gap={1}
              >
                {allEventsValue !== undefined && (
                  <Menu.RadioItem
                    value={allEventsValue}
                    gridColumn="1 / -1"
                    borderRadius="lg"
                    minH={12}
                    _checked={{ bg: "colorPalette.subtle", color: "fg" }}
                  >
                    <LuShapes />
                    {t("competitions.index.all_events")}
                  </Menu.RadioItem>
                )}
                {eventIds.map((eventId) => (
                  <Menu.RadioItem
                    key={eventId}
                    value={eventId}
                    valueText={t(`events.${eventId}`)}
                    aria-label={t(`events.${eventId}`)}
                    title={t(`events.${eventId}`)}
                    justifyContent="center"
                    boxSize={{ base: 12, sm: 16 }}
                    p={2}
                    borderRadius="xl"
                    color="fg.muted"
                    _checked={{ bg: "colorPalette.subtle", color: "fg" }}
                    _highlighted={{ bg: "colorPalette.muted", color: "fg" }}
                  >
                    <EventIcon eventId={eventId} boxSize={8} />
                  </Menu.RadioItem>
                ))}
              </Menu.RadioItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Stack>
  );
}
