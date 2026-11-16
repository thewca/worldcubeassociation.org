import type { CollectionConfig } from "payload";
import type { Route } from "nextjs-routes";
import { hasRole } from "@delmaredigital/payload-better-auth";
import { WCA_ROLES_FIELD } from "@/auth.config";
import type { PermissionFunctions } from "@/lib/wca/permissions";
import { newTabCheckbox } from "@/blocks/utils";
import { revalidateCollection } from "@/collections/revalidateCollection";

type UnscopedPermission = {
  [K in keyof PermissionFunctions]: PermissionFunctions[K] extends () => boolean
    ? K
    : never;
}[keyof PermissionFunctions];

const permissionOptions = [
  "canAccessCms",
  "canViewPolls",
  "canViewAllUsers",
  "canAdminResults",
  "canCreatePosts",
  "canManageRegionalOrganizations",
  "canViewDelegateAdminPage",
  "canManageIncidents",
] satisfies UnscopedPermission[];

type StaticRoute = Exclude<Route, { query: unknown }>["pathname"];

// `/payload` is the optional catch-all `/payload/[[...segments]]`, so it isn't a `StaticRoute`.
const targetLinkOptions = [
  "/competitions/mine",
  "/dashboard",
  "/payload",
] satisfies (StaticRoute | "/payload")[];

const isWstAdmin = hasRole(["wst_admin"], WCA_ROLES_FIELD);

export const AvatarMenuEntries: CollectionConfig = {
  slug: "avatarMenuEntries",
  admin: {
    useAsTitle: "label",
  },
  orderable: true,
  access: {
    create: isWstAdmin,
    update: isWstAdmin,
    delete: isWstAdmin,
  },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollection],
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description:
          "Link text shown in the avatar menu in the top-right corner of the navbar. Keep it short.",
      },
    },
    {
      name: "isRailsPage",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "href",
      type: "text",
      required: true,
      admin: {
        condition: (_, siblingData) => Boolean(siblingData.isRailsPage),
        description:
          "Root-relative path on the Rails site, e.g. /profile/edit.",
      },
    },
    {
      name: "targetLink",
      type: "select",
      options: targetLinkOptions,
      interfaceName: "AvatarMenuTargetLink",
      required: true,
      admin: {
        condition: (_, siblingData) => !siblingData.isRailsPage,
        description: "Page on this website the link points to.",
      },
    },
    newTabCheckbox,
    {
      name: "requiredPermission",
      type: "select",
      options: permissionOptions,
      interfaceName: "AvatarMenuPermission",
    },
  ],
};
