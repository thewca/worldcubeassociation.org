import React, {
  createContext, useContext, useMemo, useReducer,
} from 'react';

const StoreContext = createContext();

export default function StoreProvider({ children, reducer, initialState }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const store = useMemo(() => ({
    state,
    dispatch,
  }), [state, dispatch]);

  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
