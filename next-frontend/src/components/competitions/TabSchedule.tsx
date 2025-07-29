import React from "react";
import { Card, Text } from "@chakra-ui/react";
import { getSchedule } from "@/lib/wca/competitions/getSchedule";
import Schedule from "@/components/competitions/Schedule";
import { getEvents } from "@/lib/wca/competitions/wcif/getEvents";

interface TabScheduleProps {
  competitionId: string;
  competitionName: string;
}

export default async function TabSchedule({
  competitionId,
  competitionName,
}: TabScheduleProps) {
  const { data: wcifSchedule, error: scheduleError } =
    await getSchedule(competitionId);

  if (scheduleError) {
    return <Text>Error fetching competition schedule</Text>;
  }

  if (!wcifSchedule) {
    return <Text>Competition does not exist</Text>;
  }

  const { data: wcifEvents, error: eventsError } =
    await getEvents(competitionId);

  if (eventsError) {
    return <Text>Error fetching competition schedule</Text>;
  }

  if (!wcifEvents) {
    return <Text>Competition does not exist</Text>;
  }

  return (
    <Card.Root>
      <Card.Body>
        <Schedule
          wcifSchedule={wcifSchedule}
          wcifEvents={wcifEvents}
          competitionName={competitionName}
        />
      </Card.Body>
    </Card.Root>
  );
}
