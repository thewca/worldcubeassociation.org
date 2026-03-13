import { Container } from "@chakra-ui/react";
import TabMenu from "@/components/competitions/TabMenu";
import MobileMenu from "@/components/competitions/MobileMenu";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import LiveMenu from "@/components/competitions/LiveMenu";

type TitleProps = {
  params: Promise<{ competitionId: string }>;
};

export async function generateMetadata({
  params,
}: TitleProps): Promise<Metadata> {
  const { competitionId } = await params;

  const { data: competitionInfo, error } =
    await getCompetitionInfo(competitionId);

  if (error || !competitionInfo) return { title: "Competition Not Found" };

  return {
    title: `${competitionInfo.name}`,
  };
}

const LIVE_RESULT_BETA = !!process.env.LIVE_RESULT_BETA;

export default async function CompetitionLayout({
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
    error,
    response,
  } = await getCompetitionInfo(competitionId);

  if (error) return <OpenapiError t={t} response={response} />;

  return (
    <Container pt="8">
      {LIVE_RESULT_BETA ? (
        <LiveMenu competitionInfo={competitionInfo}>{children}</LiveMenu>
      ) : (
        <TabMenu competitionInfo={competitionInfo}>{children}</TabMenu>
      )}
    </Container>
  );
}
