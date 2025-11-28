import React from "react";
import { Card, Table, Flex, Icon, Text, Box, Button } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import SpeedcubingHistoryIcon from "@/components/icons/SpeedcubingHistoryIcon";
import { eventIconMap } from "@/components/icons/EventIconMap";
import { LuShare2 } from "react-icons/lu";
import { components } from "@/types/openapi";
import events from "@/lib/wca/data/events";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import _ from "lodash";

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
    <Card.Root bg="bg" shadow="wca" overflow="hidden" width="full">
      <Card.Body p={0}>
        <Card.Header display="flex" flexDirection="row" alignItems="center">
          <Card.Title
            p={5}
            fontSize="md"
            textTransform="uppercase"
            fontWeight="medium"
            letterSpacing="wider"
          >
            Current Personal Records
          </Card.Title>
          <Button variant="ghost" ml="auto" p="0">
            <LuShare2 /> {/* TODO SLATE - implement share functionality */}
          </Button>
        </Card.Header>
        <Table.Root size="xs" striped rounded="md">
          <Table.Header>
            <Table.Row bg="bg">
              <Table.ColumnHeader pl="3">
                <Flex direction="row">
                  <Box fontSize="18px" pr="5px">
                    <SpeedcubingHistoryIcon />
                  </Box>
                  <Text fontWeight="medium">Event</Text>
                </Flex>
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
              const IconComponent = eventIconMap[event];
              return (
                <Table.Row key={event} bg="bg">
                  <Table.Cell pl="3">
                    <Flex direction="row" alignItems="center">
                      <Icon width="1.6em" height="1.6em" fontSize="md" pr="5px">
                        <IconComponent />
                      </Icon>
                      <Text fontWeight="medium">{eventObject.name}</Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.single.country_rank)}
                    fontWeight={
                      record.single.country_rank < 11 ? "bold" : "light"
                    }
                    textAlign="right"
                  >
                    {record.single.country_rank}
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.single.continent_rank)}
                    fontWeight={
                      record.single.continent_rank < 11 ? "bold" : "light"
                    }
                    textAlign="right"
                  >
                    {record.single.continent_rank}
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.single.world_rank)}
                    fontWeight={
                      record.single.world_rank < 11 ? "bold" : "light"
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
                      record.average?.world_rank < 11
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
                      record.average?.continent_rank < 11
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
                      record.average?.country_rank < 11
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
