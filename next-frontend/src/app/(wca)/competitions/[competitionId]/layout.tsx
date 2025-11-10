import { Container, Text } from "@chakra-ui/react";
import TabMenu from "@/components/competitions/TabMenu";
import MobileMenu from "@/components/competitions/MobileMenu";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { data: competitionInfo, error } =
    await getCompetitionInfo(competitionId);

  if (error) {
    return <Text>Error fetching competition</Text>;
  }

  return (
    <Container pt="8">
      <MobileMenu competitionInfo={competitionInfo}>{children}</MobileMenu>
      <TabMenu competitionInfo={competitionInfo}>{children}</TabMenu>
    </Container>
  );
}
