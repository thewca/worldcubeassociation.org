import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { List, Message } from 'semantic-ui-react';
import newcomerNameFormatCheck from './api/newcomerNameFormatCheck';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import I18n from '../../lib/i18n';

export default function NameFormatChecker({ competitionId }) {
  const {
    data: nameFormatChecks, isLoading, isError, error,
  } = useQuery({
    queryKey: ['newcomer-name-format-checks', competitionId],
    queryFn: () => newcomerNameFormatCheck({ competitionId }),
  });

  if (isLoading) return <Loading />;
  if (isError) return <Errored error={error} />;
  if (nameFormatChecks.length === 0) {
    return <Message positive>All names looks good. Thanks for checking.</Message>;
  }

  return (
    <List celled>
      {nameFormatChecks.map(({ id, args }) => (
        <List.Item>
          {I18n.t(`validators.persons.${id}`, args)}
        </List.Item>
      ))}
    </List>
  );
}
