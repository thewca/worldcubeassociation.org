import type Link from "next/link";
import React from "react";
import { route } from "nextjs-routes";
import type { TFunction } from "i18next";
import type { Session } from "@/auth.client";
import {
  hydrateUserPermissions,
  type UserPermissions,
} from "@/lib/wca/permissions";
import type { AvatarMenuEntry } from "@/types/payload";

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

  return [
    ...cmsEntries
      .filter(
        ({ requiredPermission }) =>
          !requiredPermission || can[requiredPermission](),
      )
      .flatMap(
        ({ label, href, isRailsPage, targetLink, newTab }): MenuEntry[] => {
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
        },
      ),
    ...(session.user?.wcaId
      ? [
          {
            kind: "link",
            label: t("layouts.navigation.my_results"),
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
