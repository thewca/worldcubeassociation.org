import ExternalLiveResults from "@/components/competitions/ExternalLiveResults";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { liveTab } from "@/lib/wca/competitions/tabs";
import { getSchedule } from "@/lib/wca/competitions/getSchedule";
import { earliestWithLongestTieBreaker } from "@/lib/wca/wcif/activities";
import LiveView from "@/components/competitions/Schedule/LiveView";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import getPermissions from "@/lib/wca/permissions.server";

export default async function LiveOverview({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const {
    data: competitionInfo,
    error: competitionError,
    response: competitionResponse,
  } = await getCompetitionInfo(competitionId);

  if (competitionError) {
    return <OpenapiError t={t} response={competitionResponse} />;
  }

  if (competitionInfo.scoretaking_software !== "internal") {
    return (
      <ExternalLiveResults
        competitionInfo={{ id: competitionInfo.id, name: competitionInfo.name }}
        externalHref={liveTab(competitionInfo).externalHref}
      />
    );
  }

  const [scheduleResult, permissions] = await Promise.all([
    getSchedule(competitionId),
    getPermissions(),
  ]);

  const {
    error: scheduleError,
    data: wcifSchedule,
    response: scheduleResponse,
  } = scheduleResult;

  if (scheduleError) {
    return <OpenapiError t={t} response={scheduleResponse} />;
  }

  const canManage =
    !!permissions && permissions.canScoretakeCompetition(competitionId);

  const eventActivitiesSorted = wcifSchedule.venues
    .flatMap((venue) => venue.rooms)
    .flatMap((room) => room.activities)
    .filter((activity) => !activity.activityCode.startsWith("other"))
    .toSorted(earliestWithLongestTieBreaker)
    .map(({ id, activityCode, startTime, endTime }) => ({
      id,
      activityCode,
      startTime,
      endTime,
    }));

  const uniqueTimeZones = [
    ...new Set(wcifSchedule.venues.map((venue) => venue.timezone)),
  ];

  return (
    <>
      <LiveView
        competitionId={competitionId}
        activities={eventActivitiesSorted}
        timeZones={uniqueTimeZones}
        canManage={canManage}
      />
    </>
  );
}
