import { useEffect, useState } from "react";
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
  updated: DiffedLiveResult[];
  deleted: number[];
  created: CompressedLiveResult[];
};

export default function useResultsSubscription(
  roundId: number,
  onReceived: (data: DiffProtocolResponse) => void,
) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    CONNECTION_STATE_INITIALIZED,
  );

  useEffect(() => {
    // TODO: Change the Environment variable to not include the /api part by default
    const cable = createConsumer("http://localhost:3000/cable");

    const subscription = cable.subscriptions.create(
      { channel: "LiveResultsChannel", round_id: roundId },
      {
        received: onReceived,
        initialized: () => setConnectionState(CONNECTION_STATE_INITIALIZED),
        connected: () => setConnectionState(CONNECTION_STATE_CONNECTED),
        disconnected: () => setConnectionState(CONNECTION_STATE_DISCONNECTED),
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roundId, onReceived]);

  return connectionState;
}
