import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Message, Table } from 'semantic-ui-react';
import newcomerNameFormatCheck from './api/newcomerNameFormatCheck';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import I18n from '../../lib/i18n';

export default function NameFormatChecker({ competitionId, setUserIdToEdit }) {
  const {
    data: nameFormatChecks, isFetching, isError, error,
  } = useQuery({
    queryKey: ['newcomer-name-format-checks', competitionId],
    queryFn: () => newcomerNameFormatCheck({ competitionId }),
  });

  if (isFetching) return <Loading />;
  if (isError) return <Errored error={error} />;
  if (nameFormatChecks.length === 0) {
    return <Message positive>All names looks good. Thanks for checking.</Message>;
  }

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Warning message</Table.HeaderCell>
          <Table.HeaderCell>Action</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {nameFormatChecks.flatMap(({ id, issues }) => issues.map(({ id: issueId, args }) => (
          <Table.Row>
            <Table.Cell>{I18n.t(`validators.persons.${issueId}`, args)}</Table.Cell>
            <Table.Cell>
              <Button onClick={() => setUserIdToEdit(id)}>
                Edit
              </Button>
            </Table.Cell>
          </Table.Row>
        )))}
      </Table.Body>
    </Table>
  );
}
