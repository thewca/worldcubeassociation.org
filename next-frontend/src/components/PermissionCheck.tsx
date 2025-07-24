"use client";

import React from "react";

import { usePermissions } from "@/providers/PermissionProvider";
import { PermissionFunctions } from "@/lib/wca/permissions";

export default function PermissionCheck({
  children,
  requiredPermission,
  item,
}: {
  children: React.ReactNode;
  requiredPermission: keyof PermissionFunctions;
  item: string;
}) {
  const permissions = usePermissions();

  if (permissions && permissions[requiredPermission](item)) {
    return children;
  }
  return <p>You are not authorized to view this page.</p>;
}
