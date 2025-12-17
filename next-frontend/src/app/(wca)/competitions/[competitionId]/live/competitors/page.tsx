import { redirect } from "next/navigation";
import { route } from "nextjs-routes";

export default async function LiveCompetitors({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  return redirect(
    route({
      pathname: "/competitions/[competitionId]/competitors",
      query: { competitionId },
    }),
  );
}
