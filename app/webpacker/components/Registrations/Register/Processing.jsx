import React from 'react';
import { Message, Modal } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import { useRegistration } from '../lib/RegistrationProvider';

export default function Processing() {
  const { pollCounter, queueCount } = useRegistration();

  return (
    <Modal open dimmer="blurring">
      <Modal.Header>
        {I18n.t('competitions.registration_v2.register.processing')}
      </Modal.Header>
      <Modal.Content>
        {pollCounter > 1 && (
          <Message warning>
            {I18n.t('competitions.registration_v2.register.processing_longer')}
          </Message>
        )}
        {queueCount > 0 && (
          <Message warning>
            {I18n.t('competitions.registration_v2.register.processing_queue', {
              queueCount,
            })}
          </Message>
        )}
      </Modal.Content>
    </Modal>
  );
}
