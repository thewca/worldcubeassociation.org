import { HStack } from "@chakra-ui/react";

interface FilterBoxProps {
  filterState: {
    event: string;
    region: string;
    rankingType: string;
    gender: string;
    show: string;
  };
  filterActions: {
    setEvent: (event: string) => void;
    setRegion: (region: string) => void;
    setRankingType: (rankingType: string) => void;
    setGender: (gender: string) => void;
    setShow: (show: string) => void;
  };
}

export default function FilterBox({
  filterState,
  filterActions,
}: FilterBoxProps) {
  return (
    <HStack>
      {JSON.stringify(filterActions)}
      {JSON.stringify(filterState)}
    </HStack>
  );
}
