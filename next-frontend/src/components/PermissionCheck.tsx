import React from "react";

import { getPermissions } from "@/lib/wca/permissions.server";
import { PermissionFunctions } from "@/lib/wca/permissions";
import { getT } from "@/lib/i18n/get18n";

export default async function PermissionCheck({
  children,
  requiredPermission,
  item,
}: {
  children: React.ReactNode;
  requiredPermission: keyof PermissionFunctions;
  item: string;
}) {
  const permissions = await getPermissions();

  if (permissions && permissions[requiredPermission](item)) {
    return children;
  }

  const { t } = await getT();

  return <p>{t("errors.messages.no_permission")}</p>;
}
