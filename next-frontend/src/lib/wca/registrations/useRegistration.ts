"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { useAPIClient } from "@/lib/wca/useAPI";
import type { components } from "@/types/openapi";

type Registration = components["schemas"]["RegistrationDataV2"];

export const registrationQueryKey = (competitionId: string, userId: number) => [
  "registration",
  competitionId,
  userId,
];

type APIClient = ReturnType<typeof useAPIClient>;

export const registrationQueryOptions = (
  apiClient: APIClient,
  competitionId: string,
  userId: number,
) =>
  queryOptions({
    queryKey: registrationQueryKey(competitionId, userId),
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET(
        "/v1/competitions/{competitionId}/registrations/{userId}",
        { params: { path: { competitionId, userId } } },
      );

      // Not being registered is a normal answer rather than a failure, so it must not reject.
      if (response.status === 404) {
        return null;
      }

      if (error) {
        throw error;
      }

      return data;
    },
  });

/**
 * The competitor's own registration. Both the panel - which decides from it whether the flow is
 * still worth showing - and the flow itself read it, so it is fetched once under a shared key
 * rather than passed down and left to go stale.
 */
export default function useRegistration({
  competitionId,
  userId,
  initialRegistration,
}: {
  competitionId: string;
  userId: number;
  // `null` rather than `undefined` for "not registered": react-query reads `initialData:
  //   undefined` as "no initial data" and refetches on mount, throwing away the server fetch.
  initialRegistration: Registration | null;
}) {
  const apiClient = useAPIClient();

  const { data } = useQuery({
    ...registrationQueryOptions(apiClient, competitionId, userId),
    initialData: initialRegistration,
  });

  return data;
}
