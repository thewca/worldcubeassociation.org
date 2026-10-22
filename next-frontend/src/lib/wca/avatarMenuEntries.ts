import type Link from "next/link";
import React from "react";
import { route, type RouteLiteral } from "nextjs-routes";
import type { Session } from "@/auth.client";
import {
  hydrateUserPermissions,
  type UserPermissions,
} from "@/lib/wca/permissions";
import type { AvatarMenuEntry } from "@/types/payload";

// Mirrors the names in `User.panel_list`; the permissions endpoint only hands us the ids.
const PANEL_NAMES: Record<string, string> = {
  admin: "Admin panel",
  volunteer: "Volunteer panel",
  delegate: "Delegate panel",
  wapc: "WAC panel",
  wfc: "WFC panel",
  wrt: "WRT panel",
  wst: "WST panel",
  board: "Board panel",
  leader: "Leader panel",
  senior_delegate: "Senior Delegate panel",
  wic: "WIC panel",
  weat: "WEAT panel",
  wqac: "WQAC panel",
};

export type FlatMenuEntry =
  | {
      kind: "link";
      label: string;
      href: React.ComponentProps<typeof Link>["href"];
      newTab?: boolean | null;
    }
  // Rails owns most of these pages, so they need a full page load rather than a client transition.
  | { kind: "rails"; label: string; href: string };

export type MenuEntry =
  FlatMenuEntry | { kind: "group"; header: string; entries: FlatMenuEntry[] };

export default function buildAvatarMenuEntries(
  session: Session,
  cmsEntries: AvatarMenuEntry[],
  permissions?: UserPermissions,
): MenuEntry[] {
  const can = hydrateUserPermissions(permissions);
  const rails = (label: string, href: string): FlatMenuEntry => ({
    kind: "rails",
    label,
    href,
  });

  const panels = permissions?.can_access_panels.scope ?? [];

  return [
    ...cmsEntries
      .filter(
        ({ requiredPermission }) =>
          !requiredPermission || can[requiredPermission](),
      )
      .map(({ label, href, isRailsPage, newTab }): MenuEntry =>
        isRailsPage
          ? rails(label, href)
          : { kind: "link", label, href: href as RouteLiteral, newTab },
      ),
    ...(session.user?.wcaId
      ? [
          {
            kind: "link",
            label: "My Results",
            href: route({
              pathname: "/persons/[wcaId]",
              query: { wcaId: session.user.wcaId },
            }),
          } satisfies MenuEntry,
        ]
      : []),
    ...(panels.length > 0
      ? [
          {
            kind: "group",
            header: "Panel",
            entries: panels.map((panelId) =>
              rails(PANEL_NAMES[panelId] ?? panelId, `/panel/${panelId}`),
            ),
          } satisfies MenuEntry,
        ]
      : []),
    ...(can.canViewDelegateAdminPage() && can.canOrganizeCompetitions("*")
      ? [
          {
            kind: "group",
            header: "Delegate",
            entries: [rails("New competition", "/competitions/new")],
          } satisfies MenuEntry,
        ]
      : []),
  ];
}
