import { Card, Container, Table, VStack } from "@chakra-ui/react";
import CompetitionTableEntry from "@/components/CompetitionTableEntry";
import RemovableCard from "@/components/RemovableCard";

import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";

// Array of competition IDs you want to retrieve data for
const compIds = ["OC2022", "OC2024", "WC2025"];

// Async function to populate comp data
const getAllCompData = async () => {
  const compDataArray = [];

  for (const competitionId of compIds) {
    const { data: competitionInfo, error } =
      await getCompetitionInfo(competitionId);

    if (error) {
      console.error(
        `Error fetching competition with ID ${competitionId}:`,
        error,
      );
      continue;
    }

    if (!competitionInfo) {
      console.warn(`Competition with ID ${competitionId} does not exist`);
      continue;
    }

    // Transform data into the desired format
    const formattedComp = {
      name: competitionInfo.name,
      id: competitionInfo.id,
      dateStart: new Date(competitionInfo.start_date),
      dateEnd: new Date(competitionInfo.end_date),
      city: competitionInfo.city,
      country: competitionInfo.country_iso2,
      regoStatus: competitionInfo.registration_currently_open
        ? "open"
        : "closed",
      competitorLimit: competitionInfo.competitor_limit,
      events: competitionInfo.event_ids,
      mainEvent: competitionInfo.main_event_id,
    };

    compDataArray.push(formattedComp);
  }

  return compDataArray;
};

export default async function Competitions() {
  const competitions = await getAllCompData();

  return (
    <Container>
      <VStack gap="8" width="full" pt="8">
        <RemovableCard
          imageUrl="https://ando527.github.io/wcaWireframes/images/newcomer.png"
          heading="Why Compete?"
          description="This section will only be visible to new visitors to the site, and not show up if the user is logged in, or has previously exited this popup. The 'Find out more' button will direct visitors to the homepage."
          buttonText="Learn More"
          buttonUrl="/"
        />
        <Card.Root
          bg="bg.inverted"
          color="fg.inverted"
          shadow="wca"
          overflow="hidden"
          width="full"
        >
          <Card.Body p={0}>
            <Table.Root size="xs" rounded="md" variant="competitions">
              <Table.Body>
                {competitions.map((comp) => (
                  <CompetitionTableEntry comp={comp} key={comp.id} />
                ))}
              </Table.Body>
            </Table.Root>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
}
