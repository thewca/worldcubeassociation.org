import { Container } from "@chakra-ui/react";
import TabMenu from "@/components/competitions/TabMenu";
import MobileMenu from "@/components/competitions/MobileMenu";

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  return (
    <Container minW="80vw" p="8">
      <MobileMenu competitionId={competitionId}>{children}</MobileMenu>
      <TabMenu competitionId={competitionId}>{children}</TabMenu>
    </Container>
  );
}
