import { route } from "nextjs-routes";
import { components } from "@/types/openapi";
import type { IconName } from "@/components/icons/iconMap";
import type { RouteLiteral } from "nextjs-routes";
import { getRoundTypeId, parseActivityCode } from "@/lib/wca/wcif/rounds";
import _ from "lodash";
import { EventId } from "@/lib/wca/data/events";

interface TabBase {
  i18nKey: string;
  menuKey: string;
  icon?: IconName;
  disabled?: boolean;
}

export interface TabWithChildren extends TabBase {
  icon: IconName;
  children: TabWithLink[];
}

interface TabWithLink extends TabBase {
  badge?: string;
  href: RouteLiteral;
  hrefAdmin?: RouteLiteral;
}

export type CompetitionNavTab = TabWithChildren | TabWithLink;

export const beforeCompetitionTabs = (
  competitionInfo: components["schemas"]["CompetitionInfo"],
): TabWithLink[] => {
  return [
    {
      i18nKey: "competitions.nav.menu.info",
      href: route({
        pathname: "/competitions/[competitionId]",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "general",
      icon: "Information",
    },
    {
      i18nKey: "competitions.nav.menu.register",
      href: route({
        pathname: "/competitions/[competitionId]/register",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "register",
      icon: "Register",
      disabled: process.env.NODE_ENV === "production",
    },
    {
      i18nKey: "competitions.nav.menu.competitors",
      href: route({
        pathname: "/competitions/[competitionId]/competitors",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "competitors",
      icon: "Competitors",
    },
    {
      i18nKey: "competitions.show.events",
      href: route({
        pathname: "/competitions/[competitionId]/events",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "events",
      icon: "333Icon",
    },
    {
      i18nKey: "competitions.show.schedule",
      href: route({
        pathname: "/competitions/[competitionId]/schedule",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "schedule",
      icon: "Registration Open Date",
    },
  ];
};

export const duringCompetitionTabs = (
  competitionInfo: components["schemas"]["CompetitionInfo"],
  rounds: components["schemas"]["LiveRoundAdmin"][],
): CompetitionNavTab[] => {
  const roundsByEventId = _.groupBy(
    rounds,
    (r) => parseActivityCode(r.id).eventId,
  );

  return [
    {
      i18nKey: "competitions.show.schedule",
      href: route({
        pathname: "/competitions/[competitionId]/live",
        query: { competitionId: competitionInfo.id },
      }),
      hrefAdmin: route({
        pathname: "/competitions/[competitionId]/live/admin",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "live",
      icon: "Information",
    },
    {
      i18nKey: "competitions.nav.menu.podiums",
      href: route({
        pathname: "/competitions/[competitionId]/live/podiums",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "podiums",
      icon: "Records",
    },
    {
      i18nKey: "competitions.nav.menu.competitors",
      href: route({
        pathname: "/competitions/[competitionId]/competitors",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "competitors",
      icon: "Competitors",
    },
    ..._.map(roundsByEventId, (rounds, eventId: EventId) => ({
      i18nKey: `events.${eventId}`,
      menuKey: eventId,
      icon: `${_.capitalize(eventId)}Icon` as IconName,
      children: rounds.map((round) => {
        const { roundNumber } = parseActivityCode(round.id);

        const roundTypeId = getRoundTypeId(
          roundNumber!,
          rounds.length,
          Boolean(round.cutoff),
        );
        return {
          i18nKey: `rounds.${roundTypeId}.name`,
          menuKey: round.id,
          badge: round.state === "locked" ? "Done" : "live",
          disabled: round.state === "pending" || round.state === "ready",
          href: route({
            pathname: "/competitions/[competitionId]/live/rounds/[roundId]",
            query: { competitionId: competitionInfo.id, roundId: round.id },
          }),
          hrefAdmin: route({
            pathname:
              "/competitions/[competitionId]/live/rounds/[roundId]/admin",
            query: { competitionId: competitionInfo.id, roundId: round.id },
          }),
        };
      }),
    })),
  ];
};
export const afterCompetitionTabs = (
  competitionInfo: components["schemas"]["CompetitionInfo"],
): TabWithLink[] => {
  return [
    {
      i18nKey: "competitions.nav.menu.info",
      href: route({
        pathname: "/competitions/[competitionId]",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "general",
      icon: "Information",
    },
    {
      i18nKey: "competitions.nav.menu.podiums",
      href: route({
        pathname: "/competitions/[competitionId]/podiums",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "podiums",
      icon: "Records",
    },
    {
      i18nKey: "competitions.nav.menu.results",
      href: route({
        pathname: "/competitions/[competitionId]/results/all",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "all",
      icon: "List",
    },
    {
      i18nKey: "competitions.nav.menu.by_person",
      href: route({
        pathname: "/competitions/[competitionId]/results/byPerson",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "byPerson",
      icon: "Competitors",
    },
  ];
};
