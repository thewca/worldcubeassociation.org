import React from "react";
import {
  Card,
  HStack,
  SimpleGrid,
  Link,
  Tabs,
  Button,
  Stack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import {
  activitiesOnDate,
  groupActivities,
  localizeActivityName,
} from "@/lib/wca/wcif/activities";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { components } from "@/types/openapi";
import {
  getDatesBetweenInclusive,
  getSimpleTimeString,
  hasPassed,
} from "@/lib/wca/dates";
import EventIcon from "@/components/EventIcon";
import { route } from "nextjs-routes";
import { TFunction } from "i18next";

interface LiveViewProps {
  timeZone: string;
  competitionId: string;
  activities: components["schemas"]["WcifActivity"][];
  wcifEvents: components["schemas"]["WcifEvent"][];
  t: TFunction;
}

export default function LiveView({
  timeZone,
  competitionId,
  activities,
  wcifEvents,
  t,
}: LiveViewProps) {
  const firstStartTime = activities[0].startTime;
  const lastStartTime = activities[activities.length - 1].startTime;

  const dates = getDatesBetweenInclusive(
    firstStartTime,
    lastStartTime,
    timeZone,
  );

  // Show the first date that has not passed, if all of them have, show the last date
  const lastDate = dates[dates.length - 1];
  const defaultDate =
    dates.filter((d) => !hasPassed(d.toISO()!))[0] ?? lastDate;

  return (
    <Tabs.Root defaultValue={defaultDate.day.toString()}>
      <Tabs.List height="fit-content" position="sticky" top="3">
        {dates.map((date) => (
          <Tabs.Trigger value={date.day.toString()} key={date.day}>
            {date.toLocaleString({ timeZone })}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {dates.map((date) => {
        const activitiesOnDay = activitiesOnDate(
          activities,
          date,
          timeZone,
        ).filter((a) => !a.activityCode.startsWith("other"));
        const groupedActivities = groupActivities(activitiesOnDay);

        return (
          <Tabs.Content value={date.day.toString()} key={date.day}>
            <SimpleGrid columns={3} gap={2}>
              {groupedActivities.map((activityGroup) => {
                const activity = activityGroup[0];
                const { eventId } = parseActivityCode(activity.activityCode);

                return (
                  <Card.Root key={activity.id} rounded="md">
                    <Card.Body asChild alignItems="baseline">
                      <Button asChild variant="subtle">
                        <Link asChild textStyle="headerLink">
                          <NextLink
                            href={route({
                              pathname:
                                "/competitions/[competitionId]/live/rounds/[roundId]",
                              query: {
                                competitionId,
                                roundId: activity.id.toString(),
                              },
                            })}
                          >
                            <HStack>
                              <EventIcon eventId={eventId} />
                              {localizeActivityName(t, activity, wcifEvents)}
                            </HStack>
                          </NextLink>
                        </Link>
                      </Button>
                    </Card.Body>
                    <Card.Footer>
                      {getSimpleTimeString(activity.startTime)} -{" "}
                      {getSimpleTimeString(activity.endTime)}
                    </Card.Footer>
                  </Card.Root>
                );
              })}
            </SimpleGrid>
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
}
