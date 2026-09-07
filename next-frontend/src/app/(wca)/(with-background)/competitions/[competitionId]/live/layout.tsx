import { getRounds } from "@/lib/wca/live/getRounds";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import { RoundsInfoProvider } from "@/providers/RoundInfoProvider";

export default async function LiveLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const { data, error, response } = await getRounds(competitionId);

  if (error) {
    return <OpenapiError response={response} t={t} />;
  }

  return (
    <RoundsInfoProvider
      competitionId={competitionId}
      initialRounds={data.rounds}
    >
      {children}
    </RoundsInfoProvider>
  );
}
