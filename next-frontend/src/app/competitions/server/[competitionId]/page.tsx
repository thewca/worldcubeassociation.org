import { components } from "@/lib/wca/wcaSchema";
import { Container, Heading } from "@chakra-ui/react";
import PermissionProvider from "@/providers/PermissionProvider";
import PermissionsTestMessage from "@/components/competitions/permissionsTestMessage";

export default async function CompetitionOverView({ params }: { params: Promise<{ competitionId: string }> }){
  const { competitionId } = await params;
  const data = await fetch(`${process.env.OIDC_ISSUER}/api/v0/competitions/${competitionId}/`);
  const competitionInfo: components["schemas"]["CompetitionInfo"] = await data.json();

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
