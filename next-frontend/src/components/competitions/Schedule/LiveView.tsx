"use client";

import { useState } from "react";
import {
  Card,
  HStack,
  SimpleGrid,
  Link,
  Tabs,
  Button,
  VStack,
  Select,
  createListCollection,
  Portal,
  IconButton,
} from "@chakra-ui/react";
import NextLink from "next/link";
import {
  activitiesOnDate,
  getActivityEventId,
  getActivityRoundId,
  groupActivities,
} from "@/lib/wca/wcif/activities";
import { components } from "@/types/openapi";
import {
  getDatesBetweenInclusive,
  getSimpleTimeString,
  hasPassed,
} from "@/lib/wca/dates";
import EventIcon from "@/components/EventIcon";
import { route } from "nextjs-routes";
import { useT } from "@/lib/i18n/useI18n";
import { LuLock } from "react-icons/lu";
import { LiveRoundAdmin } from "@/types/live";
import _ from "lodash";
import { getRoundName } from "@/lib/wca/live/getRoundName";

interface LiveViewProps {
  timeZones: string[];
  competitionId: string;
  activities: components["schemas"]["WcifActivity"][];
  canManage?: boolean;
  rounds: LiveRoundAdmin[];
}

export default function LiveView({
  timeZones,
  competitionId,
  activities,
  canManage = false,
  rounds,
}: LiveViewProps) {
  const { t } = useT();
  const firstStartTime = activities[0].startTime;
  const lastStartTime = activities[activities.length - 1].startTime;
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [timeZone, setTimeZone] = useState(browserTimezone);

  const collection = createListCollection({
    items: [...timeZones, browserTimezone].map((t) => ({
      value: t,
      label: t,
    })),
  });

  const dates = getDatesBetweenInclusive(
    firstStartTime,
    lastStartTime,
    timeZone,
  );

  // Show the first date that has not passed, if all of them have, show the last date
  const lastDate = dates[dates.length - 1];
  const defaultDate =
    dates.filter((d) => !hasPassed(d.toISO()!))[0] ?? lastDate;

  const roundsByWcifId = _.keyBy(rounds, "id");

  return (
    <VStack align="left">
      <HStack justifyContent="space-between">
        <Select.Root
          collection={collection}
          width={{ base: "full", md: "3/12" }}
          value={[timeZone]}
          onValueChange={(e) => setTimeZone(e.value[0])}
        >
          <Select.HiddenSelect />
          <Select.Label>{t("competitions.schedule.time_zone")}</Select.Label>
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText
                placeholder={t("competitions.schedule.time_zone")}
              />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {collection.items.map((timezone) => (
                  <Select.Item item={timezone} key={timezone.label}>
                    {timezone.value}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
        {canManage && (
          <IconButton variant="ghost">
            <Link asChild>
              <NextLink
                href={route({
                  pathname: "/competitions/[competitionId]/live/admin",
                  query: { competitionId },
                })}
              >
                <LuLock />
              </NextLink>
            </Link>
          </IconButton>
        )}
      </HStack>
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
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={2}>
                {groupedActivities.map((activityGroup) => {
                  const activity = activityGroup[0];

                  const eventId = getActivityEventId(activity);
                  const roundId = getActivityRoundId(activity);

                  const roundName = getRoundName(roundId, t, rounds, true);

                  const roundState = roundsByWcifId[roundId].state;
                  const isOpen = ["open", "locked"].includes(roundState);

                  return (
                    <Card.Root key={activity.id} rounded="md">
                      <Card.Body asChild alignItems="baseline">
                        <Button asChild variant="subtle" disabled={!isOpen}>
                          {isOpen ? (
                            <Link asChild textStyle="headerLink">
                              <NextLink
                                href={route({
                                  pathname:
                                    "/competitions/[competitionId]/live/rounds/[roundId]",
                                  query: {
                                    competitionId,
                                    roundId,
                                  },
                                })}
                              >
                                <HStack wrap="wrap">
                                  <EventIcon eventId={eventId} fontSize="2xl" />
                                  {roundName}
                                </HStack>
                              </NextLink>
                            </Link>
                          ) : (
                            <HStack>
                              <EventIcon eventId={eventId} fontSize="2xl" />
                              {roundName}
                            </HStack>
                          )}
                        </Button>
                      </Card.Body>
                      <Card.Footer>
                        {getSimpleTimeString(activity.startTime, timeZone)} -{" "}
                        {getSimpleTimeString(activity.endTime, timeZone)}
                      </Card.Footer>
                    </Card.Root>
                  );
                })}
              </SimpleGrid>
            </Tabs.Content>
          );
        })}
      </Tabs.Root>
    </VStack>
  );
}
