import { getResultByPerson } from "@/lib/wca/live/getResultByPerson";
import ByPersonResults from "./ByPersonResults";
import { Button, Heading, Link, Stack } from "@chakra-ui/react";
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

  console.log(personResultRequest.data);

  const { results, name, wcaId } = personResultRequest.data;

  return (
    <>
      <Stack direction="row" alignItems="center" gap="5">
        <Heading textStyle={{ base: "h3", md: "h2" }}>{name}</Heading>
        <Button size="xs" asChild>
          <Link href={`https://www.worldcubeassociation.org/persons/${wcaId}`}>
            Visit WCA profile
          </Link>
        </Button>
      </Stack>
      <ByPersonResults competitionId={competitionId} results={results} />
    </>
  );
}
