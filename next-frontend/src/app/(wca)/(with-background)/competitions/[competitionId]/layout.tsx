import { Container } from "@chakra-ui/react";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import CompetitionMenu from "@/components/competitions/CompetitionMenu";
import ConfirmProvider from "@/providers/ConfirmProvider";

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
      <ConfirmProvider>
        <CompetitionMenu competitionInfo={competitionInfo}>
          {children}
        </CompetitionMenu>
      </ConfirmProvider>
    </Container>
  );
}
