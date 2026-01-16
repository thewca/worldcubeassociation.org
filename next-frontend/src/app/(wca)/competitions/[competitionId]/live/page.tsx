import { getSchedule } from "@/lib/wca/competitions/getSchedule";
import { earliestWithLongestTieBreaker } from "@/lib/wca/wcif/activities";
import LiveView from "@/components/competitions/Schedule/LiveView";
import { getEvents } from "@/lib/wca/competitions/wcif/getEvents";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";

export default async function LiveOverview({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const {
    error: scheduleError,
    data: wcifSchedule,
    response: scheduleResponse,
  } = await getSchedule(competitionId);

  if (scheduleError) {
    return <OpenapiError t={t} response={scheduleResponse} />;
  }

  const {
    error: wcifEventsError,
    data: wcifEvents,
    response: eventResponse,
  } = await getEvents(competitionId);

  if (wcifEventsError) {
    return <OpenapiError t={t} response={eventResponse} />;
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
      timeZones={uniqueTimeZones}
      wcifEvents={wcifEvents}
    />
  );
}
