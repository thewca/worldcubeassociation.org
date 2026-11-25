import { Link as ChakraLink, Text, VStack } from "@chakra-ui/react";
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
    return <p>{t("competitions.registration_v2.errors.-1000")}</p>;
  }

  return (
    <VStack align="center">
      <PermissionCheck
        requiredPermission="canAdministerCompetition"
        item={competitionId}
      >
        <Text>{t("competitions.messages.administering")}</Text>
        <Text>
          <ChakraLink asChild variant="underline" colorPalette="teal">
            <Link
              href={route({
                pathname: "/competitions/[competitionId]",
                query: { competitionId: competitionId },
              })}
            >
              {t("competitions.messages.back_to_public_page")}
            </Link>
          </ChakraLink>
        </Text>
      </PermissionCheck>
    </VStack>
  );
}
