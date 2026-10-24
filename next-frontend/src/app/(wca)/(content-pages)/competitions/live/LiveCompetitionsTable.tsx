import { HStack, Link as ChakraLink, Table } from "@chakra-ui/react";
import Link from "next/link";
import { route } from "nextjs-routes";
import { TFunction } from "i18next";
import WcaFlag from "@/components/WcaFlag";
import { countryName } from "@/components/CountryMap";
import { formatDateRange } from "@/lib/dates/format";
import { components } from "@/types/openapi";

type LiveCompetition = Pick<
  components["schemas"]["CompetitionIndex"],
  "id" | "name" | "start_date" | "end_date" | "city" | "country_iso2"
>;

const locationLabel = (competition: LiveCompetition, t: TFunction) =>
  `${competition.city}, ${countryName(competition.country_iso2, t)}`;

export default function LiveCompetitionsTable({
  competitions,
  t,
}: {
  competitions: LiveCompetition[];
  t: TFunction;
}) {
  return (
    <Table.ScrollArea>
      <Table.Root size="sm" variant="competitions">
        <Table.Body>
          {competitions.map((competition) => (
            <Table.Row key={competition.id}>
              <Table.Cell whiteSpace="normal" width="full">
                <HStack gap="2">
                  <WcaFlag
                    code={competition.country_iso2}
                    size="lg"
                    flexShrink="0"
                  />
                  <ChakraLink asChild>
                    <Link
                      href={route({
                        pathname: "/competitions/[competitionId]/live",
                        query: { competitionId: competition.id },
                      })}
                    >
                      {competition.name}
                    </Link>
                  </ChakraLink>
                </HStack>
              </Table.Cell>
              <Table.Cell>
                {formatDateRange(competition.start_date, competition.end_date)}
              </Table.Cell>
              <Table.Cell hideBelow="md">
                {locationLabel(competition, t)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
