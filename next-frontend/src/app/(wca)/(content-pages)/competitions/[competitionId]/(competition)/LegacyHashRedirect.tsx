"use client";

import { useSyncExternalStore } from "react";
import { redirect, RedirectType } from "next/navigation";
import { route } from "nextjs-routes";
import { components } from "@/types/openapi";

const neverChanges = () => () => {};

// Rails `CompetitionTab#slug` is "<id>-<parameterized name>", so the id is enough to find the tab
const CUSTOM_TAB_SLUG = /^#(\d+)-/;

function targetForHash(
  hash: string,
  competitionId: string,
  tabs: components["schemas"]["CompetitionInfo"]["tabs"],
) {
  if (hash === "#competition-events") {
    return route({
      pathname: "/competitions/[competitionId]/events",
      query: { competitionId },
    });
  }

  if (hash === "#competition-schedule") {
    return route({
      pathname: "/competitions/[competitionId]/schedule",
      query: { competitionId },
    });
  }

  const tabId = hash.match(CUSTOM_TAB_SLUG)?.[1];
  const customTab = tabs.find((tab) => tab.id.toString() === tabId);

  if (customTab) {
    return route({
      pathname: "/competitions/[competitionId]/custom-tabs/[tabName]",
      query: { competitionId, tabName: encodeURIComponent(customTab.name) },
    });
  }

  return undefined;
}

/**
 * The Rails competition page selects its tabs through the URL hash, which never reaches the
 * server. So old links like `/competitions/Foo2026#competition-schedule` can only be
 * forwarded to their dedicated Next route once we are in the browser.
 */
export default function LegacyHashRedirect({
  competitionId,
  tabs,
}: {
  competitionId: string;
  tabs: components["schemas"]["CompetitionInfo"]["tabs"];
}) {
  const hash = useSyncExternalStore(
    neverChanges,
    () => window.location.hash,
    () => "",
  );

  const target = targetForHash(hash, competitionId, tabs);

  if (target) {
    redirect(target, RedirectType.replace);
  }

  return null;
}
