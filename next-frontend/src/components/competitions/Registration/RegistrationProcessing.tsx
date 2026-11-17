"use client";

import { Alert, Dialog, Portal, Stack } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const queueQueryKey = ["registration-queue", competitionId, userId];

  const { data: queueStatus } = useQuery({
    queryKey: queueQueryKey,
    queryFn: () => pollRegistrationQueue(competitionId, userId),
    refetchInterval: (query) =>
      query.state.data?.processing === false ? false : QUEUE_POLL_INTERVAL_MS,
    // The queue answers the same thing on every poll, which on its own would not re-render us and
    //   so never update the poll count.
    notifyOnChangeProps: ["data", "dataUpdatedAt"],
  });

  const queuePollCount =
    queryClient.getQueryState(queueQueryKey)?.dataUpdateCount ?? 0;

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
    <Dialog.Root open role="alertdialog" placement="center">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {t("competitions.registration_v2.register.processing")}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="3">
                {queuePollCount > 1 && (
                  <Alert.Root status="warning">
                    <Alert.Indicator />
                    <Alert.Title>
                      {t(
                        "competitions.registration_v2.register.processing_longer",
                      )}
                    </Alert.Title>
                  </Alert.Root>
                )}
                {(queueStatus?.queue_count ?? 0) > 0 && (
                  <Alert.Root status="warning">
                    <Alert.Indicator />
                    <Alert.Title>
                      {t(
                        "competitions.registration_v2.register.processing_queue",
                        { queueCount: queueStatus?.queue_count },
                      )}
                    </Alert.Title>
                  </Alert.Root>
                )}
              </Stack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
