const messageReducer = (state, { payload }) => ({
  ...state,
  message: { key: payload.key, type: payload.type, params: payload.params },
});

export default messageReducer;
