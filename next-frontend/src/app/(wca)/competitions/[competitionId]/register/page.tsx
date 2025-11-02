import { auth } from "@/auth";
import {Alert, Code} from "@chakra-ui/react";
import { cache } from "react";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";

const fetchConfig = cache(async (authToken: string, competitionId: string) => {
  const client = serverClientWithToken(authToken);

  return await client.GET("/v1/competitions/{competitionId}/registration_config", {
    params: { path: { competitionId } }
  })
})

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
  const stepConfig = await fetchConfig(session.accessToken, competitionId);

  if (stepConfig.error) {
    return "Something went wrong while fetching"
  }

  return (
    <Code>{JSON.stringify(stepConfig.data)}</Code>
  );
}
