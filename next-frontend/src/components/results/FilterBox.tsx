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
import RegionSelector from "@/components/RegionSelector";
import {
  FormEventSelector,
  SingleEventSelector,
} from "@/components/EventSelector";

type FilterState = {
  event: string;
  region: string;
  gender: string;
  show: string;
};

type FilterActions = {
  setRegion: (region: string) => void;
  setGender: (gender: string) => void;
  setShow: (show: string) => void;
};

interface FilterBoxProps {
  filterState: FilterState;
  filterActions: FilterActions & { setEvent: (event: string) => void };
  children: React.ReactElement;
}

interface RecordsFilterBoxProps {
  filterState: Omit<FilterState, "event"> & { events: string[] };
  filterActions: FilterActions & {
    setEvents: (events: string[]) => void;
    toggleEvent: (event: string) => void;
  };
}

interface RankingsFilterBoxProps {
  filterState: FilterState & { rankingType: string };
  filterActions: FilterActions & {
    setEvent: (event: string) => void;
    setType: (type: string) => void;
  };
}

interface SegmentedFieldProps {
  label: string;
  value: string;
  items: { label: string; value: string }[];
  onChange: (value: string) => void;
}

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

  return (
    <FilterPanel>
      <VStack align="left">
        <FormEventSelector
          title={t("competitions.competition_form.events")}
          selectedEvents={filterState.events}
          onEventClick={filterActions.toggleEvent}
          onClearClick={() => filterActions.setEvents([])}
        />
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
    </FilterPanel>
  );
}

export function RankingsFilterBox({
  filterState,
  filterActions,
}: RankingsFilterBoxProps) {
  const { t } = useT();

  return (
    <FilterBox filterState={filterState} filterActions={filterActions}>
      <Stack direction={{ base: "column", md: "row" }}>
        <SegmentedField
          label={t("results.selector_elements.type_selector.type")}
          value={filterState.rankingType}
          items={[
            {
              value: "single",
              label: t("results.selector_elements.type_selector.single"),
            },
            {
              value: "average",
              label: t("results.selector_elements.type_selector.average"),
            },
          ]}
          onChange={filterActions.setType}
        />
        <SegmentedField
          label={t("results.selector_elements.gender_selector.gender")}
          value={filterState.gender}
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
    </FilterBox>
  );
}

function FilterBox({ filterState, filterActions, children }: FilterBoxProps) {
  const { t } = useT();

  return (
    <FilterPanel>
      <VStack align="left">
        <SingleEventSelector
          title={t("competitions.competition_form.events")}
          selectedEvent={filterState.event}
          onEventClick={(event) =>
            event === filterState.event
              ? filterActions.setEvent("all events")
              : filterActions.setEvent(event)
          }
        />
        <RegionSelector
          region={filterState.region}
          onRegionChange={filterActions.setRegion}
          label={t("common.country")}
          t={t}
          name={t("delegates_page.all_regions")}
        />
        {children}
      </VStack>
    </FilterPanel>
  );
}

function FilterPanel({ children }: { children: React.ReactNode }) {
  return (
    <Box
      bg="bg"
      w="full"
      p={{ base: 4, md: 6 }}
      borderRadius="md"
      boxShadow="md"
      borderWidth="1px"
      borderColor="gray.100"
    >
      {children}
    </Box>
  );
}
