const POLL_URL = process.env.NEXT_PUBLIC_REGISTRATIONS_POLL_URL;

export interface RegistrationQueueStatus {
  processing: boolean;
  queue_count?: number;
}

/**
 * Asks the registration queue whether a submission is still waiting to be turned into a
 * registration. The queue lives outside the monolith, so it - not Rails - is what knows this;
 * polling Rails instead would mean hammering it with lookups that 404 until the worker is done.
 *
 * The queue is not part of the local development stack. With no URL configured we have nothing
 * to ask, so we report "not processing" and leave the caller to fall back on checking whether
 * the registration has shown up in Rails yet.
 */
export default async function pollRegistrationQueue(
  competitionId: string,
  userId: number,
): Promise<RegistrationQueueStatus> {
  if (!POLL_URL) {
    return { processing: false };
  }

  const query = new URLSearchParams({
    competition_id: competitionId,
    user_id: userId.toString(),
  });

  const response = await fetch(`${POLL_URL}?${query}`);

  if (!response.ok) {
    throw new Error(
      `Polling the registration queue failed with ${response.status}`,
    );
  }

  return await response.json();
}
