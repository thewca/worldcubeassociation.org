import { auth } from "@/auth";
import { Alert, Box, Card, VStack } from "@chakra-ui/react";
import { cache } from "react";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";
import type { components } from "@/types/openapi";
import StepPanel from "@/app/(wca)/competitions/[competitionId]/register/StepPanel";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import RegistrationRequirementsCard
  from "@/app/(wca)/competitions/[competitionId]/register/RegistrationRequirementsCard";

const fetchConfig = cache(async (authToken: string, competitionId: string) => {
  const client = serverClientWithToken(authToken);

  return await client.GET("/v1/competitions/{competitionId}/registration_config", {
    params: { path: { competitionId } }
  })
});

type StepKey = components["schemas"]["RegistrationConfig"]["key"] | "approval";

type Step = { key: StepKey, isEditable: boolean };

export default async function RegisterPage({
  params
}: {
  params: Promise<{ competitionId: string }>
}) {
  const session = await auth();

  if (session === null) {
    return (
      <Alert.Root>
        <Alert.Indicator />
        <Alert.Content>You need to log in first</Alert.Content>
      </Alert.Root>
    );
  }

  const competitionId = (await params).competitionId;

  const competitionInfoResponse = await getCompetitionInfo(competitionId);

  if (competitionInfoResponse.error) {
    return "Something went wrong: The competition does not exist"
  }

  const competitionInfo = competitionInfoResponse.data;

  // @ts-expect-error TODO: Fix this
  const stepConfig = await fetchConfig(session.accessToken, competitionId);

  if (stepConfig.error) {
    return "Something went wrong while fetching"
  }

  const steps = [
    ...stepConfig.data,
    { key: 'approval', isEditable: false }
  ] satisfies Step[];

  return (
    <VStack>
      <Box width="full">
        <RegistrationRequirementsCard competitionInfo={competitionInfo} />
      </Box>
      <Card.Root coloredBg width="full">
        <Card.Body>
          <StepPanel steps={steps} competitionInfo={competitionInfo} />
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
