import { Card, Text } from "@chakra-ui/react";
import { getHeadToHead } from "@/lib/wca/competitions/getHeadToHead";
import HeadToHeadBrackets from "@/app/(wca)/(with-background)/widgets/headToHead/HeadToHeadBrackets";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export default async function HeadToHeadPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const { t } = await getT();

  const {
    data: h2hRounds,
    error,
    response,
  } = await getHeadToHead(competitionId);

  if (error) return <OpenapiError t={t} response={response} />;

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">
          {t("competitions.nav.menu.head_to_head")}
        </Card.Title>
        {h2hRounds.length > 0 ? (
          <HeadToHeadBrackets h2hRounds={h2hRounds} />
        ) : (
          <Text>{t("competitions.messages.no_results")}</Text>
        )}
      </Card.Body>
    </Card.Root>
  );
}
