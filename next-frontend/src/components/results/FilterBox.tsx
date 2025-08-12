import {
  Box,
  Button,
  ButtonGroup,
  VStack,
  HStack,
  Field,
  SegmentGroup,
} from "@chakra-ui/react";
import EventSelector from "@/components/EventSelector";
import { useT } from "@/lib/i18n/useI18n";
import RegionSelector from "@/components/RegionSelector";

interface FilterBoxProps {
  filterState: {
    event: string;
    region: string;
    gender: string;
    show: string;
  };
  filterActions: {
    setEvent: (event: string) => void;
    setRegion: (region: string) => void;
    setGender: (gender: string) => void;
    setShow: (show: string) => void;
  };
}

export default function FilterBox({
  filterState,
  filterActions,
}: FilterBoxProps) {
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
      <VStack align={"left"}>
        <EventSelector
          title={t("competitions.competition_form.events")}
          selectedEvents={[filterState.event]}
          onEventClick={(event) =>
            event === filterState.event
              ? filterActions.setEvent("all events")
              : filterActions.setEvent(event)
          }
          hideAllButton
          hideClearButton
        />
        <RegionSelector
          region={filterState.region}
          onRegionChange={filterActions.setRegion}
          label={t("common.country")}
          t={t}
          name={t("delegates_page.all_regions")}
        />
        <HStack>
          <Field.Root>
            <Field.Label>Gender</Field.Label>
            <SegmentGroup.Root
              value={filterState.gender}
              onValueChange={(e) => filterActions.setGender(e.value!)}
              size={"md"}
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
              size={"md"}
            >
              <SegmentGroup.Indicator />
              <SegmentGroup.Items
                items={[
                  "mixed",
                  "slim",
                  "separate",
                  "history",
                  "mixed history",
                ]}
              />
            </SegmentGroup.Root>
          </Field.Root>
        </HStack>
      </VStack>
    </Box>
  );
}
