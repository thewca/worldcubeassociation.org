import React from "react";
import { Card, Table, Flex, Icon, Text, Box, Button } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import SpeedcubingHistoryIcon from "@/components/icons/SpeedcubingHistoryIcon";
import { eventIconMap } from "@/components/icons/EventIconMap";
import { LuShare2 } from "react-icons/lu";

interface RecordItem {
  event: string;
  snr: number;
  scr: number;
  swr: number;
  single: string;
  average: string;
  anr: number;
  acr: number;
  awr: number;
}

interface RecordsProps {
  records: RecordItem[];
}

const PersonalRecordsTable: React.FC<RecordsProps> = ({ records }) => {
  const eventMap = {
    "222": "2x2x2 Cube",
    "333": "3x3x3 Cube",
    "333bf": "3x3x3 Blindfolded",
    "333mbf": "3x3x3 Multi-Blind",
    "333fm": "3x3x3 Fewest Moves",
    "333oh": "3x3x3 One-Handed",
    "444": "4x4x4 Cube",
    "444bf": "4x4x4 Blindfolded",
    "555": "5x5x5 Cube",
    "555bf": "5x5x5 Blindfolded",
    "666": "6x6x6 Cube",
    "777": "7x7x7 Cube",
    clock: "Clock",
    minx: "Megaminx",
    pyram: "Pyraminx",
    skewb: "Skewb",
    sq1: "Square-1",
  } as Record<string, string>;

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
            {records.map((record, index) => {
              const IconComponent = eventIconMap[record.event];
              if (
                record.event == "magic" ||
                record.event == "mmagic" ||
                record.event == "mbo"
              ) {
                return null;
              }
              return (
                <Table.Row key={index} bg="bg">
                  <Table.Cell pl="3">
                    <Flex direction="row" alignItems="center">
                      <Icon width="1.6em" height="1.6em" fontSize="md" pr="5px">
                        <IconComponent />
                      </Icon>
                      <Text fontWeight="medium">{eventMap[record.event]}</Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.snr)}
                    fontWeight={record.snr < 11 ? "bold" : "light"}
                    textAlign="right"
                  >
                    {record.snr}
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.scr)}
                    fontWeight={record.scr < 11 ? "bold" : "light"}
                    textAlign="right"
                  >
                    {record.scr}
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.swr)}
                    fontWeight={record.swr < 11 ? "bold" : "light"}
                    textAlign="right"
                  >
                    {record.swr}
                  </Table.Cell>
                  <Table.Cell fontWeight="medium" textAlign="right">
                    {record.single}
                  </Table.Cell>
                  <Table.Cell fontWeight="medium">{record.average}</Table.Cell>
                  <Table.Cell
                    color={getColor(record.awr)}
                    fontWeight={
                      record.awr !== 0 && record.awr < 11 ? "bold" : "light"
                    }
                  >
                    {record.awr !== 0 ? record.awr : ""}
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.acr)}
                    fontWeight={
                      record.acr !== 0 && record.acr < 11 ? "bold" : "light"
                    }
                  >
                    {record.acr !== 0 ? record.acr : ""}
                  </Table.Cell>
                  <Table.Cell
                    color={getColor(record.anr)}
                    fontWeight={
                      record.anr !== 0 && record.anr < 11 ? "bold" : "light"
                    }
                  >
                    {record.anr !== 0 ? record.anr : ""}
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
