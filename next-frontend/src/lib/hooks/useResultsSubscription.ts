import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createConsumer } from "@rails/actioncable";
import { components } from "@/types/openapi";

export const CONNECTION_STATE_INITIALIZED = "initialized";
export const CONNECTION_STATE_CONNECTED = "connected";
export const CONNECTION_STATE_DISCONNECTED = "disconnected";

export type ConnectionState =
  | typeof CONNECTION_STATE_INITIALIZED
  | typeof CONNECTION_STATE_CONNECTED
  | typeof CONNECTION_STATE_DISCONNECTED;

export const CONNECTION_COLORS = {
  [CONNECTION_STATE_INITIALIZED]: "yellow",
  [CONNECTION_STATE_CONNECTED]: "green",
  [CONNECTION_STATE_DISCONNECTED]: "red",
};

// Move this to something like https://www.asyncapi.com
// The actual compression will happen in https://github.com/thewca/worldcubeassociation.org/pull/13352
// But I need the mapping logic
export type CompressedLiveResult = {
  advancing: boolean;
  advancing_questionable: boolean;
  average: number;
  best: number;
  average_record_tag: string;
  single_record_tag: string;
  registration_id: number;
  live_attempts: {
    value: number;
    attempt_number: number;
  }[];
};

export type DiffedLiveResult = Partial<CompressedLiveResult> &
  Pick<components["schemas"]["LiveResult"], "registration_id">;

export type DiffProtocolResponse = {
  updated?: DiffedLiveResult[];
  deleted?: number[];
  created?: CompressedLiveResult[];
  before_hash: string;
  after_hash: string;
  wcif_id: string;
};

export default function useResultsSubscriptions(
  roundIds: string[],
  onReceived: (roundId: string, data: DiffProtocolResponse) => void,
) {
  const [connectionStates, setConnectionStates] = useState<
    Record<string, ConnectionState>
  >(() =>
    Object.fromEntries(
      roundIds.map((id) => [id, CONNECTION_STATE_INITIALIZED]),
    ),
  );

  // Stable ref so onReceived doesn't retrigger the effect
  const onReceivedRef = useRef(onReceived);
  useLayoutEffect(() => {
    onReceivedRef.current = onReceived;
  });

  useEffect(() => {
    const cable = createConsumer("http://localhost:3000/cable");

    const subscriptions = roundIds.map((roundId) =>
      cable.subscriptions.create(
        { channel: "LiveResultsChannel", round_id: roundId },
        {
          received: (data: DiffProtocolResponse) =>
            onReceivedRef.current(roundId, data),
          initialized: () =>
            setConnectionStates((prev) => ({
              ...prev,
              [roundId]: CONNECTION_STATE_INITIALIZED,
            })),
          connected: () =>
            setConnectionStates((prev) => ({
              ...prev,
              [roundId]: CONNECTION_STATE_CONNECTED,
            })),
          disconnected: () =>
            setConnectionStates((prev) => ({
              ...prev,
              [roundId]: CONNECTION_STATE_DISCONNECTED,
            })),
        },
      ),
    );

    return () => subscriptions.forEach((s) => s.unsubscribe());
  }, [roundIds]); // roundIds should be stable (useMemo at call site)

  // Aggregate: worst state wins
  const values = Object.values(connectionStates);
  return values.includes(CONNECTION_STATE_DISCONNECTED)
    ? CONNECTION_STATE_DISCONNECTED
    : values.every((s) => s === CONNECTION_STATE_CONNECTED)
      ? CONNECTION_STATE_CONNECTED
      : CONNECTION_STATE_INITIALIZED;
}
