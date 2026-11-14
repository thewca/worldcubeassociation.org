import type Link from "next/link";
import React from "react";
import { route } from "nextjs-routes";
import type { TFunction } from "i18next";
import type { Session } from "@/auth.client";
import {
  hydrateUserPermissions,
  type UserPermissions,
} from "@/lib/wca/permissions";
import type { AvatarMenu, AvatarMenuLink } from "@/types/payload";

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
  cmsEntries: AvatarMenu["entries"],
  t: TFunction,
  permissions?: UserPermissions,
): MenuEntry[] {
  const can = hydrateUserPermissions(permissions);
  const rails = (label: string, href: string): FlatMenuEntry => ({
    kind: "rails",
    label,
    href,
  });

  const panels = permissions?.can_access_panels.scope ?? [];

  const cmsLink = ({
    label,
    href,
    isRailsPage,
    targetLink,
    newTab,
    requiredPermission,
  }: AvatarMenuLink): FlatMenuEntry[] => {
    if (requiredPermission && !can[requiredPermission]()) {
      return [];
    }

    if (isRailsPage) {
      return href ? [rails(label, href)] : [];
    }

    if (!targetLink) {
      return [];
    }

    return [
      {
        kind: "link",
        label,
        href:
          targetLink === "/payload"
            ? route({ pathname: "/payload/[[...segments]]", query: {} })
            : targetLink,
        newTab,
      },
    ];
  };

  return [
    ...cmsEntries.flatMap((entry): MenuEntry[] => {
      switch (entry.blockType) {
        case "AvatarMenuLink":
          return cmsLink(entry);
        case "AvatarMenuMyResults":
          return session.user?.wcaId
            ? [
                {
                  kind: "link",
                  label: t("layouts.navigation.my_results"),
                  href: route({
                    pathname: "/persons/[wcaId]",
                    query: { wcaId: session.user.wcaId },
                  }),
                },
              ]
            : [];
        case "AvatarMenuGroup": {
          const entries = entry.entries.flatMap(cmsLink);

          return entries.length > 0
            ? [{ kind: "group", header: entry.header, entries }]
            : [];
        }
      }
    }),
    ...(panels.length > 0
      ? [
          {
            kind: "group",
            header: t("layouts.navigation.panel"),
            entries: panels.map((panelId) =>
              rails(
                t(`layouts.navigation.panels.${panelId}`, {
                  defaultValue: panelId,
                }),
                `/panel/${panelId}`,
              ),
            ),
          } satisfies MenuEntry,
        ]
      : []),
    ...(can.canViewDelegateAdminPage() && can.canCreateCompetitions()
      ? [
          {
            kind: "group",
            header: t("layouts.navigation.delegate"),
            entries: [
              rails(
                t("layouts.navigation.new_competition"),
                "/competitions/new",
              ),
            ],
          } satisfies MenuEntry,
        ]
      : []),
  ];
}
