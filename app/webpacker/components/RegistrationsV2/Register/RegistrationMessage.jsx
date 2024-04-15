import { Message, Sticky } from 'semantic-ui-react';
import React, { useEffect } from 'react';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import I18n from '../../../lib/i18n';

export const setMessage = (key, type) => ({
  type: 'registration_message',
  payload: {
    key,
    type,
  },
});

export default function RegistrationMessage() {
  const { message } = useStore();
  const dispatch = useDispatch();

  useEffect(() => {
    if (message) {
      setTimeout(() => {
        dispatch(setMessage(''));
      }, 4000);
    }
  }, [dispatch, message]);

  if (!message) return null;

  return (
    <Sticky>
      <Message
        positive={message.type === 'positive'}
        negative={message.type === 'negative'}
      >
        {I18n.t(message.key)}
      </Message>
    </Sticky>
  );
}
