const messageReducer = (state, { messages, newMessages, toClear }) => {
  const nextId = state.nextId ?? 0
  // overwrite existing messages
  if (messages) {
    const messagesWithId = messages.map((message, index) => (
      { ...message, id: nextId + index }
    ));
    return {
      ...state,
      messages: messagesWithId,
      nextId: nextId + messages.length,
    };
  }

  // append new messages to existing messages
  if (newMessages) {
    const newMessagesWithId = newMessages.map((message, index) => (
      { ...message, id: nextId + index }
    ))
    return {
      ...state,
      messages: [...state.messages, ...newMessagesWithId],
      nextId: nextId + newMessages.length,
    };
  }

  // clear certain messages
  if (toClear) {
    const filteredMessages = state.messages.filter(({ id }) => !toClear.includes(id));
    return { ...state, messages: filteredMessages };
  }

  return state;
};

export default messageReducer;
