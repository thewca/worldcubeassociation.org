import { Container, Tabs, Text, Card } from "@chakra-ui/react";
import { getPersonInfo } from "@/lib/wca/persons/getPersonInfo";
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
import { StaffColor } from "@/components/RoleBadge";
import _ from "lodash";
import { FULL_EVENT_IDS } from "@/lib/wca/data/events";
import { Metadata } from "next";

type TitleProps = {
  params: Promise<{ wcaId: string }>;
};

export async function generateMetadata({
  params,
}: TitleProps): Promise<Metadata> {
  const { wcaId } = await params;

  const { data: personDetails, error } = await getPersonInfo(wcaId);

  if (error || !personDetails) return { title: "Person Not Found" };

  return {
    title: `${personDetails.person.name}`,
  };
}

export default async function PersonOverview({
  params,
}: {
  params: Promise<{ wcaId: string }>;
}) {
  const { wcaId } = await params;
  const { data: personDetails, error } = await getPersonInfo(wcaId);

  if (error) {
    return <Text>Error fetching person</Text>;
  }

  if (!personDetails) {
    return <Text>Person does not exist</Text>;
  }

  const roles: {
    teamRole: string;
    teamText: string;
    staffColor: StaffColor;
  }[] = personDetails.person.teams.map((team) => {
    const teamText = team.friendly_id.toUpperCase();

    const roleMap = [
      { condition: teamText === "BOARD", teamRole: "", staffColor: "black" },
      { condition: team.leader, teamRole: "LEADER", staffColor: "blue" },
      {
        condition: team.senior_member,
        teamRole: "SENIOR MEMBER",
        staffColor: "yellow",
      },
      { condition: true, teamRole: "MEMBER", staffColor: "green" },
    ];

    const { teamRole, staffColor } = roleMap.find((r) => r.condition)!;

    return { teamRole, teamText, staffColor: staffColor as StaffColor };
  });

  if (personDetails.person.delegate_status) {
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

  const medalCount =
    personDetails.medals.gold +
    personDetails.medals.silver +
    personDetails.medals.bronze;

  const recordCount =
    personDetails.records.national +
    personDetails.records.continental +
    personDetails.records.world;

  const podiums = personDetails.championship_podiums;

  const championshipPodiumCount =
    (podiums?.continental?.length ?? 0) +
    (podiums?.national?.length ?? 0) +
    (podiums?.world?.length ?? 0);

  const hasRecords = recordCount > 0;
  const hasMedals = medalCount > 0;
  const hasChampionshipPodiums = championshipPodiumCount !== 0;

  const eventsWithResults = _.intersection(
    FULL_EVENT_IDS,
    Object.keys(personDetails.personal_records),
  );

  return (
    <Container centerContent>
      {/* Profile Section */}
      <SimpleGrid gap={8} columns={24} paddingY={8}>
        <GridItem colSpan={7}>
          <ProfileCard
            name={personDetails.person.name}
            profilePicture={personDetails.person.avatar.url}
            roles={roles}
            wcaId={wcaId}
            gender={personDetails.person.gender}
            regionIso2={personDetails.person.country_iso2}
            competitions={personDetails.competition_count}
            completedSolves={personDetails.total_solves}
            medalCount={medalCount}
            recordCount={recordCount}
            championshipPodiumCount={championshipPodiumCount}
          />
        </GridItem>
        {/* Records and Medals */}
        <GridItem colSpan={17}>
          <PersonalRecordsTable records={personDetails.personal_records} />
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
              <Card.Root>
                <Tabs.Root
                  defaultValue="results"
                  fitted
                  variant="plain"
                  lazyMount
                  colorPalette="blue"
                  highContrast
                >
                  <Card.Header padding={0}>
                    <Tabs.List>
                      <Tabs.Trigger value="results">Results</Tabs.Trigger>
                      <Tabs.Trigger value="competitions">
                        Competitions
                      </Tabs.Trigger>
                      {hasRecords && (
                        <Tabs.Trigger value="records">Records</Tabs.Trigger>
                      )}
                      {hasChampionshipPodiums && (
                        <Tabs.Trigger value="championship-podiums">
                          Championship Podiums
                        </Tabs.Trigger>
                      )}
                      <Tabs.Trigger value="map">Map</Tabs.Trigger>
                      <Tabs.Indicator
                        bg="colorPalette.solid"
                        borderBottomRadius={0}
                      />
                    </Tabs.List>
                  </Card.Header>
                  <Card.Body>
                    <Tabs.Content value="results">
                      <ResultsTab
                        wcaId={wcaId}
                        eventsWithResults={eventsWithResults}
                      />
                    </Tabs.Content>
                    <Tabs.Content value="competitions">
                      <CompetitionsTab wcaId={wcaId} />
                    </Tabs.Content>
                    {hasRecords && (
                      <Tabs.Content value="records">
                        <RecordsTab wcaId={wcaId} />
                      </Tabs.Content>
                    )}
                    <Tabs.Content value="championship-podiums">
                      {hasChampionshipPodiums && (
                        <ChampionshipPodiumsTab
                          championshipPodiums={
                            personDetails.championship_podiums
                          }
                        />
                      )}
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
