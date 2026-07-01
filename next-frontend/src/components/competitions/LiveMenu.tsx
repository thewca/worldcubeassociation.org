import { components } from "@/types/openapi";
import { getRounds } from "@/lib/wca/live/getRounds";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import { RoundsInfoProvider } from "@/providers/RoundInfoProvider";
import LiveTabs from "@/components/competitions/LiveTabs";

export default async function LiveMenu({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const { t } = await getT();

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
