import {
  Box,
  Button,
  ButtonGroup,
  VStack,
  HStack,
  Field,
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
            <ButtonGroup attached size="md" width="100%">
              <Button
                flex={1}
                onClick={() => filterActions.setGender("All")}
                variant={filterState.gender == "All" ? "outline" : "solid"}
              >
                All
              </Button>
              <Button
                flex={1}
                onClick={() => filterActions.setGender("Male")}
                variant={filterState.gender == "Male" ? "outline" : "solid"}
              >
                Male
              </Button>
              <Button
                flex={1}
                onClick={() => filterActions.setGender("Female")}
                variant={filterState.gender == "Female" ? "outline" : "solid"}
              >
                Female
              </Button>
            </ButtonGroup>
          </Field.Root>
          <Field.Root>
            <Field.Label>Show</Field.Label>
            <ButtonGroup attached size="md" width="100%">
              <Button
                flex={1}
                onClick={() => filterActions.setShow("mixed")}
                variant={filterState.show == "mixed" ? "outline" : "solid"}
              >
                Mixed
              </Button>
              <Button
                flex={1}
                onClick={() => filterActions.setShow("slim")}
                variant={filterState.show == "slim" ? "outline" : "solid"}
              >
                Slim
              </Button>
              <Button
                flex={1}
                onClick={() => filterActions.setShow("separate")}
                variant={filterState.show == "separate" ? "outline" : "solid"}
              >
                Separate
              </Button>
              <Button
                flex={1}
                onClick={() => filterActions.setShow("history")}
                variant={filterState.show == "history" ? "outline" : "solid"}
              >
                History
              </Button>
              <Button
                flex={1}
                onClick={() => filterActions.setShow("Mixed History")}
              >
                Mixed History
              </Button>
            </ButtonGroup>
          </Field.Root>
        </HStack>
      </VStack>
    </Box>
  );
}
