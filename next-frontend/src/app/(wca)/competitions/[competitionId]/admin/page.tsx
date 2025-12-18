import { Heading, Text, Link as ChakraLink } from "@chakra-ui/react";
import { Container } from "@chakra-ui/react";
import Link from "next/link";
import { route } from "nextjs-routes";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import PermissionCheck from "@/components/PermissionCheck";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export default async function CompetitionOverview({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();
  const {
    data: competitionInfo,
    error,
    response,
  } = await getCompetitionInfo(competitionId);

  if (error) return <OpenapiError t={t} response={response} />;

  if (!competitionInfo) {
    return <p>Competition does not exist</p>;
  }

  return (
    <Container centerContent>
      <Heading>{competitionInfo.name}</Heading>
      <PermissionCheck
        requiredPermission="canAdministerCompetition"
        item={competitionId}
      >
        <Text>You are administering this competition</Text>
        <Text>
          Go back to the public page{" "}
          <ChakraLink asChild variant="underline" colorPalette="teal">
            <Link
              href={route({
                pathname: "/competitions/[competitionId]",
                query: { competitionId: competitionId },
              })}
            >
              here
            </Link>
          </ChakraLink>
        </Text>
      </PermissionCheck>
    </Container>
  );
}
