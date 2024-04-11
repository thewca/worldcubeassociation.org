import { createContext } from 'react';

export const RegistrationContext = createContext({
  registration: null,
  refetch: () => {},
  isRegistered: false,
});
