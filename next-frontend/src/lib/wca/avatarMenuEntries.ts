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

export type MenuEntry =
  | { kind: "separator" }
  | { kind: "header"; label: string }
  | {
      kind: "link";
      label: string;
      href: React.ComponentProps<typeof Link>["href"];
      newTab?: boolean | null;
    }
  // Rails owns most of these pages, so they need a full page load rather than a client transition.
  | { kind: "rails"; label: string; href: string };

export default function buildAvatarMenuEntries(
  session: Session,
  cmsEntries: AvatarMenuEntry[],
  permissions?: UserPermissions,
): MenuEntry[] {
  const can = hydrateUserPermissions(permissions);
  const rails = (label: string, href: string): MenuEntry => ({
    kind: "rails",
    label,
    href,
  });

  const panels = permissions?.can_access_panels.scope ?? [];

  return [
    ...cmsEntries
      .filter(
        ({ requiredPermission }) =>
          requiredPermission === "none" || can[requiredPermission](),
      )
      .map(({ label, href, isRailsPage, newTab }): MenuEntry =>
        isRailsPage
          ? rails(label, href)
          : { kind: "link", label, href: href as RouteLiteral, newTab },
      ),
    ...(session.user?.wcaId
      ? ([
          { kind: "separator" },
          {
            kind: "link",
            label: "My Results",
            href: route({
              pathname: "/persons/[wcaId]",
              query: { wcaId: session.user.wcaId },
            }),
          },
        ] as MenuEntry[])
      : []),
    ...(panels.length > 0
      ? ([
          { kind: "separator" },
          { kind: "header", label: "Panel" },
          ...panels.map((panelId) =>
            rails(PANEL_NAMES[panelId] ?? panelId, `/panel/${panelId}`),
          ),
        ] as MenuEntry[])
      : []),
    ...(can.canViewDelegateAdminPage() && can.canOrganizeCompetitions("*")
      ? ([
          { kind: "separator" },
          { kind: "header", label: "Delegate" },
          rails("New competition", "/competitions/new"),
        ] as MenuEntry[])
      : []),
  ];
}
