import { useEffect } from 'react';
import { createConsumer } from '@rails/actioncable';

export default function useResultsSubscription(roundId, onReceived) {
  return useEffect(() => {
    const cable = createConsumer();

    const subscription = cable.subscriptions.create(
      { channel: 'LiveResultsChannel', round_id: roundId },
      { received: onReceived },
    );

    return () => subscription.unsubscribe();
  }, [roundId, onReceived]);
}
