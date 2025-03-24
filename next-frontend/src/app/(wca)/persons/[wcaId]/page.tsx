import { Container, Heading, Text } from "@chakra-ui/react";
import { getResultsByPerson } from "@/lib/wca/persons/getResultsByPerson";

export default async function PersonOverview({
  params,
}: {
  params: Promise<{ wcaId: string }>;
}) {
  const { wcaId } = await params;
  const { data: personDetails, error } = await getResultsByPerson(wcaId);

  if (error) {
    return <Text>Error fetching person</Text>;
  }

  if (!personDetails) {
    return <Text>Person does not exist</Text>;
  }

  return (
    <Container centerContent>
      <Heading>{personDetails.person.name}</Heading>
    </Container>
  );
}
