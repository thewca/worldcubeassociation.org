import React from "react";
import { Card, Table, Text, HStack, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import { Tooltip } from "@/components/ui/tooltip";
import SpeedcubingHistoryIcon from "@/components/icons/SpeedcubingHistoryIcon";
import { components } from "@/types/openapi";
import events from "@/lib/wca/data/events";
import countries from "@/lib/wca/data/countries";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import EventIcon from "@/components/EventIcon";
import { getT } from "@/lib/i18n/get18n";
import ShareProfileButton from "@/components/persons/ShareProfileButton";

const REGION_WORLD = "world";

interface RecordsProps {
  records: components["schemas"]["V1PersonInfo"]["ranks_by_event"];
  countryIso2: string;
  wcaId: string;
}

type RankingType = "single" | "average";

const getColor = (rank: number) => {
  if (rank === 1) return "recordMarkers.personal";
  if (rank < 11) return "recordMarkers.national";
  return "fg";
};

function RankHeader({
  label,
  description,
  textAlign,
}: {
  label: string;
  description: string;
  textAlign?: Table.ColumnHeaderProps["textAlign"];
}) {
  return (
    <Table.ColumnHeader textAlign={textAlign}>
      <Tooltip content={description} showArrow openDelay={100}>
        <Text as="span">{label}</Text>
      </Tooltip>
    </Table.ColumnHeader>
  );
}

function RankCell({
  rank,
  eventId,
  rankingType,
  region,
  textAlign,
}: {
  rank?: number;
  eventId: string;
  rankingType: RankingType;
  region: string;
  textAlign?: Table.CellProps["textAlign"];
}) {
  return (
    <Table.Cell textAlign={textAlign}>
      {!!rank && (
        <Link
          asChild
          color={getColor(rank)}
          fontWeight={rank <= 10 ? "bold" : "light"}
        >
          <NextLink
            href={route({
              pathname: "/results/rankings",
              query: { event_id: eventId, region, type: rankingType },
            })}
          >
            {rank}
          </NextLink>
        </Link>
      )}
    </Table.Cell>
  );
}

const PersonalRecordsTable: React.FC<RecordsProps> = async ({
  records,
  countryIso2,
  wcaId,
}) => {
  const { t } = await getT();

  const continentId = countries.byIso2[countryIso2].continent_id;

  return (
    <Card.Root overflow="hidden" width="full">
      <Card.Header>
        <HStack justify="space-between">
          <Card.Title textStyle="s4">
            {t("persons.show.personal_records")}
          </Card.Title>
          <ShareProfileButton wcaId={wcaId} />
        </HStack>
      </Card.Header>
      <Card.Body paddingX={0} paddingBottom={0}>
        <Table.ScrollArea maxW="full">
          <Table.Root size="xs" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader paddingStart={4}>
                  <HStack>
                    <SpeedcubingHistoryIcon fontSize="md" />
                    <Text fontWeight="medium">
                      {t("results.table_elements.event")}
                    </Text>
                  </HStack>
                </Table.ColumnHeader>
                <RankHeader
                  label={t("common.ranking_abbreviations.national")}
                  description={t("competitions.results_table.rank.national")}
                  textAlign="end"
                />
                <RankHeader
                  label={t("common.ranking_abbreviations.continental")}
                  description={t("competitions.results_table.rank.continent")}
                  textAlign="end"
                />
                <RankHeader
                  label={t("common.ranking_abbreviations.world")}
                  description={t("competitions.results_table.rank.world")}
                  textAlign="end"
                />
                <Table.ColumnHeader textAlign="end">
                  {t("common.single")}
                </Table.ColumnHeader>
                <Table.ColumnHeader paddingStart={3}>
                  {t("common.average")}
                </Table.ColumnHeader>
                <RankHeader
                  label={t("common.ranking_abbreviations.world")}
                  description={t("competitions.results_table.rank.world")}
                />
                <RankHeader
                  label={t("common.ranking_abbreviations.continental")}
                  description={t("competitions.results_table.rank.continent")}
                />
                <RankHeader
                  label={t("common.ranking_abbreviations.national")}
                  description={t("competitions.results_table.rank.national")}
                />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {events.official.map((eventObject) => {
                const event = eventObject.id;
                const record = records[event];
                if (!record) return null;
                return (
                  <Table.Row key={event}>
                    <Table.Cell paddingStart={4}>
                      <HStack>
                        <EventIcon eventId={event} fontSize="2xl" />
                        <Text fontWeight="medium">{eventObject.name}</Text>
                      </HStack>
                    </Table.Cell>
                    <RankCell
                      rank={record.single.country_rank}
                      eventId={event}
                      rankingType="single"
                      region={countryIso2}
                      textAlign="end"
                    />
                    <RankCell
                      rank={record.single.continent_rank}
                      eventId={event}
                      rankingType="single"
                      region={continentId}
                      textAlign="end"
                    />
                    <RankCell
                      rank={record.single.world_rank}
                      eventId={event}
                      rankingType="single"
                      region={REGION_WORLD}
                      textAlign="end"
                    />
                    <Table.Cell fontWeight="bold" textAlign="end">
                      {formatAttemptResult(record.single.best, event)}
                    </Table.Cell>
                    <Table.Cell fontWeight="bold" paddingStart={3}>
                      {record.average &&
                        formatAttemptResult(record.average.best, event)}
                    </Table.Cell>
                    <RankCell
                      rank={record.average?.world_rank}
                      eventId={event}
                      rankingType="average"
                      region={REGION_WORLD}
                    />
                    <RankCell
                      rank={record.average?.continent_rank}
                      eventId={event}
                      rankingType="average"
                      region={continentId}
                    />
                    <RankCell
                      rank={record.average?.country_rank}
                      eventId={event}
                      rankingType="average"
                      region={countryIso2}
                    />
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </Card.Body>
    </Card.Root>
  );
};

export default PersonalRecordsTable;
