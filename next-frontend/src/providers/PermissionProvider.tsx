"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import { useSession } from "next-auth/react";
import {
  hydrateUserPermissions,
  type PermissionContext,
} from "@/lib/wca/permissions";
import Loading from "@/components/ui/loading";

const PermissionContext = createContext<PermissionContext | null>(null);

export const usePermissions = () => useContext(PermissionContext);

export default function PermissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const api = useAPI();
  const { data: rawPermissions, isLoading } = useQuery({
    enabled: Boolean(session),
    queryKey: ["permissions", session?.user?.id],
    queryFn: () => api.GET("/users/me/permissions"),
    select: (data) => data.data,
  });

  const permissions: PermissionContext = useMemo(() => {
    return {
      permissions: rawPermissions,
      ...hydrateUserPermissions(rawPermissions),
    };
  }, [rawPermissions]);

  if (isLoading) return <Loading />;

  return (
    <PermissionContext.Provider value={permissions}>
      {children}
    </PermissionContext.Provider>
  );
}
