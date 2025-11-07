import { Card, Heading, Link, Text } from "@chakra-ui/react";
import _ from "lodash";
import { getT } from "@/lib/i18n/get18n";
import { getCompetitionResults } from "@/lib/wca/competitions/getCompetitionResults";
import { Fragment } from "react";
import { ByPersonTable } from "@/components/results/ResultsTable";
import { route } from "nextjs-routes";

export default async function PodiumsPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  const { t } = await getT();

  const { error: resultsError, data: competitionResults } =
    await getCompetitionResults(competitionId);

  if (resultsError) {
    return <Text>Error fetching Results</Text>;
  }

  const resultsByPerson = _.groupBy(
    competitionResults.toSorted((a, b) => a.name.localeCompare(b.name)),
    "wca_id",
  );

  return (
    <Card.Root coloredBg>
      <Card.Body>
        <Card.Title textStyle="s4">Results</Card.Title>
        {_.map(resultsByPerson, (results, wcaId) => (
          <Fragment key={wcaId}>
            <Heading size="2xl">
              <Link
                href={route({
                  pathname: "/persons/[wcaId]",
                  query: { wcaId },
                })}
              >
                {results[0].name}
              </Link>
            </Heading>
            <ByPersonTable results={results} isAdmin={false} t={t} />
          </Fragment>
        ))}
      </Card.Body>
    </Card.Root>
  );
}
