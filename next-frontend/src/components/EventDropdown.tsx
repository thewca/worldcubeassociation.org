"use client";

import { createListCollection, Portal, Select } from "@chakra-ui/react";
import EventIcon from "@/components/EventIcon";
import { useT } from "@/lib/i18n/useI18n";
import { WCA_EVENT_IDS } from "@/lib/wca/data/events";

interface EventDropdownProps {
  selectedEvents: string[];
  onEventsChange: (eventIds: string[]) => void;
}

export default function EventDropdown({
  selectedEvents,
  onEventsChange,
}: EventDropdownProps) {
  const { t } = useT();
  const collection = createListCollection({
    items: WCA_EVENT_IDS.map((eventId) => ({
      value: eventId,
      label: t(`events.${eventId}`),
    })),
  });

  return (
    <Select.Root
      multiple
      lazyMount
      collection={collection}
      value={selectedEvents}
      onValueChange={({ value }) => onEventsChange(value)}
      positioning={{ sameWidth: false }}
      minW="0"
    >
      <Select.HiddenSelect />
      <Select.Label>{t("competitions.index.event")}</Select.Label>
      <Select.Control>
        <Select.Trigger bg="bg">
          <Select.ValueText
            placeholder={t("competitions.index.all_events")}
            truncate
          />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.ClearTrigger aria-label={t("competitions.index.clear")} />
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((event) => (
              <Select.Item item={event} key={event.value}>
                <EventIcon eventId={event.value} />
                <Select.ItemText>{event.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
