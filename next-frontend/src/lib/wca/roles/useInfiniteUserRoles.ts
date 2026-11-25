import createQueryClient from "openapi-react-query";
import type { components } from "@/types/openapi";
import { unauthenticatedClient } from "@/lib/wca/wcaAPI";
import {
  ROLES_PER_PAGE,
  type UserRolesQuery,
} from "@/lib/wca/roles/userRolesQuery";
import { SERVER_SEEDED_STALE_TIME } from "@/providers/WCAQueryClientProvider";

// The server fetches the first page without a token, and the endpoint returns more fields to some
// signed-in users, so further pages have to be unauthenticated to match.
const api = createQueryClient(unauthenticatedClient);

export default function useInfiniteUserRoles(
  query: UserRolesQuery,
  initialRoles: components["schemas"]["UserRole"][],
) {
  const { data, ...pagination } = api.useInfiniteQuery(
    "get",
    "/v0/user_roles",
    { params: { query } },
    {
      pageParamName: "page",
      getNextPageParam: (previousPage, allPages) =>
        previousPage.length < ROLES_PER_PAGE ? undefined : allPages.length + 1,
      initialPageParam: 1,
      initialData: { pages: [initialRoles], pageParams: [1] },
      staleTime: SERVER_SEEDED_STALE_TIME,
      refetchOnMount: true,
    },
  );

  return {
    roles: data?.pages.flat() ?? initialRoles,
    pagination,
  };
}
