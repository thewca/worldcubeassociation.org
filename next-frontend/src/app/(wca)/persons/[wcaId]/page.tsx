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
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import events from "@/lib/wca/data/events";
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

    // Default values
    let teamRole = "";
    let staffColor: StaffColor = "black";

    if (teamText === "BOARD") {
      staffColor = "black";
    } else if (team.leader) {
      teamRole = "LEADER";
      staffColor = "blue";
    } else if (team.senior_member) {
      teamRole = "SENIOR MEMBER";
      staffColor = "yellow";
    } else {
      teamRole = "MEMBER";
      staffColor = "green";
    }

    return { teamRole, teamText, staffColor };
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
    const records = Object.entries(personalRecords).map(([event, record]) => ({
      event,
      single: formatAttemptResult(record.single.best, event),
      snr: record.single.country_rank,
      scr: record.single.continent_rank,
      swr: record.single.world_rank,
      average:
        record.average?.best && record.average.best > 0
          ? formatAttemptResult(record.average.best, event)
          : "",
      anr: record.average?.country_rank ?? 0,
      acr: record.average?.continent_rank ?? 0,
      awr: record.average?.world_rank ?? 0,
    }));

    return events.official
      .map((ev) => records.find((r) => r.event === ev.id))
      .filter((r): r is RecordItem => Boolean(r));
  };

  const hasRecords =
    personDetails.records.national > 0 ||
    personDetails.records.continental > 0 ||
    personDetails.records.world > 0;
  const hasMedals =
    personDetails.medals.gold > 0 ||
    personDetails.medals.silver > 0 ||
    personDetails.medals.bronze > 0;

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
            gender={t("enums.user.gender")}
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
