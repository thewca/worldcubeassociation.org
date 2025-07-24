"use client";

import { DateTime } from "luxon";
import React from "react";
import {
  Center,
  Checkbox,
  Em,
  GridItem,
  Heading,
  SimpleGrid,
  Stack,
  StackSeparator,
} from "@chakra-ui/react";
import {
  activitiesOnDate,
  earliestWithLongestTieBreaker,
  getActivityEventId,
  getActivityRoundId,
  groupActivities,
  localizeActivityName,
  toDegrees,
  type WcifActivity,
  type WcifRoom,
  type WcifVenue,
} from "@/lib/wca/wcif/activities";
import { getSimpleTimeString } from "@/lib/wca/dates";
import AddToCalendar from "./AddToCalendar";
import useStoredState from "@/lib/hooks/useStoredState";
import formats from "@/lib/wca/data/formats";
import {
  parseActivityCode,
  timeLimitToString,
  advancementConditionToString,
  cutoffToString,
  type WcifEvent,
  type WcifRound,
} from "@/lib/wca/wcif/rounds";
import { useT } from "@/lib/i18n/useI18n";
import EventIcon from "@/components/EventIcon";

interface TableViewProps {
  dates: DateTime[];
  timeZone: string;
  activeVenue?: WcifVenue;
  activeRooms: WcifRoom[];
  activeEventIds: string[];
  wcifEvents: WcifEvent[];
  competitionName: string;
}

export default function TableView({
  dates,
  timeZone,
  activeVenue,
  activeRooms,
  activeEventIds,
  wcifEvents,
  competitionName,
}: TableViewProps) {
  const activeEvents = wcifEvents.filter((event) =>
    activeEventIds.includes(event.id),
  );

  const activeRounds = activeEvents.flatMap((event) => event.rounds);

  const [isExpanded, setIsExpanded] = useStoredState(
    true,
    "scheduleTableExpanded",
  );

  const sortedActivities = activeRooms
    .flatMap((room) => room.activities)
    .toSorted(earliestWithLongestTieBreaker);

  const visibleActivities = sortedActivities.filter((activity) =>
    ["other", ...activeEventIds].includes(getActivityEventId(activity)),
  );

  const { t } = useT();

  return (
    <>
      <Checkbox.Root
        checked={isExpanded}
        onCheckedChange={(e) => setIsExpanded(!!e.checked)}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>
          {t("competitions.schedule.more_details")}
        </Checkbox.Label>
      </Checkbox.Root>

      {dates.map((date) => {
        const activitiesForDay = activitiesOnDate(
          visibleActivities,
          date,
          timeZone,
        );
        const groupedActivitiesForDay = groupActivities(activitiesForDay);

        return (
          <SingleDayTable
            key={date.toMillis()}
            date={date}
            timeZone={timeZone}
            groupedActivities={groupedActivitiesForDay}
            rounds={activeRounds}
            rooms={activeRooms}
            isExpanded={isExpanded}
            activeVenue={activeVenue}
            competitionName={competitionName}
            wcifEvents={wcifEvents}
          />
        );
      })}
    </>
  );
}

interface SingleDayTableProps {
  date: DateTime;
  timeZone: string;
  groupedActivities: WcifActivity[][];
  rounds: WcifRound[];
  rooms: WcifRoom[];
  isExpanded: boolean;
  activeVenue?: WcifVenue;
  competitionName: string;
  wcifEvents: WcifEvent[];
}

