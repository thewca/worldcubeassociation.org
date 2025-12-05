import React from "react";
import {Card, Table, Text, IconButton, HStack} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import SpeedcubingHistoryIcon from "@/components/icons/SpeedcubingHistoryIcon";
import { LuShare2 } from "react-icons/lu";
import { components } from "@/types/openapi";
import events from "@/lib/wca/data/events";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import EventIcon from "@/components/EventIcon";

interface RecordsProps {
  records: components["schemas"]["PersonInfo"]["personal_records"];
}

const PersonalRecordsTable: React.FC<RecordsProps> = ({ records }) => {
  const getColor = (pr: number) => {
    if (pr === 0) return undefined;
    if (pr === 1) return "recordMarkers.personal";
    if (pr < 11) return "recordMarkers.national";
    return undefined;
  };

  return (
    <Card.Root overflow="hidden" width="full">
      <Card.Header>
        <HStack justify="space-between">
          <Card.Title textStyle="s4">
            Current Personal Records
          </Card.Title>
          <IconButton variant="ghost">
            <LuShare2 /> {/* TODO SLATE - implement share functionality */}
          </IconButton>
        </HStack>
      </Card.Header>
      <Card.Body paddingX={0} paddingBottom={0}>
        <Table.Root size="xs" striped>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader paddingStart={4}>
                <HStack>
                  <SpeedcubingHistoryIcon fontSize="md" />
                  <Text fontWeight="medium">Event</Text>
                </HStack>
              </Table.ColumnHeader>
              <Tooltip content="National Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader textAlign="right">NR</Table.ColumnHeader>
              </Tooltip>
              <Tooltip content="Continental Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader textAlign="right">CR</Table.ColumnHeader>
              </Tooltip>
              <Tooltip content="World Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader textAlign="right">WR</Table.ColumnHeader>
              </Tooltip>
              <Table.ColumnHeader textAlign="right">Single</Table.ColumnHeader>
              <Table.ColumnHeader>Average</Table.ColumnHeader>
              <Tooltip content="World Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader>WR</Table.ColumnHeader>
              </Tooltip>
              <Tooltip content="Continental Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader>CR</Table.ColumnHeader>
              </Tooltip>
              <Tooltip content="National Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader>NR</Table.ColumnHeader>
              </Tooltip>
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
                  <Table.Cell
                    color={getColor(record.single.country_rank)}
                    fontWeight={
                      record.single.country_rank <= 10 ? "bold" : "light"
                    }
                    textAlign="right"
                  >
                    {record.single.country_rank}
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.single.continent_rank)}
                    fontWeight={
                      record.single.continent_rank <= 10 ? "bold" : "light"
                    }
                    textAlign="right"
                  >
                    {record.single.continent_rank}
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.single.world_rank)}
                    fontWeight={
                      record.single.world_rank <= 10 ? "bold" : "light"
                    }
                    textAlign="right"
                  >
                    {record.single.world_rank}
                  </Table.Cell>
                  <Table.Cell fontWeight="medium" textAlign="right">
                    {formatAttemptResult(record.single.best, event)}
                  </Table.Cell>
                  <Table.Cell fontWeight="medium">
                    {record.average &&
                      formatAttemptResult(record.average.best, event)}
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.average?.world_rank)}
                    fontWeight={
                      record.average?.world_rank &&
                      record.average?.world_rank <= 10
                        ? "bold"
                        : "light"
                    }
                  >
                    {record.average?.world_rank !== 0 &&
                      record.average?.world_rank}
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.average?.continent_rank)}
                    fontWeight={
                      record.average?.continent_rank &&
                      record.average?.continent_rank <= 10
                        ? "bold"
                        : "light"
                    }
                  >
                    {record.average?.continent_rank !== 0 &&
                      record.average?.continent_rank}
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.average?.country_rank)}
                    fontWeight={
                      record.average?.country_rank &&
                      record.average?.country_rank <= 10
                        ? "bold"
                        : "light"
                    }
                  >
                    {record.average?.country_rank !== 0 &&
                      record.average?.country_rank}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Card.Body>
    </Card.Root>
  );
};

export default PersonalRecordsTable;
