import type { CollectionConfig } from "payload";
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
    },
    {
      name: "href",
      type: "text",
      required: true,
    },
    {
      name: "isRailsPage",
      type: "checkbox",
      defaultValue: true,
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
