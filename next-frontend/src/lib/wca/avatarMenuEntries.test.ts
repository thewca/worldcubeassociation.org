import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import type { Session } from "@/auth.client";
import type { AvatarMenu } from "@/types/payload";
import buildAvatarMenuEntries from "./avatarMenuEntries";

const t = ((key: string) => key) as TFunction;
const session = { user: { wcaId: "2010ABCD01" } } as Session;

const railsLink = (label: string, href: string, gated = false) => ({
  blockType: "AvatarMenuLink" as const,
  label,
  href,
  isRailsPage: true,
  targetLink: "/dashboard" as const,
  requiredPermission: gated ? ("canAdminResults" as const) : null,
});

const entries: AvatarMenu["entries"] = [
  railsLink("Notifications", "/notifications"),
  { blockType: "AvatarMenuMyResults" },
  {
    blockType: "AvatarMenuGroup",
    header: "Software",
    entries: [
      railsLink("Apps", "/oauth/applications"),
      railsLink("Sidekiq", "/sidekiq/", true),
    ],
  },
  {
    blockType: "AvatarMenuGroup",
    header: "Hidden",
    entries: [railsLink("Sidekiq", "/sidekiq/", true)],
  },
];

describe("buildAvatarMenuEntries", () => {
  it("keeps CMS order, places My Results and drops empty groups", () => {
    expect(buildAvatarMenuEntries(session, entries, t)).toEqual([
      { kind: "rails", label: "Notifications", href: "/notifications" },
      {
        kind: "link",
        label: "layouts.navigation.my_results",
        href: "/persons/2010ABCD01",
      },
      {
        kind: "group",
        header: "Software",
        entries: [
          { kind: "rails", label: "Apps", href: "/oauth/applications" },
        ],
      },
    ]);
  });

  it("hides My Results without a WCA ID", () => {
    expect(
      buildAvatarMenuEntries({ user: {} } as Session, entries.slice(1, 2), t),
    ).toEqual([]);
  });
});
