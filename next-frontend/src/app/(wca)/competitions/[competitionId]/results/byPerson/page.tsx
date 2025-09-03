import { Card, Container, Heading, HStack, Link, Text } from "@chakra-ui/react";
import _ from "lodash";
import { getT } from "@/lib/i18n/get18n";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { InfoCard } from "@/components/competitions/Cards";
import { MarkdownFirstImage } from "@/components/MarkdownFirstImage";
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

  const { data: competitionInfo, error } =
    await getCompetitionInfo(competitionId);

  if (error) {
    return <Text>Error fetching competition</Text>;
  }

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
    <Container bg="bg">
      <HStack gap="8" alignItems="stretch">
        <InfoCard competitionInfo={competitionInfo} t={t} />
        <MarkdownFirstImage content={competitionInfo.information} />
      </HStack>
      <Card.Root variant="plain" mt="8">
        <Card.Body>
          <Card.Title>
            <Text
              fontSize="md"
              textTransform="uppercase"
              fontWeight="medium"
              letterSpacing="wider"
            >
              Results
            </Text>
          </Card.Title>
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
    </Container>
  );
}
