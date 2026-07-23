import { getSchedule } from "@/lib/wca/competitions/getSchedule";
import { earliestWithLongestTieBreaker } from "@/lib/wca/wcif/activities";
import LiveView from "@/components/competitions/Schedule/LiveView";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import getPermissions from "@/lib/wca/permissions";
import { Container } from "@chakra-ui/react";

export default async function LiveOverview({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

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

  const allActivitiesSorted = wcifSchedule.venues
    .flatMap((venue) => venue.rooms)
    .flatMap((room) => room.activities)
    .toSorted(earliestWithLongestTieBreaker);

  const uniqueTimeZones = [
    ...new Set(wcifSchedule.venues.map((venue) => venue.timezone)),
  ];

  return (
    <Container bg="bg">
      <LiveView
        competitionId={competitionId}
        activities={allActivitiesSorted}
        timeZones={uniqueTimeZones}
        canManage={canManage}
      />
    </Container>
  );
}
