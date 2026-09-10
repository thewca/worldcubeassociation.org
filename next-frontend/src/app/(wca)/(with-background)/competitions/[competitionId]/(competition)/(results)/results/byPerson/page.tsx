import {
  Avatar,
  Card,
  Heading,
  HStack,
  Link as ChakraLink,
  Text,
  VStack,
} from "@chakra-ui/react";
import _ from "lodash";
import { getT } from "@/lib/i18n/get18n";
import { getCompetitionResults } from "@/lib/wca/competitions/getCompetitionResults";
import { Fragment } from "react";
import { ByPersonTable } from "@/components/results/ResultsTable";
import { route } from "nextjs-routes";
import WcaFlag from "@/components/WcaFlag";
import CountryMap from "@/components/CountryMap";
import Link from "next/link";

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
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">Results</Card.Title>
        {_.map(resultsByPerson, (results, wcaId) => (
          <Fragment key={wcaId}>
            <Heading size="2xl" asChild>
              <HStack gap="4">
                <Avatar.Root>
                  <Avatar.Fallback name={results[0].name} />
                  {/* Currently we don't have the actual image URL in the API output, this is pending a bigger refactor */}
                </Avatar.Root>
                <VStack width="fit-content" alignItems="start" gap="0.5">
                  <ChakraLink textStyle="headerLink" asChild>
                    <Link
                      href={route({
                        pathname: "/persons/[wcaId]",
                        query: { wcaId },
                      })}
                    >
                      {results[0].name}
                    </Link>
                  </ChakraLink>
                  <HStack>
                    <WcaFlag code={results[0].country_iso2} size="sm" />
                    <CountryMap
                      code={results[0].country_iso2}
                      t={t}
                      textStyle="bodyEmphasis"
                      color="fg.muted"
                    />
                  </HStack>
                </VStack>
              </HStack>
            </Heading>
            <ByPersonTable
              results={results}
              isAdmin={false}
              t={t}
              solveTextAlign="center"
            />
          </Fragment>
        ))}
      </Card.Body>
    </Card.Root>
  );
}
