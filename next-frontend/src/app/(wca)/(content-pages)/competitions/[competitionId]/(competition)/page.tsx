import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import {
  AdditionalInformationCard,
  InfoCard,
  RegistrationCard,
} from "@/components/competitions/Cards";
import OrganizationTeamCard from "@/components/competitions/OrganizerCard";
import OpenapiError from "@/components/ui/openapiError";
import { getSession } from "@/auth";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";

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
  const { t } = await getT();
  const {
    data: competitionInfo,
    error,
    response,
  } = await getCompetitionInfo(competitionId);

  if (error) return <OpenapiError t={t} response={response} />;

  if (!competitionInfo) {
    return <Text>Competition does not exist</Text>;
  }

  const session = await getSession();
  const bookmarkRequest =
    session &&
    (await serverClientWithToken(session.accessToken).GET(
      "/v1/competitions/{competitionId}/bookmark",
      { params: { path: { competitionId } } },
    ));

  return (
    // Two columns only from `lg`: at `md` the tab sidebar appears and takes 3xs of the
    //   row, which leaves each of two columns narrower than the cards in them.
    <SimpleGrid gap="8" columns={{ base: 1, lg: 2 }}>
      <VStack gap="8" alignItems="stretch">
        <InfoCard
          competitionInfo={competitionInfo}
          bookmark={bookmarkRequest?.data}
          userId={session?.user.wcaUserId ?? undefined}
          t={t}
        />
        <RegistrationCard competitionInfo={competitionInfo} />
      </VStack>
      <VStack gap="8" alignItems="stretch">
        <AdditionalInformationCard competitionInfo={competitionInfo} />
        <OrganizationTeamCard competitionInfo={competitionInfo} />
      </VStack>
    </SimpleGrid>
  );
}
