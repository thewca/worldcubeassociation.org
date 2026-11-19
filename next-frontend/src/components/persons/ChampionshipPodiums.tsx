import { VStack } from "@chakra-ui/react";
import { components } from "@/types/openapi";
import { getT } from "@/lib/i18n/get18n";
import PodiumTable from "@/components/persons/PodiumTable";

type ChampionshipPodiums =
  components["schemas"]["V1PersonInfo"]["championship_podium_results"];
type ChampionshipLevel = keyof ChampionshipPodiums;

const CHAMPIONSHIP_LEVELS: ChampionshipLevel[] = [
  "world",
  "continental",
  "greater_china",
  "national",
];

const ChampionshipPodiumsTab = async ({
  championshipPodiums,
}: {
  championshipPodiums: ChampionshipPodiums;
}) => {
  const { t } = await getT();

  const levelsWithPodiums = CHAMPIONSHIP_LEVELS.filter(
    (level) => championshipPodiums[level].length > 0,
  );

  return (
    <VStack align="stretch" gap={8}>
      {levelsWithPodiums.map((level) => (
        <PodiumTable
          key={level}
          title={t(`persons.show.championship_podium_levels.${level}`)}
          results={championshipPodiums[level]}
        />
      ))}
    </VStack>
  );
};

export default ChampionshipPodiumsTab;
