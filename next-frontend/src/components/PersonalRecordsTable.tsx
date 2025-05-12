import React from 'react';
import {Card, Table, Flex, Icon, Text, Box} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import { LuBox } from "react-icons/lu";

import "@cubing/icons/css";

interface Record {
  event: string;
  snr: number;
  scr: number;
  swr: number;
  single: number;
  average: number;
  anr: number;
  acr: number;
  awr: number;
}



interface RecordsProps {
  records: Record[];
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
    "clock": "Clock",
    "minx": "Megaminx",
    "pyram": "Pyraminx",
    "skewb": "Skewb",
    "sq1": "Square-1"
  };

  return (
    <Card.Root bg="bg.inverted" color="fg.inverted" shadow="wca" overflow="hidden" width="full">
      <Card.Body p={0}>
        <Card.Title p={5} fontSize="md" textTransform="uppercase" fontWeight="medium" letterSpacing="wider">Current Personal Records</Card.Title>
        {/* Tables don't seem to inherit styles correctly, normally all the extra bg and fg shouldn't be necessary */}
        <Table.Root size="sm" striped rounded="md" variant="results">
          <Table.Header>
            <Table.Row bg="bg.inverted">
              <Table.ColumnHeader color="fg.inverted" pl="3"><Flex direction="row"><Box fontSize="18px"><LuBox/></Box><Text fontWeight="medium">Event</Text></Flex></Table.ColumnHeader>
              <Tooltip content="National Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader color="fg.inverted" textAlign="right">NR</Table.ColumnHeader>
              </Tooltip>
              <Tooltip content="Continental Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader color="fg.inverted" textAlign="right">CR</Table.ColumnHeader>
              </Tooltip>
              <Tooltip content="World Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader color="fg.inverted" textAlign="right">WR</Table.ColumnHeader>
              </Tooltip>
              <Table.ColumnHeader color="fg.inverted" textAlign="right">Single</Table.ColumnHeader>
              <Table.ColumnHeader color="fg.inverted">Average</Table.ColumnHeader>
              <Tooltip content="World Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader color="fg.inverted">WR</Table.ColumnHeader>
              </Tooltip>
              <Tooltip content="Continental Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader color="fg.inverted">CR</Table.ColumnHeader>
              </Tooltip>
              <Tooltip content="National Ranking" showArrow openDelay={100}>
                <Table.ColumnHeader color="fg.inverted">NR</Table.ColumnHeader>
              </Tooltip>
            </Table.Row>  
          </Table.Header>
          <Table.Body>
            {records.map((record, index) => (
                <Table.Row key={index} bg="bg.inverted">
                  <Table.Cell color="fg.inverted" pl="3">
                    <Flex direction="row">
                      <Icon width={18} height={18} fontSize="md">
                        <i className={`cubing-icon event-${record.event}`} />
                      </Icon>
                      <Text fontWeight="medium">{eventMap[record.event]}</Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell color={record.snr < 11 ? "recordColors.national" : "fg.inverted" } fontWeight={record.snr < 11 ? "bold" : "light"} textAlign="right">{record.snr}</Table.Cell>
                  <Table.Cell color={record.scr < 11 ? "recordColors.national" : "fg.inverted"} fontWeight={record.scr < 11 ? "bold" : "light"} textAlign="right">{record.scr}</Table.Cell>
                  <Table.Cell color={record.swr < 11 ? "recordColors.national" : "fg.inverted"} fontWeight={record.swr < 11 ? "bold" : "light"} textAlign="right">{record.swr}</Table.Cell>
                  <Table.Cell color="fg.inverted" fontWeight="medium" textAlign="right">{record.single}</Table.Cell>
                  <Table.Cell color="fg.inverted" fontWeight="medium">{record.average !== 0 ? record.average : ""}</Table.Cell>
                  <Table.Cell
                    color={record.awr !== 0 && record.awr < 11 ? "recordColors.national" : "fg.inverted"}
                    fontWeight={record.awr !== 0 && record.awr < 11 ? "bold" : "light"}
                  >
                    {record.awr !== 0 ? record.awr : ""}
                  </Table.Cell>                   
                  <Table.Cell
                    color={record.acr !== 0 && record.acr < 11 ? "recordColors.national" : "fg.inverted"}
                    fontWeight={record.acr !== 0 && record.acr < 11 ? "bold" : "light"}
                  >
                    {record.acr !== 0 ? record.acr : ""}
                  </Table.Cell> 
                  <Table.Cell
                    color={record.anr !== 0 && record.anr < 11 ? "recordColors.national" : "fg.inverted"}
                    fontWeight={record.anr !== 0 && record.anr < 11 ? "bold" : "light"}
                  >
                    {record.anr !== 0 ? record.anr : ""}
                  </Table.Cell>            
                </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Card.Body>
    </Card.Root>
  );
};

export default PersonalRecordsTable;
