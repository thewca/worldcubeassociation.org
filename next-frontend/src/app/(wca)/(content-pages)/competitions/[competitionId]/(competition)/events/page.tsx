import TabEvents from "@/components/competitions/TabEvents";

export default async function Events({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  return <TabEvents competitionId={competitionId} />;
}
