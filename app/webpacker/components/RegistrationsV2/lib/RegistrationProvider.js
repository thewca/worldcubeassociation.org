import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import { setMessage } from '../Register/RegistrationMessage';
import pollRegistrations from '../api/registration/get/poll_registrations';

const REFETCH_INTERVAL = 3000;

const RegistrationContext = createContext();

export default function RegistrationProvider({ competitionInfo, userInfo, children }) {
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollCounter, setPollCounter] = useState(0);

  const startProcessing = useCallback(() => {
    setIsProcessing(true);
  }, [setIsProcessing]);

  const { data: pollingData } = useQuery({
    queryKey: ['registration-status-polling', userInfo.id, competitionInfo.id],
    queryFn: async () => pollRegistrations(userInfo.id, competitionInfo),
    refetchInterval: REFETCH_INTERVAL,
    onSuccess: () => {
      setPollCounter(pollCounter + 1);
    },
    enabled: isProcessing,
  });

  useEffect(() => {
    if (pollingData && !pollingData.processing) {
      setIsProcessing(false);
    }
  }, [pollingData]);

  const {
    data: registration,
    isFetching,
    refetch: refetchRegistration,
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

  const value = useMemo(() => ({
    isRegistered,
    isAccepted,
    isRejected,
    hasPaid,
    registration,
    refetchRegistration,
    isFetching,
    isProcessing,
    startProcessing,
    queueCount: pollingData?.queue_count,
  }), [
    hasPaid,
    isAccepted,
    isFetching,
    isProcessing,
    isRegistered,
    isRejected,
    pollingData?.queue_count,
    refetchRegistration,
    registration,
    startProcessing]);

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
