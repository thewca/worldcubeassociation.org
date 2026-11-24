import { getResultByPerson } from "@/lib/wca/live/getResultByPerson";
import ByPersonResults from "./ByPersonResults";
import { Heading, HStack, IconButton, Link } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import UserIcon from "@/components/icons/UserIcon";
import { Tooltip } from "@/components/ui/tooltip";
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
    return <p>{t("errors.next_frontend.load_error.results")}</p>;
  }

  const { results, name, wcaId } = personResultRequest.data;

  return (
    <>
      <HStack gap={{ base: "2", md: "3" }}>
        <Tooltip content={t("competitions.results_table.wca_profile")}>
          <IconButton
            asChild
            aria-label={t("competitions.results_table.wca_profile")}
            variant="outline"
            rounded="full"
            size="xs"
          >
            <Link href={`/persons/${wcaId}`} unstyled>
              <UserIcon />
            </Link>
          </IconButton>
        </Tooltip>
        <Heading textStyle={{ base: "h3", md: "h2" }}>{name}</Heading>
      </HStack>
      <ByPersonResults competitionId={competitionId} results={results} />
    </>
  );
}
