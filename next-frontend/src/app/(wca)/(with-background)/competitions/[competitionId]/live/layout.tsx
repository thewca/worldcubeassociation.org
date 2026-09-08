import { getRounds } from "@/lib/wca/live/getRounds";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import { RoundsInfoProvider } from "@/providers/RoundInfoProvider";
import LiveTabs from "@/components/competitions/LiveTabs";
import { Alert, Link } from "@chakra-ui/react";

export default async function LiveLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const {
    data: competitionInfo,
    error: competitionError,
    response: competitionResponse,
  } = await getCompetitionInfo(competitionId);

  if (competitionError)
    return <OpenapiError response={competitionResponse} t={t} />;

  const { scoretaking_software: scoretakingSoftware } = competitionInfo;

  if (scoretakingSoftware !== "internal") {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Content>
          {t(`competitions.live.incompatible.${scoretakingSoftware}`)}
          {scoretakingSoftware === "wca_live" && (
            <>
              {" "}
              <Link
                href={`https://live.worldcubeassociation.org/link/competitions/${competitionInfo.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {competitionInfo.id}
              </Link>
            </>
          )}
        </Alert.Content>
      </Alert.Root>
    );
  }

  const { data, error, response } = await getRounds(competitionId);

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  return (
    <RoundsInfoProvider
      competitionId={competitionId}
      initialRounds={data.rounds}
    >
      <LiveTabs competitionInfo={competitionInfo}>{children}</LiveTabs>
    </RoundsInfoProvider>
  );
}
