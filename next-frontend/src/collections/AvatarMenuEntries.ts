import { revalidateTag } from "next/cache";
import type { Access, CollectionConfig } from "payload";
import type { PermissionFunctions } from "@/lib/wca/permissions";
import { AVATAR_MENU_ENTRIES_CACHE_TAG } from "@/lib/payload/avatarMenuEntries";
import { newTabCheckbox } from "@/blocks/utils";

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

const isWstAdmin: Access = ({ req: { user } }) =>
  Boolean(user?.roles?.includes("wst_admin"));

const revalidateAvatarMenuEntries = () =>
  revalidateTag(AVATAR_MENU_ENTRIES_CACHE_TAG, { expire: 0 });

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
    afterChange: [revalidateAvatarMenuEntries],
    afterDelete: [revalidateAvatarMenuEntries],
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
      options: ["none", ...permissionOptions],
      defaultValue: "none",
      interfaceName: "AvatarMenuPermission",
      required: true,
    },
  ],
};
