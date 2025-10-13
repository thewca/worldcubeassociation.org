import { serverClient } from "@/lib/wca/wcaAPI";
import { cache } from "react";

const getActiveRolesOfType = cache(async (groupType: string) => {
  return await serverClient.GET("/v0/user_roles", {
    params: { query: { isActive: true, groupType } },
  });
});

export const getOfficersRoles = () => getActiveRolesOfType("officers");
export const getBoardRoles = () => getActiveRolesOfType("board");
export const getTranslatorRoles = () => getActiveRolesOfType("translators");
