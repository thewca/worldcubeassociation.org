import { Container } from "@chakra-ui/react";
import TabMenu from "@/components/competitions/TabMenu";

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
      <TabMenu competitionId={competitionId}>{children}</TabMenu>
    </Container>
  );
}
