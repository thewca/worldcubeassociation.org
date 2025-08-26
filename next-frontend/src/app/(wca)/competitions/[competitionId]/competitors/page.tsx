import TabCompetitors from "@/components/competitions/TabCompetitors";

export default async function Events({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  return <TabCompetitors id={competitionId} />;
}
