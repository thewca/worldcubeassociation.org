import { Box, VStack } from "@chakra-ui/react";
import EventSelector from "@/components/EventSelector";
import { useT } from "@/lib/i18n/useI18n";

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
    <Box>
      <VStack align={"left"}>
        <EventSelector
          title={t("competitions.competition_form.events")}
          selectedEvents={[filterState.event]}
          onEventClick={(event) => filterActions.setEvent(event)}
          hideAllButton
          hideClearButton
        />
        {JSON.stringify(filterState)}
      </VStack>
    </Box>
  );
}
