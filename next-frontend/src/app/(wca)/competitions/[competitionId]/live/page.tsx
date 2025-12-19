import { getSchedule } from "@/lib/wca/competitions/getSchedule";
import Errored from "@/components/ui/errored";

export default async function LiveOverview({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const { error, data: schedule } = await getSchedule(competitionId);

  if (error) {
    return <Errored error="Error fetching Schedule" />;
  }

  return schedule.;
}
