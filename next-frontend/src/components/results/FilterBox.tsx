import { Box, VStack, HStack, Field, SegmentGroup } from "@chakra-ui/react";
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

export function RecordsFilterBox({
  filterState,
  filterActions,
}: RecordsFilterBoxProps) {
  return (
    <FilterBox filterState={filterState} filterActions={filterActions}>
      <HStack>
        <Field.Root>
          <Field.Label>Gender</Field.Label>
          <SegmentGroup.Root
            value={filterState.gender}
            onValueChange={(e) => filterActions.setGender(e.value!)}
            size="md"
          >
            <SegmentGroup.Indicator />
            <SegmentGroup.Items items={["All", "Male", "Female"]} />
          </SegmentGroup.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label>Show</Field.Label>
          <SegmentGroup.Root
            value={filterState.show}
            onValueChange={(e) => filterActions.setShow(e.value!)}
            size="md"
          >
            <SegmentGroup.Indicator />
            <SegmentGroup.Items
              items={["mixed", "slim", "separate", "history", "mixed history"]}
            />
          </SegmentGroup.Root>
        </Field.Root>
      </HStack>
    </FilterBox>
  );
}

export function RankingsFilterBox({
  filterState,
  filterActions,
  valueLabelMap,
}: RankingsFilterBoxProps) {
  return (
    <FilterBox filterState={filterState} filterActions={filterActions}>
      <HStack>
        <Field.Root>
          <Field.Label>Type</Field.Label>
          <SegmentGroup.Root
            value={valueLabelMap[filterState.rankingType]}
            onValueChange={(e) =>
              filterActions.setType(_.invert(valueLabelMap)[e.value!])
            }
            size="md"
          >
            <SegmentGroup.Indicator />
            <SegmentGroup.Items
              items={[valueLabelMap["single"], valueLabelMap["average"]]}
            />
          </SegmentGroup.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label>Gender</Field.Label>
          <SegmentGroup.Root
            value={valueLabelMap[filterState.gender]}
            onValueChange={(e) =>
              filterActions.setGender(_.invert(valueLabelMap)[e.value!])
            }
            size="md"
          >
            <SegmentGroup.Indicator />
            <SegmentGroup.Items
              items={[
                valueLabelMap["All"],
                valueLabelMap["Male"],
                valueLabelMap["Female"],
              ]}
            />
          </SegmentGroup.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label>Show</Field.Label>
          <SegmentGroup.Root
            value={valueLabelMap[filterState.show]}
            onValueChange={(e) =>
              filterActions.setShow(_.invert(valueLabelMap)[e.value!])
            }
            size="md"
          >
            <SegmentGroup.Indicator />
            <SegmentGroup.Items
              items={[
                valueLabelMap["100 persons"],
                valueLabelMap["100 results"],
                valueLabelMap["by region"],
              ]}
            />
          </SegmentGroup.Root>
        </Field.Root>
      </HStack>
    </FilterBox>
  );
}

function FilterBox({ filterState, filterActions, children }: FilterBoxProps) {
  const { t } = useT();

  return (
    <Box
      bg="bg"
      p={6}
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
