import {
  Grid,
  GridItem,
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
import type {
  RankingsFilterBoxProps,
  RecordsFilterBoxProps,
} from "@/lib/wca/results/types";

type FilterFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

type SegmentedFieldProps = FilterFieldProps & {
  label: string;
  items: { label: string; value: string }[];
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
        hideBelow="sm"
        value={value}
        onValueChange={(e) => onChange(e.value!)}
        size="md"
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Items items={items} />
      </SegmentGroup.Root>
      <Select.Root
        hideFrom="sm"
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

function RegionField({ value, onChange }: FilterFieldProps) {
  const { t } = useT();

  return (
    <RegionSelector
      region={value}
      onRegionChange={onChange}
      label={t("common.country")}
      t={t}
      name={t("delegates_page.all_regions")}
    />
  );
}

function GenderField({ value, onChange }: FilterFieldProps) {
  const { t } = useT();

  return (
    <SegmentedField
      label={t("results.selector_elements.gender_selector.gender")}
      value={value}
      items={[
        {
          value: "All",
          label: t("results.selector_elements.gender_selector.gender_all"),
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
      onChange={onChange}
    />
  );
}

export function RecordsFilterBox({
  filterState,
  filterActions,
}: RecordsFilterBoxProps) {
  const { t } = useT();
  const { eventIds, view } = filterState;
  const allowsMultipleEvents = view === "current";
  const segmentedColumns = view === "current" ? 2 : 1;
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
    <Grid
      bg="bg"
      w="full"
      p={{ base: 4, md: 6 }}
      borderRadius="md"
      boxShadow="sm"
      templateColumns={{
        base: "minmax(0, 1fr)",
        sm: `repeat(${segmentedColumns}, minmax(0, 1fr))`,
        // Let Event span the card while keeping the other controls start-aligned.
        md: `minmax(0, {sizes.sm}) repeat(${segmentedColumns}, max-content) minmax(0, 1fr)`,
      }}
      rowGap={2}
      columnGap={{ base: 2, md: 4 }}
    >
      <GridItem gridColumn="1 / -1" hideBelow="md" minW={0}>
        <FormEventSelector
          title={t("competitions.competition_form.events")}
          selectedEvents={eventIds}
          onEventClick={toggleEvent}
          onClearClick={
            allowsMultipleEvents ? () => setSelectedEventIds([]) : undefined
          }
        />
      </GridItem>
      <GridItem gridColumn="1 / -1" hideFrom="md">
        <EventDropdown
          multiple={allowsMultipleEvents}
          selectedEvents={eventIds}
          onEventsChange={setSelectedEventIds}
        />
      </GridItem>
      <GridItem colSpan={{ base: 1, sm: segmentedColumns, md: 1 }}>
        <RegionField
          value={filterState.region}
          onChange={filterActions.setRegion}
        />
      </GridItem>
      <GenderField
        value={filterState.gender}
        onChange={filterActions.setGender}
      />
      {view === "current" && (
        <SegmentedField
          label={t("results.records.group_by")}
          value={filterState.groupBy}
          items={[
            { value: "event", label: t("results.table_elements.event") },
            { value: "type", label: t("qualification.result_type") },
          ]}
          onChange={(value) =>
            filterActions.setGroupBy(value === "type" ? "type" : "event")
          }
        />
      )}
    </Grid>
  );
}

export function RankingsFilterBox({
  filterState,
  filterActions,
}: RankingsFilterBoxProps) {
  const { t } = useT();
  const showsRegionFilter = filterState.show !== "by region";

  const rankingTypes = events.byId[filterState.event].is_multiple_blindfolded
    ? ["single"]
    : ["single", "average"];
  const rankingTypeItems = rankingTypes.map((value) => ({
    value,
    label: t(`results.selector_elements.type_selector.${value}`),
  }));

  return (
    <Grid
      bg="bg"
      w="full"
      p={{ base: 4, md: 6 }}
      borderRadius="md"
      boxShadow="sm"
      templateColumns={{
        base: "minmax(0, 1fr)",
        sm: "repeat(2, minmax(0, 1fr))",
        md: showsRegionFilter
          ? "minmax(0, {sizes.sm}) repeat(2, max-content) minmax(0, 1fr)"
          : "repeat(2, max-content) minmax(0, 1fr)",
      }}
      rowGap={2}
      columnGap={{ base: 2, md: 4 }}
    >
      <GridItem gridColumn="1 / -1" hideBelow="md" minW={0}>
        <SingleEventSelector
          title={t("competitions.competition_form.events")}
          selectedEvent={filterState.event}
          onEventClick={filterActions.setEvent}
        />
      </GridItem>
      <GridItem gridColumn="1 / -1" hideFrom="md">
        <EventDropdown
          multiple={false}
          required
          selectedEvents={[filterState.event]}
          onEventsChange={([eventId]) =>
            eventId && filterActions.setEvent(eventId)
          }
        />
      </GridItem>
      {showsRegionFilter && (
        <GridItem colSpan={{ base: 1, sm: 2, md: 1 }}>
          <RegionField
            value={filterState.region}
            onChange={filterActions.setRegion}
          />
        </GridItem>
      )}
      <SegmentedField
        label={t("results.selector_elements.type_selector.type")}
        value={filterState.rankingType}
        items={rankingTypeItems}
        onChange={filterActions.setType}
      />
      <GenderField
        value={filterState.gender}
        onChange={filterActions.setGender}
      />
    </Grid>
  );
}
