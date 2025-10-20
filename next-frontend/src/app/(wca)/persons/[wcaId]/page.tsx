import { Container, Tabs, Text, Card } from "@chakra-ui/react";
import { getResultsByPerson } from "@/lib/wca/persons/getResultsByPerson";
import ProfileCard from "@/components/persons/ProfileCard";
import { GridItem, SimpleGrid } from "@chakra-ui/react";
import PersonalRecordsTable from "@/components/persons/PersonalRecordsTable";
import MedalSummaryCard from "@/components/persons/MedalSummaryCard";
import RecordSummaryCard from "@/components/persons/RecordSummaryCard";
import ResultsTab from "@/components/persons/ResultsTab";
import CompetitionsTab from "@/components/persons/CompetitionsTab";
import RecordsTab from "@/components/persons/RecordsTab";
import MapTab from "@/components/persons/MapTab";
import ChampionshipPodiumsTab from "@/components/persons/ChampionshipPodiums";
import type { components } from "@/types/openapi";
import { StaffColor } from "@/components/RoleBadge";

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

  let genderText = "Male";
  if (personDetails.person.gender == "f") {
    genderText = "Female";
  } else if (personDetails.person.gender == "o") {
    genderText = "o";
  }

  const roles: {
    teamRole: string;
    teamText: string;
    staffColor: StaffColor;
  }[] = [];

  personDetails.person.teams.forEach(
    (team: {
      friendly_id: string;
      leader: boolean;
      senior_member: boolean;
    }) => {
      const teamText = team.friendly_id.toUpperCase();
      let teamRole = "";
      let staffColour: StaffColor = "black";

      if (teamText == "BOARD") {
        staffColour = "black";
      } else if (team.leader == true) {
        teamRole = "LEADER";
        staffColour = "blue";
      } else {
        if (team.senior_member == true) {
          teamRole = "SENIOR MEMBER";
          staffColour = "yellow";
        } else {
          staffColour = "green";
          teamRole = "MEMBER";
        }
      }

      roles.push({
        teamRole: teamRole,
        teamText: teamText,
        staffColor: staffColour,
      });
    },
  );

  if (personDetails.person.delegate_status != null) {
    const delegateText = personDetails.person.delegate_status
      .toUpperCase()
      .replace(/_/g, " ")
      .replace("DELEGATE", "");
    roles.push({
      teamRole: "DELEGATE",
      teamText: delegateText,
      staffColor: "red",
    });
  }

  interface RecordItem {
    event: string;
    snr: number;
    scr: number;
    swr: number;
    single: string;
    average: string;
    anr: number;
    acr: number;
    awr: number;
  }

  const transformPersonalRecords = (
    personalRecords: Record<
      string,
      components["schemas"]["SingleAndAverageRank"]
    >,
  ): RecordItem[] => {
    const eventOrder = [
      "333",
      "222",
      "444",
      "555",
      "666",
      "777",
      "333bf",
      "333fm",
      "333oh",
      "clock",
      "minx",
      "pyram",
      "skewb",
      "sq1",
      "444bf",
      "555bf",
      "333mbf",
      "magic",
      "mmagic",
      "333mbo",
    ];

    // Helper function to decode 333mbf results
    const decode333mbf = (result: number): string => {
      const resultStr = result.toString();
      const isOldFormat = resultStr.startsWith("1");

      if (isOldFormat) {
        const SS = parseInt(resultStr.slice(1, 3));
        const AA = parseInt(resultStr.slice(3, 5));
        const TTTTT = parseInt(resultStr.slice(5));

        const solved = 99 - SS;
        const attempted = AA;
        const timeInSeconds = TTTTT === 99999 ? "Unknown" : secToMin(TTTTT);

        return `${solved}/${attempted} ${timeInSeconds}`;
      } else {
        const DD = parseInt(resultStr.slice(0, 2));
        const TTTTT = parseInt(resultStr.slice(2, 7));
        const MM = parseInt(resultStr.slice(7, 9));

        const difference = 99 - DD;
        const missed = MM;
        const solved = difference + missed;
        const attempted = solved + missed;
        const timeInSeconds = TTTTT === 99999 ? "Unknown" : secToMin(TTTTT);

        return `${solved}/${attempted} ${timeInSeconds}`;
      }
    };

    // Helper function to format results (including 333fm averages)
    const formatResult = (event: string, result: number): string => {
      if (event === "333fm") {
        if (result <= 99) {
          // For single results (number of moves)
          return result.toString();
        }
      }

      if (result > 5999) {
        const minutes = Math.floor(result / 6000);
        const seconds = ((result % 6000) / 100).toFixed(2);
        return `${minutes}:${seconds.padStart(5, "0")}`; // Ensures two decimal places
      }
      return (result / 100).toFixed(2); // Converts centiseconds to seconds
    };

    // Helper function to convert seconds to mm:ss format
    const secToMin = (seconds: number): string => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const paddedSeconds = remainingSeconds.toString().padStart(2, "0");

      return `${minutes}:${paddedSeconds}`;
    };

    // Transform the personalRecords object into an array
    const recordsArray = Object.entries(personalRecords).map(
      ([event, record]) => ({
        event,
        single:
          event === "333mbf"
            ? decode333mbf(record.single.best)
            : formatResult(event, record.single.best),
        snr: record.single.country_rank,
        scr: record.single.continent_rank,
        swr: record.single.world_rank,
        average:
          record.average && record.average.best > 0
            ? formatResult(event, record.average.best)
            : "",
        anr: record.average?.country_rank || 0,
        acr: record.average?.continent_rank || 0,
        awr: record.average?.world_rank || 0,
      }),
    );

    // Reorder the array based on eventOrder
    return eventOrder
      .map((event) => recordsArray.find((record) => record.event === event))
      .filter((record) => !!record); // Remove undefined items
  };

  let hasRecords = false;
  let hasMedals = false;
  if (
    personDetails.records.national > 0 ||
    personDetails.records.continental > 0 ||
    personDetails.records.world > 0
  ) {
    hasRecords = true;
  }

  if (
    personDetails.medals.gold > 0 ||
    personDetails.medals.silver > 0 ||
    personDetails.medals.bronze > 0
  ) {
    hasMedals = true;
  }

  return (
    <Container centerContent maxW="1800px">
      {/* Profile Section */}
      {/* TODO SLATE - stick the bottom of this Profile card to the bottom of the page */}
      <SimpleGrid gap={8} columns={24} padding={5}>
        <GridItem colSpan={7} h="80lvh" position="sticky" top="0px" pt="20px">
          <ProfileCard
            name={personDetails.person.name}
            profilePicture={personDetails.person.avatar.url}
            roles={roles}
            wcaId={wcaId}
            gender={genderText}
            regionIso2={personDetails.person.country_iso2}
            competitions={personDetails.competition_count}
            completedSolves={1659}
          />
        </GridItem>
        {/* Records and Medals */}
        <GridItem colSpan={17} pt="20px">
          <PersonalRecordsTable
            records={transformPersonalRecords(personDetails.personal_records)}
          />
          <SimpleGrid gap={8} columns={6} padding={0} pt={8}>
            {hasMedals && (
              <GridItem colSpan={hasRecords ? 3 : 6}>
                <MedalSummaryCard
                  gold={personDetails.medals.gold}
                  silver={personDetails.medals.silver}
                  bronze={personDetails.medals.bronze}
                />
              </GridItem>
            )}
            {hasRecords && (
              <GridItem colSpan={hasMedals ? 3 : 6}>
                <RecordSummaryCard
                  world={personDetails.records.world}
                  continental={personDetails.records.continental}
                  national={personDetails.records.national}
                />
              </GridItem>
            )}

            {/* Tabs */}
            <GridItem colSpan={6}>
              <Card.Root coloredBg>
                <Tabs.Root
                  defaultValue="results"
                  fitted
                  variant="results"
                  lazyMount
                  colorPalette="blue"
                >
                  <Card.Header padding={0}>
                    <Tabs.List>
                      <Tabs.Trigger value="results">Results</Tabs.Trigger>
                      <Tabs.Trigger value="competitions">
                        Competitions
                      </Tabs.Trigger>
                      <Tabs.Trigger value="records">Records</Tabs.Trigger>
                      <Tabs.Trigger value="championship-podiums">
                        Championship Podiums
                      </Tabs.Trigger>
                      <Tabs.Trigger value="map">Map</Tabs.Trigger>
                    </Tabs.List>
                  </Card.Header>
                  <Card.Body>
                    <Tabs.Content value="results">
                      <ResultsTab wcaId={wcaId} />
                    </Tabs.Content>
                    <Tabs.Content value="competitions">
                      <CompetitionsTab />
                      <Text>{JSON.stringify(personDetails, null, 2)}</Text>
                    </Tabs.Content>
                    <Tabs.Content value="records">
                      <RecordsTab />
                    </Tabs.Content>
                    <Tabs.Content value="championship-podiums">
                      <ChampionshipPodiumsTab />
                    </Tabs.Content>
                    <Tabs.Content value="map">
                      <MapTab />
                    </Tabs.Content>
                  </Card.Body>
                </Tabs.Root>
              </Card.Root>
            </GridItem>
          </SimpleGrid>
        </GridItem>
      </SimpleGrid>
    </Container>
  );
}
