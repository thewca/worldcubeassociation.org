import {
  Card,
  Container,
  Table,
  VStack,
  Heading,
  Flex,
  Button,
  Text,
  Switch,
  Icon
} from "@chakra-ui/react";
import CompetitionTableEntry from "@/components/CompetitionTableEntry";
import RemovableCard from "@/components/RemovableCard";

import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import AllCompsIcon from "@/components/icons/AllCompsIcon";
import MapIcon from "@/components/icons/MapIcon";
import ListIcon from "@/components/icons/ListIcon";

import CompRegoFullButOpenOrangeIcon from "@/components/icons/CompRegoFullButOpen_orangeIcon";
import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";


// Array of competition IDs you want to retrieve data for
const compIds = [
  "OC2022",
  "OC2024",
  "WC2025",
  "PerthAutumn2025",
  "WC2011",
  "WC2013",
  "WC2015",
  "WC2017",
  "WC2023",
  "WC2019",
];

// Async function to populate comp data
const getAllCompData = async () => {
  const competitionPromises = compIds.map(async (competitionId) => {
    const { data: competitionInfo, error } =
      await getCompetitionInfo(competitionId);

    if (error) {
      console.error(
        `Error fetching competition with ID ${competitionId}:`,
        error,
      );
      return null;
    }

    if (!competitionInfo) {
      console.warn(`Competition with ID ${competitionId} does not exist`);
      return null;
    }

    return competitionInfo;
  });

  const results = await Promise.all(competitionPromises);

  // Filter out null results (errors or missing comps)
  return results.filter((comp) => comp !== null);
};

export default async function Competitions() {
  const competitions = await getAllCompData();

  return (
    <Container>
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <RemovableCard
          imageUrl="https://ando527.github.io/wcaWireframes/images/newcomer.png"
          heading="Why Compete?"
          description="This section will only be visible to new visitors to the site, and not show up if the user is logged in, or has previously exited this popup. The 'Find out more' button will direct visitors to the homepage."
          buttonText="Learn More"
          buttonUrl="/"
        />
        <Heading size="5xl">
          <AllCompsIcon boxSize="1em" />
          All Competitions
        </Heading>
        <Flex gap="2" width="full">
          <Button>Filter 1</Button>
          <Button variant="outline">Filter 2</Button>
          <Button variant="solid">Filter 3</Button>
          <Switch.Root colorPalette="blue" size="lg">
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
              <Switch.Indicator fallback={<Icon as={ListIcon} color="gray.400" />}>
                <Icon as={MapIcon} colorPalette="yellow.400" />
              </Switch.Indicator>
            </Switch.Control>
            <Switch.Label>Map View</Switch.Label>
          </Switch.Root>
          <Flex gap="2" ml="auto">
            <Button variant="outline">Filter Right</Button>
          </Flex>
        </Flex>
        <Flex gap="2" width="full">
          <Text>Registration Key:</Text>
          <CompRegoFullButOpenOrangeIcon /><Text>Full</Text>
          <CompRegoNotFullOpenGreenIcon /><Text>Open</Text>
          <CompRegoNotOpenYetGreyIcon /><Text>Not Open</Text>
          <CompRegoClosedRedIcon /><Text>Closed</Text>
          <Text ml="auto">Currently Displaying: 10 competitions</Text>
        </Flex>
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
