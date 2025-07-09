import React from "react";
import { Heading, List, Stack, Text } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";

import type { components } from "@/types/openapi";

type WcifEvent = components["schemas"]["WcifEvent"];
type QualificationDatesToEvents = Record<string, string[]>;

interface QualificationDateEventsListProps {
  qualificationDatesToEvents: QualificationDatesToEvents;
}

const QualificationDateEventsList: React.FC<
  QualificationDateEventsListProps
> = async ({ qualificationDatesToEvents }) => {
  const { t } = await getT();

  const numberOfEntries = Object.keys(qualificationDatesToEvents).length;

  if (numberOfEntries === 0) {
    return null;
  }

  if (numberOfEntries === 1) {
    const onlyDate = Object.keys(qualificationDatesToEvents)[0];

    return (
      <Text>
        {t(
          "competitions.events.time_limit_information.qualification_all_events_html",
          { date: onlyDate },
        )}
      </Text>
    );
  }

  return (
    <List.Root>
      {Object.entries(qualificationDatesToEvents).map(([date, events]) => {
        const eventNames = events.map((eventId) => t(`events.${eventId}`));

        return (
          <List.Item key={date}>
            {t(
              "competitions.events.time_limit_information.qualification_some_events_html",
              { date, events: eventNames.join(", ") },
            )}
          </List.Item>
        );
      })}
    </List.Root>
  );
};

interface TimeLimitCutoffFooterProps {
  events: WcifEvent[];
  forceQualifications?: boolean;
}

export const TimeLimitCutoffFooter: React.FC<
  TimeLimitCutoffFooterProps
> = async ({ events, forceQualifications = false }) => {
  const { t } = await getT();

  const showCutoff = events.some((event) =>
    event.rounds.some((round) => Boolean(round.cutoff)),
  );

  const showQualifications =
    forceQualifications || events.some((event) => Boolean(event.qualification));

  const showCumulativeOneRound = events.some((event) =>
    event.rounds.some(
      (round) => round.timeLimit?.cumulativeRoundIds.length === 1,
    ),
  );

  const showCumulativeAcrossRounds = events.some((event) =>
    event.rounds.some(
      (round) => (round.timeLimit?.cumulativeRoundIds.length ?? 0) > 1,
    ),
  );

  const qualificationDatesToEvents = events
    .filter((event): event is Required<WcifEvent> => !!event.qualification)
    .reduce((acc, event) => {
      const date = event.qualification.whenDate;

      return {
        ...acc,
        [date]: [...(acc[date] || []), event.id],
      };
    }, {} as QualificationDatesToEvents);

  return (
    <Stack>
      <Heading>{t("competitions.events.time_limit")}</Heading>
      <Text>
        {t("competitions.events.time_limit_information.time_limit_html")}
      </Text>
      {showCumulativeOneRound && (
        <Text>
          {t(
            "competitions.events.time_limit_information.cumulative_one_round_html",
            {
              cumulative_time_limit: t(
                "competitions.events.time_limit_information.cumulative_time_limit",
              ),
            },
          )}
        </Text>
      )}
      {showCumulativeAcrossRounds && (
        <Text>
          {t(
            "competitions.events.time_limit_information.cumulative_across_rounds_html",
            {
              cumulative_time_limit: t(
                "competitions.events.time_limit_information.cumulative_time_limit",
              ),
            },
          )}
        </Text>
      )}
      {showCutoff && (
        <>
          <Heading>{t("competitions.events.cutoff")}</Heading>
          <Text>
            {t("competitions.events.time_limit_information.cutoff_html")}
          </Text>
        </>
      )}
      <Heading>{t("competitions.events.format")}</Heading>
      <Text>{t("competitions.events.time_limit_information.format_html")}</Text>
      {showQualifications && (
        <>
          <Heading>{t("competitions.events.qualification")}</Heading>
          <Text>
            {t("competitions.events.time_limit_information.qualification_html")}
          </Text>
          {qualificationDatesToEvents && (
            <QualificationDateEventsList
              qualificationDatesToEvents={qualificationDatesToEvents}
            />
          )}
        </>
      )}
    </Stack>
  );
};
