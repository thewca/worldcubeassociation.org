import { route } from "nextjs-routes";
import { components } from "@/types/openapi";

// Inlined into the page via `toString()`, so it must not reference anything outside its own body.
//   Rails `CompetitionTab#slug` is "<id>-<parameterized name>", so the id is enough to find the tab.
function redirectLegacyHash(targets: Record<string, string>) {
  const { hash } = window.location;
  const customTabId = hash.match(/^#(\d+)-/)?.[1];
  const target = targets[hash] ?? (customTabId && targets[customTabId]);

  if (target) {
    window.location.replace(target);
  }
}

/**
 * The Rails competition page selects its tabs through the URL hash, which never reaches the
 * server. An inline script forwards old links like `/competitions/Foo2026#competition-schedule`
 * to their dedicated Next route before React even hydrates.
 */
export default function LegacyHashRedirect({
  competitionId,
  tabs,
}: {
  competitionId: string;
  tabs: components["schemas"]["CompetitionInfo"]["tabs"];
}) {
  const targets = {
    "#competition-events": route({
      pathname: "/competitions/[competitionId]/events",
      query: { competitionId },
    }),
    "#competition-schedule": route({
      pathname: "/competitions/[competitionId]/schedule",
      query: { competitionId },
    }),
    ...Object.fromEntries(
      tabs.map((tab) => [
        tab.id,
        route({
          pathname: "/competitions/[competitionId]/custom-tabs/[tabName]",
          query: { competitionId, tabName: encodeURIComponent(tab.name) },
        }),
      ]),
    ),
  };

  // The URL and organizer-written tab names end up in here, so `</script>` must not close the tag
  const safeTargets = JSON.stringify(targets).replaceAll("<", "\\u003c");
  const redirectScript = `(${redirectLegacyHash.toString()})(${safeTargets})`;

  return <script dangerouslySetInnerHTML={{ __html: redirectScript }} />;
}
