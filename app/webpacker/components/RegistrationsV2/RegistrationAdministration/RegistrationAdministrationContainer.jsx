import React from 'react';
import { useQuery } from '@tanstack/react-query';
import getCompetitionInfo from '../api/competition/get_competition_info';
import RegistrationAdministrationList from './RegistrationAdministrationList';
import Loading from '../../Requests/Loading';

export default function RegistrationAdministrationContainer({ competitionId }) {
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
    onError: () => {
     dispatchStore(setMessage(
       // i18n-tasks-use t('competitions.errors.cant_load_competition_info')
       // eslint-disable-next-line quotes
       `competitions.errors.cant_load_competition_info`,
       'negative',
    ));
  };

  return isCompetitionInfoLoading ? (
    <Loading />
  ) : (
    <RegistrationAdministrationList
      competitionInfo={competitionInfo}
      refetchCompetitionInfo={refetchCompetitionInfo}
    />
  );
}
