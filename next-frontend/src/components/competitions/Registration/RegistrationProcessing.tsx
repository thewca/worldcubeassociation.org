"use client";

import { HStack, Spinner, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useEffectEvent } from "react";
import { useT } from "@/lib/i18n/useI18n";
import { useAPIClient } from "@/lib/wca/useAPI";
import pollRegistrationQueue from "@/lib/wca/registrations/pollRegistrationQueue";
import { registrationQueryOptions } from "@/lib/wca/registrations/useRegistration";

// How often we ask the queue whether it has worked off our submission yet.
const QUEUE_POLL_INTERVAL_MS = 3000;
// Once the queue says it is done, how often we ask Rails for the registration it produced.
const REGISTRATION_REFETCH_INTERVAL_MS = 1000;

/**
 * Creating a registration only puts it on a queue, so a freshly submitted one does not exist yet.
 * The queue - not Rails - is what knows whether it has been worked off, so we wait on it first and
 * only then go and collect the registration it produced.
 */
export default function RegistrationProcessing({
  competitionId,
  userId,
  onCreated,
}: {
  competitionId: string;
  userId: number;
  onCreated: () => void;
}) {
  const { t } = useT();
  const apiClient = useAPIClient();

  const { data: queueStatus } = useQuery({
    queryKey: ["registration-queue", competitionId, userId],
    queryFn: () => pollRegistrationQueue(competitionId, userId),
    refetchInterval: (query) =>
      query.state.data?.processing === false ? false : QUEUE_POLL_INTERVAL_MS,
  });

  const isQueueDone = queueStatus?.processing === false;

  const { data: registration } = useQuery({
    ...registrationQueryOptions(apiClient, competitionId, userId),
    refetchInterval: (query) =>
      isQueueDone && query.state.data === null
        ? REGISTRATION_REFETCH_INTERVAL_MS
        : false,
  });

  const onRegistrationCreated = useEffectEvent(onCreated);

  // useQuery has no onSuccess since v5; an effect is what TanStack recommends in its place.
  useEffect(() => {
    if (registration) {
      onRegistrationCreated();
    }
  }, [registration]);

  return (
    <HStack>
      <Spinner />
      <Text>
        {queueStatus?.queue_count === undefined
          ? t("competitions.registration_v2.register.processing")
          : t("competitions.registration_v2.register.processing_queue", {
              queueCount: queueStatus.queue_count,
            })}
      </Text>
    </HStack>
  );
}
