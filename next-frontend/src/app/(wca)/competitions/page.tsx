import { Card, Container, Table } from "@chakra-ui/react";
import CompetitionTableEntry from "@/components/CompetitionTableEntry";

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

const competitions = await getAllCompData();

export default function Competitions() {
  return (
    <Container>
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
    </Container>
  );
}
