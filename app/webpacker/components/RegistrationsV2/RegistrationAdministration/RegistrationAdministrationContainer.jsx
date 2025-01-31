import React from 'react';
import getCompetitionInfo from '../api/competition/get_competition_info';
import RegistrationAdministrationList from './RegistrationAdministrationList';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getAllRegistrations } from '../api/registration/get/get_registrations';
import Loading from '../../Requests/Loading';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { bulkUpdateRegistrations } from '../api/registration/patch/update_registration';
import disableAutoAccept from '../api/registration/patch/auto_accept';
import { setMessage } from '../Register/RegistrationMessage';

export default function RegistrationAdministrationContainer({ competitionId }) {
  const dispatchStore = useDispatch();

  console.log("comp id")
  console.log(competitionId)

  const fetchCompetitionInfo = async () => {
    console.log("Query function running for:", competitionId);
    return getCompetitionInfo(competitionId);
  };

  const compInfoQuery = useQuery({
    queryKey: ['competitionInfo', 'test'],
    queryFn: fetchCompetitionInfo,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1,
    refetchOnMount: 'always',
    retry: false,
    onError: (err) => {
      const { errorCode } = err;
      dispatchStore(setMessage(
        `competitions.errors.cant_load_competition_info`,
        'negative',
      ));
    },
  });

  console.log("info query")
  console.log(compInfoQuery)
  console.log("comp info query data:")
  console.log(compInfoQuery)

  // const {
  //   isLoading: isCompetitionInfoLoading,
  //   data: competitionInfo,
  //   refetchCompetitionInfo,
  // } = useQuery({
  const {
    isLoading: isRegistrationsLoading,
    data: registrations,
    refetch,
  } = useQuery({
    queryKey: ['registrations-admin', competitionInfo?.id],
    queryFn: () => getAllRegistrations(competitionInfo),
    enabled: !!competitionInfo,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
    retry: false,
    onError: (err) => {
      const { errorCode } = err;
      dispatchStore(setMessage(
        errorCode
          ? `competitions.registration_v2.errors.${errorCode}`
          : 'registrations.flash.failed',
        'negative',
      ));
    },
  });

  const { mutate: disableAutoAcceptMutation, isPending: isUpdating } = useMutation({
    mutationFn: disableAutoAccept,
    onError: () => {
      dispatchStore(setMessage(
        'competitions.registration_v2.auto_accept.cant_disable',
        'negative',
      ));
    },
    onSuccess: async () => {
      dispatchStore(setMessage('competitions.registration_v2.auto_accept.disabled', 'positive'));
      await refetchCompetitionInfo();
    },
  });

  const { mutate: updateRegistrationMutation, isPending: isMutating } = useMutation({
    mutationFn: bulkUpdateRegistrations,
    onError: (data) => {
      const { error } = data.json;
      dispatchStore(setMessage(
        Object.values(error).map((err) => `competitions.registration_v2.errors.${err}`),
        'negative',
      ));
    },
    onSuccess: async () => {
      // If multiple organizers approve people at the same time,
      // or if registrations are still coming in while organizers approve them
      // we want the data to be refreshed. Optimal solution would be subscribing to changes
      // via graphql/websockets, but we aren't there yet
      await refetch();
    },
  });


  console.log("isCompetitionInfoLoading")
  console.log(isCompetitionInfoLoading)
  console.log("comp info - container")
  console.log(competitionInfo)

  return (isRegistrationsLoading || isCompetitionInfoLoading) ? (
    <Loading />
  ) : <RegistrationAdministrationList
        competitionInfo={competitionInfo}
        registrations={registrations}
        disableAutoAcceptMutation={disableAutoAcceptMutation}
        updateRegistrationMutation={updateRegistrationMutation}
  />
}
