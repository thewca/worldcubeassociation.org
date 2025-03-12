"use client"

import { PermissionFunctions, usePermissions} from "@/providers/PermissionProvider";

export default function PermissionCheck({ children, requiredPermission, item }: { children: React.ReactNode, requiredPermission: keyof PermissionFunctions, item: string}) {
  const permissions = usePermissions();

  if(permissions && permissions[requiredPermission](item)){
    return children;
  }
  return <p>
    You are not authorized to view this page.
  </p>;
}
