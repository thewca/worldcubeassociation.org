"use client"

import {PermissionContext, usePermissions} from "@/providers/PermissionProvider";

export default function PermissionCheck({ children, permissionCheck }: { children: React.ReactNode, permissionCheck: (permission: PermissionContext) => boolean }) {
  const permissions = usePermissions();

  if(permissionCheck(permissions!)){
    return children;
  }
  return <p>
    You are not authorized to view this page.
  </p>;
}
