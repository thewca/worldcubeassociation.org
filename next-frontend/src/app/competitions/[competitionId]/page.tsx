import { Container, Heading } from "@chakra-ui/react";
import PermissionProvider from "@/providers/PermissionProvider";
import PermissionsTestMessage from "@/components/competitions/permissionsTestMessage";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";

export default async function CompetitionOverView({ params }: { params: Promise<{ competitionId: string }> }){
  const { competitionId } = await params;
  const { data: competitionInfo, error } = await getCompetitionInfo(competitionId);

  if(error){
    return <p>
      Error fetching competition
    </p>
  }

  if(!competitionInfo){
    return <p>
      Competition does not exist
    </p>
  }

  return (
    <Container centerContent>
      <Heading>{competitionInfo.id}</Heading>
      <PermissionProvider>
        <PermissionsTestMessage competitionInfo={competitionInfo} />
      </PermissionProvider>
    </Container>
  );

}