function SingleDayTable({
  date,
  timeZone,
  groupedActivities,
  rounds,
  rooms,
  isExpanded,
  activeVenue,
  competitionName,
  wcifEvents,
}: SingleDayTableProps) {
  const { t } = useT();

  const title = t("competitions.schedule.schedule_for_full_date", {
    date: date.toLocaleString(DateTime.DATE_HUGE),
  });

  const hasActivities = groupedActivities.length > 0;
  const startTime = hasActivities
    ? groupedActivities[0][0].startTime
    : date.toISO()!;
  const endTime = hasActivities
    ? groupedActivities[groupedActivities.length - 1][0].endTime
    : date.toISO()!;
  const activeVenueAddress =
    activeVenue &&
    `${toDegrees(activeVenue.latitudeMicrodegrees)},${toDegrees(
      activeVenue.longitudeMicrodegrees,
    )}`;

  return (
    <>
      <Heading size="2xl" paddingTop={4}>
        {hasActivities && (
          <>
            <AddToCalendar
              startDate={startTime}
              endDate={endTime}
              timeZone={timeZone}
              name={competitionName}
              address={activeVenueAddress}
            />{" "}
          </>
        )}
        {title}
      </Heading>

      <Stack separator={<StackSeparator />} gap={6}>
        <HeaderRow isExpanded={isExpanded} />

        {hasActivities ? (
          groupedActivities.map((activityGroup) => {
            const representativeActivity = activityGroup[0];

            const activityRound = rounds.find(
              (round) =>
                round.id === getActivityRoundId(representativeActivity),
            )!;

            return (
              <ActivityRow
                key={representativeActivity.id}
                isExpanded={isExpanded}
                activityGroup={activityGroup}
                round={activityRound}
                rooms={rooms}
                timeZone={timeZone}
                wcifEvents={wcifEvents}
              />
            );
          })
        ) : (
          <Center>
            <Em>{t("competitions.schedule.no_activities")}</Em>
          </Center>
        )}
      </Stack>
    </>
  );
}

interface HeaderRowProps {
  isExpanded: boolean;
}

function HeaderRow({ isExpanded }: HeaderRowProps) {
  const { t } = useT();

  return (
    <SimpleGrid columns={16} hideBelow="lg" columnGap={3}>
      <GridItem colSpan={isExpanded ? 1 : 2}>
        {t("competitions.schedule.start")}
      </GridItem>
      <GridItem colSpan={isExpanded ? 1 : 2}>
        {t("competitions.schedule.end")}
      </GridItem>
      <GridItem colSpan={isExpanded ? 4 : 7}>
        {t("competitions.schedule.activity")}
      </GridItem>
      <GridItem colSpan={isExpanded ? 3 : 5}>
        {t("competitions.schedule.room_or_stage")}
      </GridItem>
      {isExpanded && (
        <>
          <GridItem>{t("competitions.events.format")}</GridItem>
          <GridItem colSpan={2}>
            <a href="#time-limit">{t("competitions.events.time_limit")}</a>
          </GridItem>
          <GridItem colSpan={2}>
            <a href="#cutoff">{t("competitions.events.cutoff")}</a>
          </GridItem>
          <GridItem colSpan={2}>{t("competitions.events.proceed")}</GridItem>
        </>
      )}
    </SimpleGrid>
  );
}

interface ActivityRowProps {
  isExpanded: boolean;
  activityGroup: WcifActivity[];
  round: WcifRound;
  rooms: WcifRoom[];
  timeZone: string;
  wcifEvents: WcifEvent[];
}

