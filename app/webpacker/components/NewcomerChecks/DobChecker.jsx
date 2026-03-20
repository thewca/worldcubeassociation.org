import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { List, Message } from 'semantic-ui-react';
import newcomerDobCheck from './api/newcomerDobCheck';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import I18n from '../../lib/i18n';

export default function DobChecker({ competitionId }) {
  const {
    data: dobChecks, isLoading, isError, error,
  } = useQuery({
    queryKey: ['newcomer-dob-checks', competitionId],
    queryFn: () => newcomerDobCheck({ competitionId }),
  });

  if (isLoading) return <Loading />;
  if (isError) return <Errored error={error} />;
  if (dobChecks.length === 0) {
    return <Message positive>All DOBs are looking good. Thanks for checking.</Message>;
  }

  return (
    <List celled>
      {dobChecks.map(({ id, args }) => (
        <List.Item>
          {I18n.t(`validators.persons.${id}`, args)}
        </List.Item>
      ))}
    </List>
  );
}
