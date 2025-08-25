import { redirect } from "next/navigation";

export default async function CompetitionOverView({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  // TODO: parse the hash and then redirect
  redirect(`/competitions/${competitionId}/general`);
}
