import { Message } from 'semantic-ui-react';
import React, { useEffect } from 'react';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import I18n from '../../../lib/i18n';

/**
 * You may pass an array of keys - if so, also pass an
 * array of params of the same length.
 */
export const setMessage = (key, type, params) => ({
  payload: {
    key,
    type,
    params,
  },
});

export const clearMessage = () => ({
  payload: {
    message: null,
  },
});

export default function RegistrationMessage() {
  const { message } = useStore();
  const dispatch = useDispatch();

  useEffect(() => {
    // Don't clear negative Messages automatically
    if (message?.key && message.type !== 'negative') {
      setTimeout(() => {
        dispatch({ payload: { message: null } });
      }, 4000);
    }
  }, [dispatch, message]);

  if (!message?.key) return null;

  if (Array.isArray(message.key)) {
    return message.key.map((key, index) => (
      <Message
        key={key}
        positive={message.type === 'positive'}
        negative={message.type === 'negative'}
      >
        {I18n.t(key, (message.params ?? [])[index] ?? {})}
      </Message>
    ));
  }

  return (
    <Message
      style={{ margin: 0 }}
      positive={message.type === 'positive'}
      negative={message.type === 'negative'}
    >
      {I18n.t(message.key, message.params)}
    </Message>
  );
}
