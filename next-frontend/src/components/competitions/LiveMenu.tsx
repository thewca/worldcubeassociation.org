import { components } from "@/types/openapi";
import { getRounds } from "@/lib/wca/live/getRounds";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import { RoundsInfoProvider } from "@/providers/RoundInfoProvider";
import LiveTabs from "@/components/competitions/LiveTabs";
import { Alert, Link } from "@chakra-ui/react";

export default async function LiveMenu({
  competitionInfo,
  children,
  scoretakingSoftware,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
  scoretakingSoftware: string;
}) {
  const { t } = await getT();

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

  const { data, error, response } = await getRounds(competitionInfo.id);

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  return (
    <RoundsInfoProvider
      competitionId={competitionInfo.id}
      initialRounds={data.rounds}
    >
      <LiveTabs competitionInfo={competitionInfo}>{children}</LiveTabs>
    </RoundsInfoProvider>
  );
}
