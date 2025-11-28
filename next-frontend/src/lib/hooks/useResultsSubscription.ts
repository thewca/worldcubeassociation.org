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

export default function useResultsSubscription(
  roundId: number,
  onReceived: (data: components["schemas"]["LiveResult"]) => void,
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
