import { Container, Heading } from "@chakra-ui/react";
import { getResultByPerson } from "@/lib/wca/live/getResultByPerson";
import ByPersonResults from "./ByPersonResults";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function PersonResults({
  params,
}: {
  params: Promise<{ registrationId: string; competitionId: string }>;
}) {
  const { competitionId, registrationId } = await params;

  const personResultRequest = await getResultByPerson(
    competitionId,
    registrationId,
  );

  if (!personResultRequest.data) {
    return <p>Something went wrong while trying to fetch results</p>;
  }

  const { name, results } = personResultRequest.data;

  return (
    <Container>
      <Heading textStyle="h1">{name}</Heading>
      <ByPersonResults competitionId={competitionId} results={results} />
    </Container>
  );
}
