import { Container, Heading, Text } from "@chakra-ui/react";
import PermissionProvider from "@/providers/PermissionProvider";
import PermissionsTestMessage from "@/components/competitions/permissionsTestMessage";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";

export default async function CompetitionOverView({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { data: competitionInfo, error } =
    await getCompetitionInfo(competitionId);

  if (error) {
    return <Text>Error fetching competition</Text>;
  }

  if (!competitionInfo) {
    return <Text>Competition does not exist</Text>;
  }
  console.log(competitionInfo);
  return (
    <Container centerContent>
      <Heading>{competitionInfo.name}</Heading>
      <PermissionProvider>
        <PermissionsTestMessage competitionInfo={competitionInfo} />
      </PermissionProvider>
    </Container>
  );
}
