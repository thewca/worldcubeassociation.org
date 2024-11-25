import React, { createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import { setMessage } from '../Register/RegistrationMessage';

const RegistrationContext = createContext();

export default function RegistrationProvider({ competitionInfo, userInfo, children }) {
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    data: registration,
    isFetching,
    refetchRegistration,
  } = useQuery({
    queryKey: ['registration', competitionInfo.id, userInfo.id],
    queryFn: () => getSingleRegistration(userInfo.id, competitionInfo),
    onError: (error) => {
      dispatch(
        setMessage(
          `competitions.registration_v2.errors.${error?.response?.data?.json?.error || 'unknown'}`,
          'negative',
        ),
      );
    },
  });

  const isRegistered = Boolean(registration) && registration.competing.registration_status !== 'cancelled';
  const isAccepted = isRegistered && registration.competing.registration_status === 'accepted';
  const isRejected = isRegistered && registration.competing.registration_status === 'rejected';
  const hasPaid = registration?.payment?.has_paid;

  const value = {
    isRegistered,
    isAccepted,
    isRejected,
    hasPaid,
    registration,
    refetchRegistration,
    isFetching,
    isProcessing,
    setIsProcessing,
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
}

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
