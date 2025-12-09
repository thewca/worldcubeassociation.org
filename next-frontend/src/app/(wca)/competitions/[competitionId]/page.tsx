import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { GridItem, SimpleGrid, Stack, Text, VStack } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import { MarkdownFirstImage } from "@/components/MarkdownFirstImage";
import {
  AdditionalInformationCard,
  EventCard,
  InfoCard,
  RefundPolicyCard,
  RegistrationCard,
  VenueDetailsCard,
} from "@/components/competitions/Cards";
import OrganizationTeamCard from "@/components/competitions/OrganizerCard";

export default async function CompetitionOverView({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  // TODO: parse the hash and then redirect
  // redirect(`/competitions/${competitionId}/general`);

  return <GeneralPage competitionId={competitionId} />;
}

async function GeneralPage({ competitionId }: { competitionId: string }) {
  const { data: competitionInfo, error } =
    await getCompetitionInfo(competitionId);

  if (error) {
    return <Text>Error fetching competition</Text>;
  }

  if (!competitionInfo) {
    return <Text>Competition does not exist</Text>;
  }

  const { t } = await getT();

  return (
    <>
      <SimpleGrid gap="8" columns={{ base: 1, md: 2 }}>
        <VStack gap="8" alignItems="stretch">
          <InfoCard competitionInfo={competitionInfo} t={t} />
          <RegistrationCard competitionInfo={competitionInfo} />
          <EventCard competitionInfo={competitionInfo} />
        </VStack>
        <VStack gap="8" alignItems="stretch">
          <OrganizationTeamCard competitionInfo={competitionInfo} />
          <Stack gap="8" width="100%" direction={{ base: "column", sm: "row" }}>
            <VenueDetailsCard competitionInfo={competitionInfo} />
            <MarkdownFirstImage content={competitionInfo.information} />
          </Stack>
          <RefundPolicyCard competitionInfo={competitionInfo} />
        </VStack>
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <AdditionalInformationCard competitionInfo={competitionInfo} />
        </GridItem>
      </SimpleGrid>
    </>
  );
}
