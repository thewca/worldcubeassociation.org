import { Container } from "@chakra-ui/react";
import TabMenu from "@/components/competitions/TabMenu";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const competitionInfo = (await getCompetitionInfo(competitionId))!.data;

  return (
    <Container minW="80vw" p="8">
      <TabMenu competitionId={competitionId} competitionInfo={competitionInfo!}>
        {children}
      </TabMenu>
    </Container>
  );
}
