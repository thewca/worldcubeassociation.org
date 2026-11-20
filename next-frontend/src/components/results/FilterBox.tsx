import {
  Box,
  VStack,
  Stack,
  Field,
  Select,
  Portal,
  createListCollection,
  SegmentGroup,
} from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import EventDropdown from "@/components/EventDropdown";
import RegionSelector from "@/components/RegionSelector";
import {
  FormEventSelector,
  SingleEventSelector,
} from "@/components/EventSelector";
import events from "@/lib/wca/data/events";
import { isRecordsHistory } from "@/lib/wca/results/records";

type SharedFilterState = {
  region: string;
  gender: string;
  show: string;
};

type SharedFilterActions = {
  setRegion: (region: string) => void;
  setGender: (gender: string) => void;
  setShow: (show: string) => void;
};

type RecordsFilterBoxProps = {
  filterState: SharedFilterState & { eventIds: string[] };
  filterActions: SharedFilterActions & {
    setSelectedEventIds: (eventIds: string[]) => void;
  };
};

type RankingsFilterBoxProps = {
  filterState: SharedFilterState & { event: string; rankingType: string };
  filterActions: SharedFilterActions & {
    setEvent: (event: string) => void;
    setType: (type: string) => void;
  };
};

type SegmentedFieldProps = {
  label: string;
  value: string;
  items: { label: string; value: string }[];
  onChange: (value: string) => void;
};

// Use a select on narrow screens where the segmented controls don't fit.
function SegmentedField({
  label,
  value,
  items,
  onChange,
}: SegmentedFieldProps) {
  const collection = createListCollection({ items });

  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <SegmentGroup.Root
        hideBelow="md"
        value={value}
        onValueChange={(e) => onChange(e.value!)}
        size="md"
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items items={items} />
      </SegmentGroup.Root>
      <Select.Root
        hideFrom="md"
        collection={collection}
        value={[value]}
        onValueChange={({ value }) => value[0] && onChange(value[0])}
        width="full"
        lazyMount
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger aria-label={label}>
            <Select.ValueText />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {items.map((item) => (
                <Select.Item item={item} key={item.value}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </Field.Root>
  );
}

export function RecordsFilterBox({
  filterState,
  filterActions,
}: RecordsFilterBoxProps) {
  const { t } = useT();
  const { eventIds, show } = filterState;
  const allowsMultipleEvents = !isRecordsHistory(show);
  const { setSelectedEventIds } = filterActions;

  const toggleEvent = (eventId: string) => {
    const isEventSelected = eventIds.includes(eventId);
    if (isEventSelected) {
      setSelectedEventIds(eventIds.filter((id) => id !== eventId));
      return;
    }

    setSelectedEventIds(
      allowsMultipleEvents ? [...eventIds, eventId] : [eventId],
    );
  };

  return (
    <Box
      bg="bg"
      w="full"
      p={{ base: 4, md: 6 }}
      borderRadius="md"
      boxShadow="md"
      borderWidth="1px"
      borderColor="border.muted"
    >
      <VStack align="left">
        <Box hideBelow="md">
          <FormEventSelector
            title={t("competitions.competition_form.events")}
            selectedEvents={eventIds}
            onEventClick={toggleEvent}
            onClearClick={
              allowsMultipleEvents ? () => setSelectedEventIds([]) : undefined
            }
          />
        </Box>
        <Box hideFrom="md">
          <EventDropdown
            multiple={allowsMultipleEvents}
            selectedEvents={eventIds}
            onEventsChange={setSelectedEventIds}
          />
        </Box>
        <RegionSelector
          region={filterState.region}
          onRegionChange={filterActions.setRegion}
          label={t("common.country")}
          t={t}
          name={t("delegates_page.all_regions")}
        />
        <Stack direction={{ base: "column", md: "row" }}>
          <SegmentedField
            label={t("results.selector_elements.gender_selector.gender")}
            value={filterState.gender}
            items={[
              {
                value: "All",
                label: t(
                  "results.selector_elements.gender_selector.gender_all",
                ),
              },
              {
                value: "Male",
                label: t("results.selector_elements.gender_selector.male"),
              },
              {
                value: "Female",
                label: t("results.selector_elements.gender_selector.female"),
              },
            ]}
            onChange={filterActions.setGender}
          />
          <SegmentedField
            label={t("results.selector_elements.show_selector.show")}
            value={filterState.show}
            items={[
              {
                value: "mixed",
                label: t("results.selector_elements.show_selector.mixed"),
              },
              {
                value: "slim",
                label: t("results.selector_elements.show_selector.slim"),
              },
              {
                value: "separate",
                label: t("results.selector_elements.show_selector.separate"),
              },
              {
                value: "history",
                label: t("results.selector_elements.show_selector.history"),
              },
              {
                value: "mixed history",
                label: t(
                  "results.selector_elements.show_selector.mixed_history",
                ),
              },
            ]}
            onChange={filterActions.setShow}
          />
        </Stack>
      </VStack>
    </Box>
  );
}

export function RankingsFilterBox({
  filterState,
  filterActions,
}: RankingsFilterBoxProps) {
  const { t } = useT();

  const rankingTypes = events.byId[filterState.event].is_multiple_blindfolded
    ? ["single"]
    : ["single", "average"];
  const rankingTypeItems = rankingTypes.map((value) => ({
    value,
    label: t(`results.selector_elements.type_selector.${value}`),
  }));

  return (
    <Box
      bg="bg"
      w="full"
      p={{ base: 4, md: 6 }}
      borderRadius="md"
      boxShadow="md"
      borderWidth="1px"
      borderColor="border.muted"
    >
      <VStack align="left">
        <Box hideBelow="md">
          <SingleEventSelector
            title={t("competitions.competition_form.events")}
            selectedEvent={filterState.event}
            onEventClick={filterActions.setEvent}
          />
        </Box>
        <Box hideFrom="md">
          <EventDropdown
            multiple={false}
            required
            selectedEvents={[filterState.event]}
            onEventsChange={([eventId]) =>
              eventId && filterActions.setEvent(eventId)
            }
          />
        </Box>
        <RegionSelector
          region={filterState.region}
          onRegionChange={filterActions.setRegion}
          label={t("common.country")}
          t={t}
          name={t("delegates_page.all_regions")}
        />
        <Stack direction={{ base: "column", md: "row" }}>
          <SegmentedField
            label={t("results.selector_elements.type_selector.type")}
            value={filterState.rankingType}
            items={rankingTypeItems}
            onChange={filterActions.setType}
          />
          <SegmentedField
            label={t("results.selector_elements.gender_selector.gender")}
            value={filterState.gender}
            items={[
              {
                value: "All",
                label: t(
                  "results.selector_elements.gender_selector.gender_all",
                ),
              },
              {
                value: "Male",
                label: t("results.selector_elements.gender_selector.male"),
              },
              {
                value: "Female",
                label: t("results.selector_elements.gender_selector.female"),
              },
            ]}
            onChange={filterActions.setGender}
          />
          <SegmentedField
            label={t("results.selector_elements.show_selector.show")}
            value={filterState.show}
            items={[
              {
                value: "100 persons",
                label: t("results.selector_elements.show_selector.persons"),
              },
              {
                value: "100 results",
                label: t("results.selector_elements.show_selector.results"),
              },
              {
                value: "by region",
                label: t("results.selector_elements.show_selector.by_region"),
              },
            ]}
            onChange={filterActions.setShow}
          />
        </Stack>
      </VStack>
    </Box>
  );
}
