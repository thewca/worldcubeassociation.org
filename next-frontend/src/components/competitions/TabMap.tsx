import { useEffect } from "react";
import Map, { MAP_DISPLAY_LIMIT } from "@/components/map/Map";
import { components } from "@/types/openapi";

interface TabMapProps {
  competitions: components["schemas"]["CompetitionIndex"][];
  loadedCompetitionCount: number;
  isLoading: boolean;
  fetchMoreCompetitions: () => void;
  hasMoreCompsToLoad: boolean;
}

export default function TabMap({
  competitions,
  loadedCompetitionCount,
  isLoading,
  fetchMoreCompetitions,
  hasMoreCompsToLoad,
}: TabMapProps) {
  // The bound counts every competition fetched rather than the ones left after
  //   the distance filter, so that a narrow filter cannot walk the API all the
  //   way back through competition history looking for pins it will never find.
  useEffect(() => {
    if (
      hasMoreCompsToLoad &&
      !isLoading &&
      loadedCompetitionCount < MAP_DISPLAY_LIMIT
    ) {
      fetchMoreCompetitions();
    }
  }, [
    hasMoreCompsToLoad,
    isLoading,
    loadedCompetitionCount,
    fetchMoreCompetitions,
  ]);

  return <Map competitions={competitions} isLoading={isLoading} />;
}
