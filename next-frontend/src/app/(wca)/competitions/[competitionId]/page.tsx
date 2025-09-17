import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { HStack, Text, VStack } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import { MarkdownFirstImage } from "@/components/MarkdownFirstImage";
import {
  AdditionalInformationCard,
  EventCard,
  InfoCard,
  OrganizationTeamCard,
  RefundPolicyCard,
  RegistrationCard,
  VenueDetailsCard,
} from "@/components/competitions/Cards";

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
      <HStack gap="8" alignItems="stretch">
        <VStack maxW="45%" w="45%" gap="8">
          <InfoCard competitionInfo={competitionInfo} t={t} />
          <RegistrationCard competitionInfo={competitionInfo} />
          <EventCard competitionInfo={competitionInfo} />
        </VStack>
        <VStack maxW="55%" w="55%" gap="8">
          <HStack gap="8" alignItems="stretch" width="100%">
            <OrganizationTeamCard competitionInfo={competitionInfo} />
            <MarkdownFirstImage content={competitionInfo.information} />
          </HStack>
          <VenueDetailsCard competitionInfo={competitionInfo} />
          <RefundPolicyCard competitionInfo={competitionInfo} />
        </VStack>
      </HStack>
      <AdditionalInformationCard competitionInfo={competitionInfo} />
    </>
  );
}
