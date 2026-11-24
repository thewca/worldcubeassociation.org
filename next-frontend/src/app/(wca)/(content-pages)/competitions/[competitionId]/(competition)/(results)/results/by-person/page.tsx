import _ from "lodash";
import { getCompetitionResults } from "@/lib/wca/competitions/getCompetitionResults";
import { roundResultRows } from "@/lib/wca/results/competitionResults";
import ByPersonResults from "./ByPersonResults";
import { Text } from "@chakra-ui/react";
import { getSession } from "@/auth";
import { getT } from "@/lib/i18n/get18n";

export default async function PodiumsPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const session = await getSession();

  const { error: resultsError, data: competitionResults } =
    await getCompetitionResults(competitionId);

  if (resultsError) {
    const { t } = await getT();
    return <Text>{t("errors.next_frontend.load_error.results")}</Text>;
  }

  const resultsByPerson = _.groupBy(
    roundResultRows(competitionResults).toSorted((a, b) =>
      a.name.localeCompare(b.name),
    ),
    "wca_id",
  );

  const countries = _.sortBy(
    _.uniq(
      _.flatMap(resultsByPerson, (results) =>
        results.map((r) => r.country_iso2),
      ),
    ),
  );

  return (
    <ByPersonResults
      resultsByPerson={resultsByPerson}
      sessionWcaId={session?.user.wcaId}
      countries={countries}
    />
  );
}
