import TabCompetitors from "@/components/competitions/TabCompetitors";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { hasPassed, hasPassedEndOfDay } from "@/lib/wca/dates";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import getPermissions from "@/lib/wca/permissions.server";
import { Button, Link } from "@chakra-ui/react";
import { Suspense } from "react";

export default async function Competitors({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const {
    data: competitionInfo,
    error,
    response,
  } = await getCompetitionInfo(competitionId);

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  const isLive =
    hasPassed(competitionInfo.start_date) &&
    !hasPassedEndOfDay(competitionInfo.end_date);

  return (
    <TabCompetitors
      id={competitionId}
      isLive={isLive}
      addOnTheSpotSlot={
        isLive && (
          <Suspense>
            <AddOnTheSpotButton competitionId={competitionId} />
          </Suspense>
        )
      }
    />
  );
}

// Reading the permissions reaches the session, so it stays behind its own boundary rather than
//   holding up the competitor list.
async function AddOnTheSpotButton({
  competitionId,
}: {
  competitionId: string;
}) {
  const permissions = await getPermissions();

  if (!permissions?.canAdministerCompetition(competitionId)) return null;

  return (
    <Button asChild alignSelf="flex-end" mb={2}>
      <Link href={`/competitions/${competitionId}/registrations/add`}>
        Add on the spot registration
      </Link>
    </Button>
  );
}
