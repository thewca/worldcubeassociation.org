import { auth } from "@/auth";
import { Alert, Box, Card, VStack } from "@chakra-ui/react";
import { cache } from "react";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";
import StepPanel from "@/app/(wca)/competitions/[competitionId]/register/StepPanel";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import RegistrationRequirementsCard
  from "@/app/(wca)/competitions/[competitionId]/register/RegistrationRequirementsCard";
import {MarkdownProse} from "@/components/Markdown";

const fetchConfig = cache(async (authToken: string, competitionId: string) => {
  const client = serverClientWithToken(authToken);

  return await client.GET("/v1/competitions/{competitionId}/registration_config", {
    params: { path: { competitionId } }
  })
});

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

  return (
    <VStack>
      <Box width="full" asChild>
        <RegistrationRequirementsCard competitionInfo={competitionInfo} />
      </Box>
      {competitionInfo.extra_registration_requirements && (
        <Card.Root width="full">
          <MarkdownProse as={Card.Body} content={competitionInfo.extra_registration_requirements} />
        </Card.Root>
      )}
      <Card.Root width="full">
        <Card.Header>
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>This is NOT the real registration panel!!</Alert.Title>
              <Alert.Description>You are currently viewing the demo of an upcoming website redesign. Any data submitted here will NOT allow you to actually compete!</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        </Card.Header>
        <Card.Body>
          <StepPanel steps={stepConfig.data} competitionInfo={competitionInfo} />
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
