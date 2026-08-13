import { auth } from "@/auth";
import { Alert, Box, Card, VStack } from "@chakra-ui/react";
import { cache } from "react";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";
import RegistrationPanel from "@/app/(wca)/(with-background)/competitions/[competitionId]/register/RegistrationPanel";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { RegistrationCard } from "@/components/competitions/Cards";
import { ChakraMarkdown } from "@/components/Markdown";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

const fetchConfig = cache(async (authToken: string, competitionId: string) => {
  const client = serverClientWithToken(authToken);

  return await client.GET(
    "/v1/competitions/{competitionId}/registration_config",
    {
      params: { path: { competitionId } },
    },
  );
});

const fetchRegistration = cache(
  async (authToken: string, competitionId: string, userId: number) => {
    const client = serverClientWithToken(authToken);

    return await client.GET(
      "/v1/competitions/{competitionId}/registrations/{userId}",
      {
        params: { path: { competitionId, userId } },
      },
    );
  },
);

const fetchEligibility = cache(
  async (authToken: string, competitionId: string) => {
    const client = serverClientWithToken(authToken);

    return await client.GET(
      "/v1/competitions/{competitionId}/registration_eligibility",
      {
        params: { path: { competitionId } },
      },
    );
  },
);

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { t } = await getT();
  const session = await auth();

  if (session === null) {
    return (
      <Alert.Root>
        <Alert.Indicator />
        <Alert.Content>You need to log in first</Alert.Content>
      </Alert.Root>
    );
  }

  // Sessions minted before the WCA user id was carried through the token cannot address the
  //   user-scoped registration API, and signing in again is what mints a token that can.
  if (session.wcaUserId === undefined || Number.isNaN(session.wcaUserId)) {
    return (
      <Alert.Root status="warning">
        <Alert.Indicator />
        <Alert.Content>
          Your session is out of date. Please sign out and sign in again.
        </Alert.Content>
      </Alert.Root>
    );
  }

  const competitionId = (await params).competitionId;

  const competitionInfoResponse = await getCompetitionInfo(competitionId);

  if (competitionInfoResponse.error) {
    return <OpenapiError t={t} response={competitionInfoResponse.response} />;
  }

  const competitionInfo = competitionInfoResponse.data;

  const stepConfig = await fetchConfig(session.accessToken, competitionId);

  if (stepConfig.error) {
    return <OpenapiError t={t} response={stepConfig.response} />;
  }

  const registrationResponse = await fetchRegistration(
    session.accessToken,
    competitionId,
    session.wcaUserId,
  );

  // A 404 is how the backend says "this user has not registered yet", which is a normal state here.
  if (
    registrationResponse.error &&
    registrationResponse.response.status !== 404
  ) {
    return <OpenapiError t={t} response={registrationResponse.response} />;
  }

  const eligibility = await fetchEligibility(
    session.accessToken,
    competitionId,
  );

  if (eligibility.error) {
    return <OpenapiError t={t} response={eligibility.response} />;
  }

  return (
    <VStack>
      <Box width="full" asChild>
        <RegistrationCard competitionInfo={competitionInfo} columns={3} />
      </Box>
      {competitionInfo.extra_registration_requirements && (
        <Card.Root width="full">
          <Card.Body>
            <ChakraMarkdown
              headingAs={Card.Title}
              paragraphAs={Card.Description}
            >
              {competitionInfo.extra_registration_requirements}
            </ChakraMarkdown>
          </Card.Body>
        </Card.Root>
      )}
      <Card.Root width="full">
        <Card.Body>
          <RegistrationPanel
            steps={stepConfig.data}
            competitionInfo={competitionInfo}
            eligibility={eligibility.data}
            userId={session.wcaUserId}
            initialRegistration={registrationResponse.data ?? null}
          />
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
