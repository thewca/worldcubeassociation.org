import React from "react";

import { getPermissions } from "@/lib/wca/permissions.server";
import { PermissionFunctions } from "@/lib/wca/permissions";
import { getT } from "@/lib/i18n/get18n";

// Only permissions that can be decided from the item alone. `canViewDelegateReport` also needs to
// know whether the report is posted, so it is excluded.
type ItemPermission = {
  [K in keyof PermissionFunctions]: PermissionFunctions[K] extends (
    item: string,
  ) => boolean
    ? K
    : never;
}[keyof PermissionFunctions];

export default async function PermissionCheck({
  children,
  requiredPermission,
  item,
}: {
  children: React.ReactNode;
  requiredPermission: ItemPermission;
  item: string;
}) {
  const permissions = await getPermissions();

  if (permissions && permissions[requiredPermission](item)) {
    return children;
  }

  const { t } = await getT();

  return <p>{t("errors.messages.no_permission")}</p>;
}
