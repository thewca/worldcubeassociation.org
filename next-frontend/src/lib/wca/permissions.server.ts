import { cache } from "react";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";
import { getSession } from "@/auth";
import {
  hydrateUserPermissions,
  type PermissionContext,
} from "@/lib/wca/permissions";

/**
 * Split from `permissions.ts` because this half reaches the session, and so the auth instance and
 * its secrets. `permissions.ts` is imported by client hooks and must stay bundle-safe.
 */
const fetchPermissions = cache(async (authToken: string) => {
  const client = serverClientWithToken(authToken);

  return await client.GET("/v0/users/me/permissions");
});

export const getPermissions = async () => {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const { data: rawPermissions } = await fetchPermissions(session.accessToken);

  return {
    permissions: rawPermissions,
    ...hydrateUserPermissions(rawPermissions),
  } as PermissionContext;
};

export default getPermissions;