function ActivityRow({
  isExpanded,
  activityGroup,
  round,
  rooms,
  timeZone,
  wcifEvents,
}: ActivityRowProps) {
  const { t } = useT();

  const representativeActivity = activityGroup[0];
  const { startTime, endTime } = representativeActivity;

  const name = representativeActivity.activityCode.startsWith("other")
    ? representativeActivity.name
    : localizeActivityName(t, representativeActivity, wcifEvents);
  const eventId = representativeActivity.activityCode.startsWith("other")
    ? "other"
    : parseActivityCode(representativeActivity.activityCode).eventId;

  const activityIds = activityGroup.map((activity) => activity.id);

  // note: round may be undefined for custom activities like lunch
  const { format, timeLimit, cutoff, advancementCondition } = round || {};

  const roomsUsed = rooms.filter((room) =>
    room.activities.some((activity) => activityIds.includes(activity.id)),
  );

  return (
    <>
      <SimpleGrid columns={16} hideBelow="lg" columnGap={3}>
        <GridItem colSpan={isExpanded ? 1 : 2}>
          {getSimpleTimeString(startTime, timeZone)}
        </GridItem>
        <GridItem colSpan={isExpanded ? 1 : 2}>
          {getSimpleTimeString(endTime, timeZone)}
        </GridItem>
        <GridItem colSpan={isExpanded ? 4 : 7}>{name}</GridItem>
        <GridItem colSpan={isExpanded ? 3 : 5}>
          {roomsUsed.map((room) => room.name).join(", ")}
        </GridItem>
        {isExpanded && (
          <>
            <GridItem>
              {format && (
                <>
                  {cutoff &&
                    `${formats.byId[cutoff.numberOfAttempts].short_name} / `}
                  {formats.byId[format].short_name}
                </>
              )}
            </GridItem>
            <GridItem colSpan={2}>
              {round && timeLimitToString(t, timeLimit, eventId, wcifEvents)}
              {timeLimit && (
                <>
                  {timeLimit.cumulativeRoundIds.length === 1 && (
                    <a href="#cumulative-time-limit">*</a>
                  )}
                  {timeLimit.cumulativeRoundIds.length > 1 && (
                    <a href="#cumulative-across-rounds-time-limit">**</a>
                  )}
                </>
              )}
            </GridItem>
            <GridItem colSpan={2}>
              {cutoff && cutoffToString(t, cutoff, eventId)}
            </GridItem>
            <GridItem colSpan={2}>
              {advancementCondition &&
                advancementConditionToString(
                  t,
                  advancementCondition,
                  eventId,
                  format,
                )}
            </GridItem>
          </>
        )}
      </SimpleGrid>
      <SimpleGrid columns={16} hideFrom="lg" gap={3}>
        <GridItem textAlign="left" colSpan={[6, 4]}>
          {t("competitions.schedule.range.from")}
          <br />
          <b>{getSimpleTimeString(startTime, timeZone)}</b>
        </GridItem>
        <GridItem textAlign="center" colSpan={[4, 8]}>
          <EventIcon eventId={eventId} size="2xl" />
        </GridItem>
        <GridItem textAlign="right" colSpan={[6, 4]}>
          {t("competitions.schedule.range.to")}
          <br />
          <b>{getSimpleTimeString(endTime, timeZone)}</b>
        </GridItem>
        <GridItem textAlign="center" colSpan={[16, 10]}>
          <b>{name}</b>
        </GridItem>
        <GridItem textAlign="center" colSpan={[16, 6]}>
          {roomsUsed.map((room) => room.name).join(", ")}
        </GridItem>
        {isExpanded && eventId !== "other" && (
          <>
            {format && (
              <>
                <GridItem textAlign="left" colSpan={[6, 4]}>
                  {t("competitions.events.format")}
                </GridItem>
                <GridItem textAlign="right" colSpan={[10, 4]}>
                  <b>
                    {cutoff &&
                      `${formats.byId[cutoff.numberOfAttempts].short_name} / `}
                    {formats.byId[format].short_name}
                  </b>
                </GridItem>
              </>
            )}
            {timeLimit && (
              <>
                <GridItem textAlign="left" colSpan={[6, 4]}>
                  {t("competitions.events.time_limit")}
                </GridItem>
                <GridItem textAlign="right" colSpan={[10, 4]}>
                  <b>
                    {round &&
                      timeLimitToString(t, timeLimit, eventId, wcifEvents)}
                    {timeLimit.cumulativeRoundIds.length === 1 && (
                      <a href="#cumulative-time-limit">*</a>
                    )}
                    {timeLimit.cumulativeRoundIds.length > 1 && (
                      <a href="#cumulative-across-rounds-time-limit">**</a>
                    )}
                  </b>
                </GridItem>
              </>
            )}
            {cutoff && (
              <>
                <GridItem textAlign="left" colSpan={[6, 4]}>
                  {t("competitions.events.cutoff")}
                </GridItem>
                <GridItem textAlign="right" colSpan={[10, 4]}>
                  <b>{cutoffToString(t, cutoff, eventId)}</b>
                </GridItem>
              </>
            )}
            {advancementCondition && (
              <>
                <GridItem textAlign="left" colSpan={[6, 4]}>
                  {t("competitions.events.proceed")}
                </GridItem>
                <GridItem textAlign="right" colSpan={[10, 4]}>
                  <b>
                    {advancementConditionToString(
                      t,
                      advancementCondition,
                      eventId,
                      format,
                    )}
                  </b>
                </GridItem>
              </>
            )}
          </>
        )}
      </SimpleGrid>
    </>
  );
}
