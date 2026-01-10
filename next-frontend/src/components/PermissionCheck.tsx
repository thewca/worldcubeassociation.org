import React from "react";

import { getPermissions, PermissionFunctions } from "@/lib/wca/permissions";

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

  return <p>You are not authorized to view this page.</p>;
}
