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
import { StaffColor } from "@/components/RoleBadge";
import { getT } from "@/lib/i18n/get18n";

export default async function PersonOverview({
  params,
}: {
  params: Promise<{ wcaId: string }>;
}) {
  const { wcaId } = await params;
  const { data: personDetails, error } = await getResultsByPerson(wcaId);
  const { t } = await getT();

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

  const hasRecords =
    personDetails.records.national > 0 ||
    personDetails.records.continental > 0 ||
    personDetails.records.world > 0;
  const hasMedals =
    personDetails.medals.gold > 0 ||
    personDetails.medals.silver > 0 ||
    personDetails.medals.bronze > 0;
  const hasChampionshipPodiums =
    personDetails.championship_podiums?.continental?.length ||
    personDetails.championship_podiums?.national?.length ||
    personDetails.championship_podiums?.world?.length;

  return (
    <Container centerContent maxW="1800px">
      {/* Profile Section */}
      <SimpleGrid gap={8} columns={24} padding={5}>
        <GridItem colSpan={7} h="80lvh" position="sticky" top="0px" pt="20px">
          <ProfileCard
            name={personDetails.person.name}
            profilePicture={personDetails.person.avatar.url}
            roles={roles}
            wcaId={wcaId}
            gender={t(`enums.user.gender.${personDetails.person.gender}`)}
            regionIso2={personDetails.person.country_iso2}
            competitions={personDetails.competition_count}
            completedSolves={1659}
          />
        </GridItem>
        {/* Records and Medals */}
        <GridItem colSpan={17} pt="20px">
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
              <Card.Root coloredBg>
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
                      <Tabs.Indicator bg="colorPalette.solid" borderBottomRadius={0} />
                    </Tabs.List>
                  </Card.Header>
                  <Card.Body>
                    <Tabs.Content value="results">
                      <ResultsTab wcaId={wcaId} />
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
