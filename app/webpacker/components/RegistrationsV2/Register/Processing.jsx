import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Message, Modal } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import pollRegistrations from '../api/registration/get/poll_registrations';

const REFETCH_INTERVAL = 3000;

export default function Processing({ competitionInfo, user, onProcessingComplete }) {
  const [pollCounter, setPollCounter] = useState(0);

  const { data } = useQuery({
    queryKey: ['registration-status-polling', user.id, competitionInfo.id],
    queryFn: async () => pollRegistrations(user.id, competitionInfo),
    refetchInterval: REFETCH_INTERVAL,
    onSuccess: () => {
      setPollCounter(pollCounter + 1);
    },
  });
  useEffect(() => {
    if (
      data
      && (data.status.payment === 'initialized'
        || data.status.competing === 'pending')
    ) {
      onProcessingComplete();
    }
  }, [data, onProcessingComplete]);
  return (
    <Modal open={data?.status?.competing !== 'pending'} dimmer="blurring">
      <Modal.Header>
        {I18n.t('competitions.registration_v2.register.processing')}
      </Modal.Header>
      <Modal.Content>
        {pollCounter > 3 && (
          <Message warning>
            {I18n.t('competitions.registration_v2.register.processing_longer')}
          </Message>
        )}
        {data && data.queueCount > 500 && (
          <Message warning>
            {I18n.t('competitions.registration_v2.register.processing_queue', {
              queueCount: data.queueCount,
            })}
          </Message>
        )}
      </Modal.Content>
    </Modal>
  );
}
