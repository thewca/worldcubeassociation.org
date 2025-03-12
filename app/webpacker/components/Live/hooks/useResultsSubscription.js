import { useEffect, useState } from 'react';
import { createConsumer } from '@rails/actioncable';

export const CONNECTION_STATE_INITIALIZED = 'initialized';
export const CONNECTION_STATE_CONNECTED = 'connected';
export const CONNECTION_STATE_DISCONNECTED = 'disconnected';

export const CONNECTION_COLORS = {
  [CONNECTION_STATE_INITIALIZED]: 'yellow',
  [CONNECTION_STATE_CONNECTED]: 'green',
  [CONNECTION_STATE_DISCONNECTED]: 'red',
};

export default function useResultsSubscription(roundId, onReceived) {
  const [connectionState, setConnectionState] = useState();

  useEffect(() => {
    const cable = createConsumer();

    const subscription = cable.subscriptions.create(
      { channel: 'LiveResultsChannel', round_id: roundId },
      {
        received: onReceived,
        initialized: () => setConnectionState(CONNECTION_STATE_INITIALIZED),
        connected: () => setConnectionState(CONNECTION_STATE_CONNECTED),
        disconnected: () => setConnectionState(CONNECTION_STATE_DISCONNECTED),
      },
    );

    return () => subscription.unsubscribe();
  }, [roundId, onReceived]);

  return connectionState;
}
