import { cachedServerClient } from "@/lib/wca/wcaAPI";
import { cacheLife } from "next/cache";

async function getActiveRolesOfType(groupType: string, perPage: number = 25) {
  "use cache";
  cacheLife("hours");

  return cachedServerClient.GET("/v0/user_roles", {
    params: { query: { isActive: true, groupType, per_page: perPage } },
  });
}

export const getOfficersRoles = () => getActiveRolesOfType("officers");
export const getBoardRoles = () => getActiveRolesOfType("board");
// This will break again if we ever get over 100 translators
export const getTranslatorRoles = () =>
  getActiveRolesOfType("translators", 100);
