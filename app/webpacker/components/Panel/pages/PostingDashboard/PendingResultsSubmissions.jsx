import React from 'react';
import { Message, Table } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import { getMediumDateString } from '../../../../lib/utils/dates';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import getPendingResultsSubmissions from './api/getPendingResultsSubmissions';

export default function PendingResultsSubmissions() {
  const {
    data: pendingCompetitions, isPending, isError, error,
  } = useQuery({
    queryKey: ['pendingResultsSubmissions'],
    queryFn: getPendingResultsSubmissions,
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  if (!pendingCompetitions || pendingCompetitions.length === 0) {
    return <Message info>No pending results submissions</Message>;
  }

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Competition</Table.HeaderCell>
          <Table.HeaderCell>End Date</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {pendingCompetitions.map((comp) => (
          <Table.Row key={comp.id}>
            <Table.Cell>
              {comp.name}
            </Table.Cell>
            <Table.Cell>
              {getMediumDateString(comp.end_date)}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
