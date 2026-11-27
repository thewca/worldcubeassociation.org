import { route } from "nextjs-routes";
import { components } from "@/types/openapi";
import type { IconName, LucideIconName } from "@/components/icons/iconMap";
import type { RouteLiteral } from "nextjs-routes";
import { getRoundTypeId, parseActivityCode } from "@/lib/wca/wcif/rounds";
import _ from "lodash";
import { EventId } from "@/lib/wca/data/events";
import { hasPassed } from "@/lib/wca/dates";
import type { PermissionFunctions } from "@/lib/wca/permissions";
import { railsHref } from "@/components/RailsLink";

interface TabBase {
  i18nKey: string;
  i18nKeyAdmin?: string;
  menuKey: string;
  icon?: IconName | LucideIconName;
  tooltipI18nKey?: string;
}

export interface TabWithLink extends TabBase {
  type: "tab-link";
  disabled?: boolean;
  badgeI18nKey?: string;
  href: RouteLiteral;
  hrefAdmin?: RouteLiteral;
}

export interface TabWithExternalLink extends TabBase {
  type: "tab-with-external-link";
  externalHref: string;
}

export interface TabWithChildren extends TabBase {
  type: "tab-with-children";
  icon: IconName | LucideIconName;
  children: (TabWithLink | TabWithExternalLink)[];
}

export type CompetitionNavTab =
  TabWithLink | TabWithExternalLink | TabWithChildren;

export const isTabDisabled = (tab: CompetitionNavTab) =>
  tab.type === "tab-link" && Boolean(tab.disabled);

