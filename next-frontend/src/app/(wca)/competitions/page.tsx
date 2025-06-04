import { getCompetitionIndex } from "@/lib/wca/competitions/getCompetitionIndex";
import CompetitionsClient from "./competitionClient";

export default async function CompetitionsPage() {
  const competitions = await getCompetitionIndex();
  return <CompetitionsClient competitions={competitions.data!} />;
}
