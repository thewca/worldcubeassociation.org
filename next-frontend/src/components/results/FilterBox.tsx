import {
  Box,
  VStack,
  Stack,
  Field,
  NativeSelect,
  SegmentGroup,
} from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import RegionSelector from "@/components/RegionSelector";
import _ from "lodash";
import { SingleEventSelector } from "@/components/EventSelector";

type FilterState = {
  event: string;
  region: string;
  gender: string;
  show: string;
};

type FilterActions = {
  setEvent: (event: string) => void;
  setRegion: (region: string) => void;
  setGender: (gender: string) => void;
  setShow: (show: string) => void;
};

interface FilterBoxProps {
  filterState: FilterState;
  filterActions: FilterActions;
  children: React.ReactElement;
}

interface RecordsFilterBoxProps {
  filterState: FilterState;
  filterActions: FilterActions;
}

interface RankingsFilterBoxProps {
  filterState: FilterState & { rankingType: string };
  filterActions: FilterActions & { setType: (type: string) => void };
  valueLabelMap: Record<string, string>;
}

interface SegmentedFieldProps {
  label: string;
  value: string;
  items: string[];
  onChange: (value: string) => void;
}

// Segmented control on desktop, native select on mobile where it doesn't fit
function SegmentedField({
  label,
  value,
  items,
  onChange,
}: SegmentedFieldProps) {
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
      <NativeSelect.Root hideFrom="md">
        <NativeSelect.Field
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {items.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  );
}

export function RecordsFilterBox({
  filterState,
  filterActions,
}: RecordsFilterBoxProps) {
  return (
    <FilterBox filterState={filterState} filterActions={filterActions}>
      <Stack direction={{ base: "column", md: "row" }}>
        <SegmentedField
          label="Gender"
          value={filterState.gender}
          items={["All", "Male", "Female"]}
          onChange={filterActions.setGender}
        />
        <SegmentedField
          label="Show"
          value={filterState.show}
          items={["mixed", "slim", "separate", "history", "mixed history"]}
          onChange={filterActions.setShow}
        />
      </Stack>
    </FilterBox>
  );
}

export function RankingsFilterBox({
  filterState,
  filterActions,
  valueLabelMap,
}: RankingsFilterBoxProps) {
  const toValue = (label: string) => _.invert(valueLabelMap)[label];

  return (
    <FilterBox filterState={filterState} filterActions={filterActions}>
      <Stack direction={{ base: "column", md: "row" }}>
        <SegmentedField
          label="Type"
          value={valueLabelMap[filterState.rankingType]}
          items={[valueLabelMap["single"], valueLabelMap["average"]]}
          onChange={(label) => filterActions.setType(toValue(label))}
        />
        <SegmentedField
          label="Gender"
          value={valueLabelMap[filterState.gender]}
          items={[
            valueLabelMap["All"],
            valueLabelMap["Male"],
            valueLabelMap["Female"],
          ]}
          onChange={(label) => filterActions.setGender(toValue(label))}
        />
        <SegmentedField
          label="Show"
          value={valueLabelMap[filterState.show]}
          items={[
            valueLabelMap["100 persons"],
            valueLabelMap["100 results"],
            valueLabelMap["by region"],
          ]}
          onChange={(label) => filterActions.setShow(toValue(label))}
        />
      </Stack>
    </FilterBox>
  );
}

function FilterBox({ filterState, filterActions, children }: FilterBoxProps) {
  const { t } = useT();

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
    </Box>
  );
}
