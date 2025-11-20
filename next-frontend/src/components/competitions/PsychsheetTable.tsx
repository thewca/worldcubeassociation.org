import { HStack, Icon, Link, Table, Text } from "@chakra-ui/react";
import { route } from "nextjs-routes";
import WcaFlag from "@/components/WcaFlag";
import CountryMap from "@/components/CountryMap";
import { components } from "@/types/openapi";
import { TFunction } from "i18next";

export default function PsychsheetTable({
  pychsheet,
  t,
  setSortBy,
}: {
  pychsheet: components["schemas"]["PsychSheet"];
  t: TFunction;
  setSortBy: (sortBy: string) => void;
}) {
  return (
    <Table.Root width="100%">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Pos</Table.ColumnHeader>
          <Table.ColumnHeader>Name</Table.ColumnHeader>
          <Table.ColumnHeader>Representing</Table.ColumnHeader>
          <Table.ColumnHeader>WR</Table.ColumnHeader>
          <Table.ColumnHeader onClick={() => setSortBy("single")}>
            Single
          </Table.ColumnHeader>
          <Table.ColumnHeader onClick={() => setSortBy("average")}>
            Average
          </Table.ColumnHeader>
          <Table.ColumnHeader>WR</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {pychsheet.sorted_rankings
          .toSorted((a, b) => a.pos - b.pos)
          .map(
            (registration) =>
              registration.wca_id && (
                <Table.Row key={registration.user_id}>
                  <Table.Cell>{registration.pos}</Table.Cell>
                  <Table.Cell>
                    <Link
                      href={route({
                        pathname: "/persons/[wcaId]",
                        query: { wcaId: registration.wca_id },
                      })}
                    >
                      <Text fontWeight="medium">{registration.name}</Text>
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack>
                      <Icon asChild size="sm">
                        <WcaFlag code={registration.country_iso2} />
                      </Icon>
                      <CountryMap
                        code={registration.country_iso2}
                        t={t}
                        fontWeight="bold"
                      />
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>{registration.single_rank}</Table.Cell>
                  <Table.Cell>{registration.single_best}</Table.Cell>
                  <Table.Cell>{registration.average_best}</Table.Cell>
                  <Table.Cell>{registration.average_rank}</Table.Cell>
                </Table.Row>
              ),
          )}
      </Table.Body>
    </Table.Root>
  );
}
