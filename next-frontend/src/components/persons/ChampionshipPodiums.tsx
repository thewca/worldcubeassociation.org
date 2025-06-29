import React from "react";
import { Table, Heading } from "@chakra-ui/react";

const ChampionshipPodiumsTab: React.FC = () => {
  const podiums = [
    { event: "3x3x3 Cube", place: "1st", competition: "Nationals 2022" },
    { event: "2x2x2 Cube", place: "2nd", competition: "Regionals 2023" },
    // Add more podiums here
  ];

  return (
    <>
      <Heading>Championship Podiums</Heading>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Event</Table.ColumnHeader>
            <Table.ColumnHeader>Place</Table.ColumnHeader>
            <Table.ColumnHeader>Competition</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {podiums.map((podium, index) => (
            <Table.Row key={index}>
              <Table.Cell>{podium.event}</Table.Cell>
              <Table.Cell>{podium.place}</Table.Cell>
              <Table.Cell>{podium.competition}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </>
  );
};

export default ChampionshipPodiumsTab;
