import { useEffect } from "react";
import Map, { MAP_DISPLAY_LIMIT } from "@/components/map/Map";
import { components } from "@/types/openapi";

interface TabMapProps {
  competitions: components["schemas"]["CompetitionIndex"][];
  isLoading: boolean;
  fetchMoreCompetitions: () => void;
  hasMoreCompsToLoad: boolean;
}

export default function TabMap({
  competitions,
  isLoading,
  fetchMoreCompetitions,
  hasMoreCompsToLoad,
}: TabMapProps) {
  useEffect(() => {
    if (
      hasMoreCompsToLoad &&
      competitions?.length < MAP_DISPLAY_LIMIT &&
      !isLoading
    ) {
      fetchMoreCompetitions();
    }
  }, [hasMoreCompsToLoad, competitions, isLoading, fetchMoreCompetitions]);

  return <Map competitions={competitions} isLoading={isLoading} />;
}
