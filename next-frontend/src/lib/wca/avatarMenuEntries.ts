import type Link from "next/link";
import React from "react";
import { route } from "nextjs-routes";
import type { Session } from "@/auth.client";
import {
  hydrateUserPermissions,
  type UserPermissions,
} from "@/lib/wca/permissions";

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
      newTab?: boolean;
    }
  // Rails owns most of these pages, so they need a full page load rather than a client transition.
  | { kind: "rails"; label: string; href: string };

export default function buildAvatarMenuEntries(
  session: Session,
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
    {
      kind: "link",
      label: "Payload CMS",
      href: route({ pathname: "/payload/[[...segments]]", query: {} }),
      newTab: true,
    },
    { kind: "link", label: "Developer Dashboard", href: "/dashboard" },
    { kind: "separator" },
    rails("Notifications", "/notifications"),
    rails("Edit profile", "/profile/edit"),
    { kind: "separator" },
    { kind: "link", label: "My Competitions", href: "/competitions/mine" },
    ...(session.user?.wcaId
      ? ([
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
    ...(can.canViewPolls()
      ? ([{ kind: "separator" }, rails("Polls", "/polls")] as MenuEntry[])
      : []),
    ...(can.canViewAllUsers()
      ? ([
          { kind: "separator" },
          { kind: "header", label: "Administration" },
          rails("Manage users", "/users"),
        ] as MenuEntry[])
      : []),
    ...(can.canViewDelegateAdminPage() && can.canOrganizeCompetitions("*")
      ? ([
          { kind: "separator" },
          { kind: "header", label: "Delegate" },
          rails("New competition", "/competitions/new"),
        ] as MenuEntry[])
      : []),
    ...(can.canAdminResults()
      ? ([
          { kind: "separator" },
          { kind: "header", label: "Results Team" },
          rails("Competitions", "/competitions"),
          rails("Sidekiq", "/sidekiq/"),
        ] as MenuEntry[])
      : []),
    ...(can.canCreatePosts()
      ? ([
          { kind: "separator" },
          rails("New post", "/posts/new"),
        ] as MenuEntry[])
      : []),
    ...(can.canManageRegionalOrganizations()
      ? ([
          { kind: "separator" },
          { kind: "header", label: "Regional Organizations" },
          rails(
            "Manage regional organizations",
            "/admin/regional-organizations",
          ),
          rails("New regional organization", "/regional-organizations/new"),
        ] as MenuEntry[])
      : []),
    { kind: "separator" },
    rails("API", "/api"),
    rails("Manage your applications", "/oauth/applications"),
    rails("Authorized applications", "/oauth/authorized_applications"),
  ];
}
