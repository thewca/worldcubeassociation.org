import React from "react";
import { Card, Text } from "@chakra-ui/react";
import { getSchedule } from "@/lib/wca/competitions/getSchedule";
import Schedule from "@/components/competitions/Schedule";
import { getEvents } from "@/lib/wca/competitions/wcif/getEvents";
import { getT } from "@/lib/i18n/get18n";

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

  const hasActivities = wcifSchedule.venues
    .flatMap((venue) => venue.rooms)
    .some((room) => room.activities.length > 0);

  if (!hasActivities) {
    const { t } = await getT();

    return <Text>{t("competitions.schedule.no_schedule")}</Text>;
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
          competitionId={competitionId}
        />
      </Card.Body>
    </Card.Root>
  );
}
