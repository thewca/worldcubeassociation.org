import { getResultByPerson } from "@/lib/wca/live/getResultByPerson";
import ByPersonResults from "./ByPersonResults";
import { Button, Heading, Link, Stack } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import UserIcon from "@/components/icons/UserIcon";
export default async function PersonResults({
  params,
}: {
  params: Promise<{ registrationId: string; competitionId: string }>;
}) {
  const { t } = await getT();
  const { competitionId, registrationId } = await params;

  const personResultRequest = await getResultByPerson(
    competitionId,
    registrationId,
  );

  if (!personResultRequest.data) {
    return <p>Something went wrong while trying to fetch results</p>;
  }

  const { results, name, wcaId } = personResultRequest.data;

  return (
    <>
      <Stack
        direction={{ base: "column", md: "row" }}
        alignItems={{ base: undefined, md: "center" }}
        gap={{ base: "0", md: "5" }}
      >
        <Heading textStyle={{ base: "h3", md: "h2" }}>{name}</Heading>
        <Button size="xs" asChild variant="outline">
          <Link href={`/persons/${wcaId}`} unstyled>
            <UserIcon me="0.5" aria-hidden />
            {t("competitions.results_table.wca_profile")}
          </Link>
        </Button>
      </Stack>
      <ByPersonResults competitionId={competitionId} results={results} />
    </>
  );
}
