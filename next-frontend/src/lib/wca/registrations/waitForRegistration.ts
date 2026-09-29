import type { QueryClient } from "@tanstack/react-query";
import type { useAPIClient } from "@/lib/wca/useAPI";
import pollRegistrationQueue from "@/lib/wca/registrations/pollRegistrationQueue";
import { registrationQueryOptions } from "@/lib/wca/registrations/useRegistration";
import type { components } from "@/types/openapi";

type APIClient = ReturnType<typeof useAPIClient>;
type Registration = components["schemas"]["RegistrationDataV2"];

// How often we ask the queue whether it has worked off our submission yet.
const QUEUE_POLL_INTERVAL_MS = 3000;
// Once the queue says it is done, how often we ask Rails for the registration it produced.
const REGISTRATION_REFETCH_INTERVAL_MS = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForQueue(
  competitionId: string,
  userId: number,
  onQueueCount: (queueCount?: number) => void,
): Promise<void> {
  const queueStatus = await pollRegistrationQueue(competitionId, userId);

  if (!queueStatus.processing) {
    return;
  }

  onQueueCount(queueStatus.queue_count);
  await sleep(QUEUE_POLL_INTERVAL_MS);

  return waitForQueue(competitionId, userId, onQueueCount);
}

// Fetched through the shared registration query, so that whatever else reads it sees the new
//   registration as soon as it turns up.
async function waitForRails(
  queryClient: QueryClient,
  apiClient: APIClient,
  competitionId: string,
  userId: number,
): Promise<Registration> {
  const registration = await queryClient.query({
    ...registrationQueryOptions(apiClient, competitionId, userId),
    staleTime: 0,
  });

  if (registration !== null) {
    return registration;
  }

  await sleep(REGISTRATION_REFETCH_INTERVAL_MS);

  return waitForRails(queryClient, apiClient, competitionId, userId);
}

/**
 * Creating a registration only puts it on a queue, so a freshly submitted one does not exist yet.
 * The queue - not Rails - is what knows whether it has been worked off, so we wait on it first and
 * only then go and collect the registration it produced.
 */
export default async function waitForRegistration(
  queryClient: QueryClient,
  apiClient: APIClient,
  competitionId: string,
  userId: number,
  onQueueCount: (queueCount?: number) => void,
) {
  await waitForQueue(competitionId, userId, onQueueCount);

  return waitForRails(queryClient, apiClient, competitionId, userId);
}
