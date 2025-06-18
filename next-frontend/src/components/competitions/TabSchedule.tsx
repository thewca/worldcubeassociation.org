import React from "react";
import { Card, Text } from "@chakra-ui/react";
import { getSchedule } from "@/lib/wca/competitions/getSchedule";

interface TabScheduleProps {
  competitionId: string;
}

export default async function TabSchedule({ competitionId }: TabScheduleProps) {
  const { data: schedule, error } = await getSchedule(competitionId);

  if (error) {
    return <Text>Error fetching competition schedule</Text>;
  }

  if (!schedule) {
    return <Text>Competition does not exist</Text>;
  }

  return (
    <Card.Root>
      <Card.Body>
        <Text>{JSON.stringify(schedule, null, 2)}</Text>
      </Card.Body>
    </Card.Root>
  );
}
