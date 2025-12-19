import { getSchedule } from "@/lib/wca/competitions/getSchedule";
import Errored from "@/components/ui/errored";
import { earliestWithLongestTieBreaker } from "@/lib/wca/wcif/activities";
import LiveView from "@/components/competitions/Schedule/LiveView";
import { getEvents } from "@/lib/wca/competitions/wcif/getEvents";
import { getT } from "@/lib/i18n/get18n";

export default async function LiveOverview({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const { error, data: wcifSchedule } = await getSchedule(competitionId);

  if (error) {
    return <Errored error={`${error.data.id} not found`} />;
  }

  const { error: wcifEventsError, data: wcifEvents } =
    await getEvents(competitionId);

  if (wcifEventsError) {
    return <Errored error={`${wcifEventsError.data.id} not found`} />;
  }

  const allActivitiesSorted = wcifSchedule.venues
    .flatMap((venue) => venue.rooms)
    .flatMap((room) => room.activities)
    .toSorted(earliestWithLongestTieBreaker);

  const uniqueTimeZones = [
    ...new Set(wcifSchedule.venues.map((venue) => venue.timezone)),
  ];

  return (
    <LiveView
      competitionId={competitionId}
      activities={allActivitiesSorted}
      timeZone={uniqueTimeZones[0]}
      wcifEvents={wcifEvents}
      t={t}
    />
  );
}
