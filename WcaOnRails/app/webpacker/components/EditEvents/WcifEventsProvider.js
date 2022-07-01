import React, { createContext, useContext } from 'react';

const WcifEventsContext = createContext([]);

export default function WcifEventsProvider({ children }) {
  return (
    <WcifEventsContext.Provider value={useWcifEvents}>
      {children}
    </WcifEventsContext.Provider>
  );
};

export const useWcifEvents = () => useContext(WcifEventsContext);
