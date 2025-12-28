import { useSession } from "next-auth/react";
import { useAPIClient } from "@/lib/wca/useAPI";
import { useQuery } from "@tanstack/react-query";
import { hydrateUserPermissions } from "@/lib/wca/permissions";

export const usePermissionsQuery = () => {
  const { data: session } = useSession();
  const api = useAPIClient();

  return useQuery({
    enabled: Boolean(session),
    queryKey: ["permissions", session?.user?.id],
    queryFn: () => api.GET("/v0/users/me/permissions"),
    select: (data) => {
      return {
        permissions: data.data,
        ...hydrateUserPermissions(data.data),
      };
    },
  });
};
