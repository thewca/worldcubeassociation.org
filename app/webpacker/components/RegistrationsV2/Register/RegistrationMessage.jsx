import { Message, Sticky } from 'semantic-ui-react';
import React, { useEffect } from 'react';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import I18n from '../../../lib/i18n';

export const setMessage = (key, type, params) => ({
  payload: {
    key,
    type,
    params,
  },
});

export default function RegistrationMessage({ parentRef }) {
  const { message } = useStore();
  const dispatch = useDispatch();

  useEffect(() => {
    if (message?.key) {
      setTimeout(() => {
        dispatch({ payload: { message: null } });
      }, 4000);
    }
  }, [dispatch, message]);

  if (!message?.key) return null;

  return (
    <div ref={parentRef}>
      <Sticky active context={parentRef}>
        <Message
          positive={message.type === 'positive'}
          negative={message.type === 'negative'}
        >
          {I18n.t(message.key, message.params)}
        </Message>
      </Sticky>
    </div>
  );
}
