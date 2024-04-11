import { createContext } from 'react';

export const UserContext = createContext({
  user: null,
  preferredEvents: null,
});