const eventsAndScheduleTabs = (
  competitionInfo: components["schemas"]["V1CompetitionInfo"],
): TabWithLink[] => {
  return [
    {
      type: "tab-link",
      i18nKey: "competitions.show.events",
      href: route({
        pathname: "/competitions/[competitionId]/events",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "events",
      icon: "333Icon",
    },
    {
      type: "tab-link",
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

export const beforeCompetitionTabs = (
  competitionInfo: components["schemas"]["V1CompetitionInfo"],
): TabWithLink[] => {
  return [
    {
      type: "tab-link",
      i18nKey: "competitions.nav.menu.info",
      href: route({
        pathname: "/competitions/[competitionId]",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "general",
      icon: "Information",
    },
    {
      type: "tab-link",
      i18nKey: "competitions.nav.menu.register",
      href: route({
        pathname: "/competitions/[competitionId]/register",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "register",
      icon: "Register",
    },
    {
      type: "tab-link",
      i18nKey: "competitions.nav.menu.competitors",
      href: route({
        pathname: "/competitions/[competitionId]/competitors",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "competitors",
      icon: "Competitors",
    },
    ...eventsAndScheduleTabs(competitionInfo),
  ];
};

export const liveTab = (
  competitionInfo: components["schemas"]["V1CompetitionInfo"],
): TabWithLink | TabWithExternalLink => {
  const base = {
    i18nKey: "competitions.live.title",
    menuKey: "live",
    icon: "Records" as const,
  };

  switch (competitionInfo.scoretaking_software) {
    case "internal":
      return {
        ...base,
        type: "tab-link",
        href: route({
          pathname: "/competitions/[competitionId]/live",
          query: { competitionId: competitionInfo.id },
        }),
      };
    case "wca_live":
      return {
        ...base,
        type: "tab-with-external-link",
        externalHref: `https://live.worldcubeassociation.org/link/competitions/${competitionInfo.id}`,
      };
    default:
      return {
        ...base,
        type: "tab-link",
        href: route({
          pathname: "/competitions/[competitionId]/live",
          query: { competitionId: competitionInfo.id },
        }),
        disabled: true,
        tooltipI18nKey: "competitions.live.incompatible.external",
      };
  }
};

export const duringCompetitionTabs = (
  competitionInfo: components["schemas"]["V1CompetitionInfo"],
  rounds: components["schemas"]["LiveRoundAdmin"][],
): CompetitionNavTab[] => {
  const roundsByEventId = _.groupBy(
    rounds,
    (r) => parseActivityCode(r.id).eventId,
  );

  return [
    {
      type: "tab-link",
      i18nKey: "competitions.show.schedule",
      i18nKeyAdmin: "competitions.live.manage_rounds",
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
      type: "tab-link",
      i18nKey: "competitions.nav.menu.podiums",
      href: route({
        pathname: "/competitions/[competitionId]/live/podiums",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "podiums",
      icon: "Records",
    },
    {
      type: "tab-link",
      i18nKey: "competitions.nav.menu.competitors",
      href: route({
        pathname: "/competitions/[competitionId]/competitors",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "competitors",
      icon: "Competitors",
    },
    ..._.map(roundsByEventId, (rounds, eventId: EventId): TabWithChildren => ({
      type: "tab-with-children",
      i18nKey: `events.${eventId}`,
      menuKey: eventId,
      icon: `${_.capitalize(eventId)}Icon` as IconName,
      children: rounds.map((round): TabWithLink => {
        const { roundNumber } = parseActivityCode(round.id);

        const roundTypeId = getRoundTypeId(
          roundNumber!,
          rounds.length,
          Boolean(round.cutoff),
        );

        const roundDone =
          round.state === "locked" ||
          (round.state === "open" &&
            round.completed_competitors === round.total_competitors);
        return {
          type: "tab-link",
          i18nKey: `rounds.${roundTypeId}.name`,
          menuKey: round.id,
          badgeI18nKey: roundDone
            ? "competitions.live.round_state.done"
            : "competitions.live.round_state.ongoing",
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
  competitionInfo: components["schemas"]["V1CompetitionInfo"],
  isAwaitingResults: boolean,
): (TabWithLink | TabWithExternalLink)[] => {
  const infoTab: TabWithLink = {
    type: "tab-link",
    i18nKey: "competitions.nav.menu.info",
    href: route({
      pathname: "/competitions/[competitionId]",
      query: { competitionId: competitionInfo.id },
    }),
    menuKey: "general",
    icon: "Information",
  };

  if (isAwaitingResults) {
    return [
      infoTab,
      liveTab(competitionInfo),
      ...eventsAndScheduleTabs(competitionInfo),
    ];
  }

  return [
    infoTab,
    {
      type: "tab-link",
      i18nKey: "competitions.nav.menu.podiums",
      href: route({
        pathname: "/competitions/[competitionId]/podiums",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "podiums",
      icon: "Records",
    },
    {
      type: "tab-link",
      i18nKey: "competitions.nav.menu.results",
      href: route({
        pathname: "/competitions/[competitionId]/results/all",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "all",
      icon: "List",
    },
    {
      type: "tab-link",
      i18nKey: "competitions.nav.menu.scrambles",
      href: route({
        pathname: "/competitions/[competitionId]/scrambles",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "scrambles",
      icon: "Scrambles",
    },
    {
      type: "tab-link",
      i18nKey: "competitions.nav.menu.by_person",
      href: route({
        pathname: "/competitions/[competitionId]/results/by-person",
        query: { competitionId: competitionInfo.id },
      }),
      menuKey: "by-person",
      icon: "Competitors",
    },
    ...eventsAndScheduleTabs(competitionInfo),
  ];
};

// Mirrors the permission-gated links of the legacy `competitions/_nav.html.erb`, approximated
// from `/users/me/permissions`. The Rails pages enforce the exact permissions themselves.
export const adminTabs = (
  competitionInfo: components["schemas"]["V1CompetitionInfo"],
  permissions: PermissionFunctions,
): TabWithChildren[] => {
  const competitionId = competitionInfo.id;

  const canManage = permissions.canAdministerCompetition(competitionId);
  const canAdminCompetitions = permissions.canAdminCompetitions();
  const canAdminResults = permissions.canAdminResults();
  // `can_edit_delegate_report` is scoped to "Results admin or Delegate of this competition".
  const isResultsAdminOrDelegate =
    permissions.canEditDelegateReport(competitionId);

  const isAnnounced =
    competitionInfo.status !== "unconfirmed" &&
    competitionInfo.status !== "confirmed";
  const resultsPosted = competitionInfo.status === "results_posted";

  const canUploadResults =
    isResultsAdminOrDelegate &&
    isAnnounced &&
    hasPassed(competitionInfo.start_date) &&
    (canAdminResults || !resultsPosted);

  const railsLink = (
    i18nKey: string,
    path: string,
    icon: IconName | LucideIconName,
  ): TabWithExternalLink => ({
    type: "tab-with-external-link",
    i18nKey,
    menuKey: i18nKey,
    icon,
    externalHref: railsHref(`/competitions/${competitionId}${path}`),
  });

  const children = _.compact([
    canManage && railsLink("competitions.nav.menu.orga_view", "/edit", "Edit"),
    canManage &&
      railsLink("competitions.nav.menu.event_view", "/events/edit", "333Icon"),
    canManage &&
      (canAdminCompetitions || !resultsPosted) &&
      railsLink(
        "competitions.nav.menu.schedule_view",
        "/schedule/edit",
        "Registration Open Date",
      ),
    canManage &&
      railsLink(
        "competitions.nav.menu.payment_view",
        "/payment_integration/setup",
        "Payment",
      ),
    canAdminCompetitions &&
      railsLink("competitions.nav.menu.admin_view", "/edit/admin", "Lock"),
    canManage &&
      (!competitionInfo.registration_info.external_registration_page
        ? railsLink(
            "competitions.nav.menu.registration",
            "/edit/registrations",
            "Registration",
          )
        : railsLink(
            "competitions.nav.menu.import_registrations",
            "/registrations/import",
            "Upload",
          )),
    permissions.canCreateCompetitions() &&
      railsLink(
        "competitions.nav.menu.clone",
        "/edit/clone_competition",
        "Clone",
      ),
    isResultsAdminOrDelegate &&
      railsLink(
        "competitions.nav.menu.newcomer_checks",
        "/newcomer-checks",
        "Competitors",
      ),
    canUploadResults &&
      railsLink(
        "competitions.nav.menu.submit_results",
        "/submit-results",
        "Cloud Upload",
      ),
    canUploadResults &&
      railsLink(
        "competitions.nav.menu.upload_scrambles",
        "/upload-scrambles",
        "Scrambles",
      ),
    // i18n-tasks-use t('competitions.nav.menu.upload_and_check_results')
    canAdminResults &&
      railsLink(
        "competitions.nav.menu.upload_and_check_results",
        "/admin/upload-results",
        "Admin Results",
      ),
    // i18n-tasks-use t('competitions.nav.menu.check_existing_results')
    canAdminResults &&
      railsLink(
        "competitions.nav.menu.check_existing_results",
        "/admin/check-existing-results",
        "List Checks",
      ),
    permissions.canViewDelegateReport(competitionId) &&
      railsLink(
        "competitions.nav.menu.delegate_report",
        "/report",
        "Delegate Report",
      ),
    canManage &&
      railsLink("competitions.nav.menu.tabs", "/tabs", "Manage Tabs"),
  ]);

  const hasNoAdminLinks = _.isEmpty(children);

  if (hasNoAdminLinks) return [];

  return [
    {
      type: "tab-with-children",
      i18nKey: "competitions.nav.admin",
      menuKey: "admin",
      icon: "Lock",
      children,
    },
  ];
};
