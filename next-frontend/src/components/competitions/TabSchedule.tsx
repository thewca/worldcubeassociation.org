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
  const { t } = await getT();

  const { data: wcifSchedule, error: scheduleError } =
    await getSchedule(competitionId);

  if (scheduleError) {
    return <Text>{t("errors.next_frontend.load_error.schedule")}</Text>;
  }

  if (!wcifSchedule) {
    return <Text>{t("competitions.registration_v2.errors.-1000")}</Text>;
  }

  const { data: wcifEvents, error: eventsError } =
    await getEvents(competitionId);

  if (eventsError) {
    return <Text>{t("errors.next_frontend.load_error.schedule")}</Text>;
  }

  if (!wcifEvents) {
    return <Text>{t("competitions.registration_v2.errors.-1000")}</Text>;
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
