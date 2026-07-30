import React from 'react';
import { Message, Table } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import { getMediumDateString } from '../../../../lib/utils/dates';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import getUpcomingResults from './api/getUpcomingResults';

export default function UpcomingResults() {
  const {
    data: upcomingCompetitions, isPending, isError, error,
  } = useQuery({
    queryKey: ['upcomingResults'],
    queryFn: getUpcomingResults,
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  if (!upcomingCompetitions || upcomingCompetitions.length === 0) {
    return <Message info>No upcoming results</Message>;
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
        {upcomingCompetitions.map((comp) => (
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
