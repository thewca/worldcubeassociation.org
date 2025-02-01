import React from 'react';
import { useQuery } from '@tanstack/react-query';
import getCompetitionInfo from '../api/competition/get_competition_info';
import RegistrationAdministrationList from './RegistrationAdministrationList';
import Loading from '../../Requests/Loading';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from '../Register/RegistrationMessage';

export default function RegistrationAdministrationContainer({ competitionId }) {
  const dispatchStore = useDispatch();

  const fetchCompetitionInfo = async () => getCompetitionInfo(competitionId);

  const {
    isLoading: isCompetitionInfoLoading,
    data: competitionInfo,
    refetch: refetchCompetitionInfo,
  } = useQuery({
    queryKey: ['competitionInfo', 'test'],
    queryFn: fetchCompetitionInfo,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
    retry: false,
    onError: (err) => {
      dispatchStore(setMessage(
        'competitions.errors.cant_load_competition_info',
        'negative',
      ));
    },
  });

  return isCompetitionInfoLoading ? (
    <Loading />
  ) : ( <RegistrationAdministrationList
    competitionInfo={competitionInfo}
    refetchCompetitionInfo={refetchCompetitionInfo}
  /> )
}
