import { Message } from 'semantic-ui-react';
import React, { useEffect } from 'react';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import I18n from '../../../lib/i18n';

/** To show multiple messages, use `showMessages` instead. */
export const showMessage = (key, type, params) => ({
  newMessages: [{ key, type, params }],
});

export const showMessages = (messages) => ({ newMessages: messages });

export const clearAllMessages = () => ({ messages: [] });

const clearMessage = (id) => ({ toClear: [id] });

const clearMessages = (ids) => ({ toClear: ids });

export default function RegistrationMessage() {
  const { messages } = useStore();
  const dispatch = useDispatch();

  const nonNegativeMessages = messages.filter(({ type }) => type !== 'negative');

  useEffect(() => {
    if (nonNegativeMessages.length > 0) {
      const timer = setTimeout(() => {
        // some may already be cleared by an earlier timeout; that's fine
        dispatch(clearMessages(nonNegativeMessages.map(({ id }) => id)));
      }, 4000);

      return () => clearTimeout(timer);
    }

    // Nothing to time means nothing to clear
    return undefined;
  }, [dispatch, nonNegativeMessages]);

  if (messages.length === 0) return null;

  return messages.map(({
    id, key, type, params,
  }) => (
    <Message
      key={id}
      style={{ margin: messages.length === 1 ? 0 : undefined }}
      positive={type === 'positive'}
      negative={type === 'negative'}
      onDismiss={type === 'negative' ? (() => dispatch(clearMessage(id))) : undefined}
    >
      {I18n.t(key, params)}
    </Message>
  ));
}
