import { useEffect, useState } from "react";
import Map, { MAP_DISPLAY_LIMIT } from "@/components/map/Map";
import { components } from "@/types/openapi";
import FlyoutDrawer from "./FlyoutDrawer";
import { keyBy } from "lodash";

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
  const [selectedCompetition, setSelectedCompetition] = useState<
    components["schemas"]["CompetitionIndex"] | null
  >(null);

  // Indexed by id so pin interactions are direct lookups instead of array scans.
  // Rebuilt only when `competitions` changes (memoized by React Compiler).
  const competitionsById = keyBy(competitions, "id");

  const selectCompetition = (competition_id: string) => {
    const competition = competitionsById[competition_id];
    if (competition) {
      setSelectedCompetition(competition);
    }
  };

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

  return (
    <>
      <Map
        competitions={competitions}
        isLoading={isLoading}
        selectCompetition={selectCompetition}
      />
      ;
      <FlyoutDrawer
        open={!!selectedCompetition}
        setOpen={() => setSelectedCompetition(null)}
        comp={selectedCompetition}
        isChampionship={
          (selectedCompetition?.championship_types.length || 0) > 0
        }
      />
    </>
  );
}
