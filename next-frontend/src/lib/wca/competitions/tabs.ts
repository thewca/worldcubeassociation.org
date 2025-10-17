import { route } from "nextjs-routes";
import { components } from "@/types/openapi";
import { iconMap } from "@/components/icons/iconMap";
import { LuCalendar } from "react-icons/lu";

export const beforeCompetitionTabs = (
  competitionInfo: components["schemas"]["CompetitionInfo"],
) => {
  return [
    {
      i18nKey: "competitions.nav.menu.info",
      href: route({
        pathname: "/competitions/[competitionId]",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "general",
      icon: iconMap["Information"],
    },
    {
      i18nKey: "competitions.nav.menu.register",
      href: route({
        pathname: "/competitions/[competitionId]/register",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "register",
      icon: iconMap["Register"],
    },
    {
      i18nKey: "competitions.nav.menu.competitors",
      href: route({
        pathname: "/competitions/[competitionId]/competitors",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "competitors",
      icon: iconMap["Competitors"],
    },
    {
      i18nKey: "competitions.show.events",
      href: route({
        pathname: "/competitions/[competitionId]/events",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "events",
      icon: iconMap["333Icon"],
    },
    {
      i18nKey: "competitions.show.schedule",
      href: route({
        pathname: "/competitions/[competitionId]/schedule",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "schedule",
      icon: LuCalendar,
    },
  ];
};
// TODO: Later for WCA Live Integration
export const duringCompetitionTabs = [];
export const afterCompetitionTabs = (
  competitionInfo: components["schemas"]["CompetitionInfo"],
) => {
  return [
    {
      i18nKey: "competitions.nav.menu.info",
      href: route({
        pathname: "/competitions/[competitionId]",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "general",
      icon: iconMap["Information"],
    },
    {
      i18nKey: "competitions.nav.menu.podiums",
      href: route({
        pathname: "/competitions/[competitionId]/podiums",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "podiums",
      icon: iconMap["Records"],
    },
    {
      i18nKey: "competitions.nav.menu.results",
      href: route({
        pathname: "/competitions/[competitionId]/results/all",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "all",
      icon: iconMap["List"],
    },
    {
      i18nKey: "competitions.nav.menu.by_person",
      href: route({
        pathname: "/competitions/[competitionId]/results/byPerson",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "byPerson",
      icon: iconMap["Competitors"],
    },
  ];
};
