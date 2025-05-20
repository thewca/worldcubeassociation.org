import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import CompetitionsClient from "./competitionClient";

const compIds = [
  "OC2022",
  "OC2024",
  "WC2025",
  "PerthAutumn2025",
  "WC2011",
  "WC2013",
  "WC2015",
  "WC2017",
  "WC2023",
  "WC2019",
];

const getAllCompData = async () => {
  const competitionPromises = compIds.map(async (competitionId) => {
    const { data: competitionInfo, error } =
      await getCompetitionInfo(competitionId);
    return error || !competitionInfo ? null : competitionInfo;
  });

  const results = await Promise.all(competitionPromises);
  return results.filter(Boolean);
};

export default async function CompetitionsPage() {
  const competitions = await getAllCompData();
  return <CompetitionsClient competitions={competitions} />;
}
