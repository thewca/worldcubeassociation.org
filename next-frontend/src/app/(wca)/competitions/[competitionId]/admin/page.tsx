import { Heading } from "@chakra-ui/react";
import { Container } from "@chakra-ui/react";
import Link from "next/link";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import PermissionCheck from "@/components/PermissionCheck";

export default async function CompetitionOverview({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { data: competitionInfo, error } =
    await getCompetitionInfo(competitionId);

  if (error) {
    return <p>Error fetching competition</p>;
  }

  if (!competitionInfo) {
    return <p>Competition does not exist</p>;
  }

  return (
    <Container centerContent>
      <Heading>{competitionInfo.id}</Heading>
      <PermissionCheck
        requiredPermission={"canAdministerCompetition"}
        item={competitionId}
      >
        <p>You are administering this competition</p>
        <p>
          Go back to the public page{" "}
          <Link
            href={`/next-frontend/src/app/(wca)/competitions/${competitionInfo.id}`}
          >
            here
          </Link>
        </p>
      </PermissionCheck>
    </Container>
  );
}
