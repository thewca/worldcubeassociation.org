import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  Header, Segment, Table,
} from 'semantic-ui-react';
import { getWaitingCompetitors } from '../api/registration/get/get_registrations';
import useWithUserData from '../hooks/useWithUserData';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';
import i18n from '../../../lib/i18n';

export default function WaitingList({ competitionInfo }) {
  const { isLoading: waitingLoading, data: waiting, isError } = useQuery({
    queryKey: ['waiting', competitionInfo.id],
    queryFn: () => getWaitingCompetitors(competitionInfo.id),
    retry: false,
  });

  const { isLoading: infoLoading, data: registrationsWithUser } = useWithUserData(waiting ?? []);

  if (isError) {
    return (
      <Errored componentName="WaitingList" />
    );
  }

  return waitingLoading || infoLoading ? (
    <Loading />
  )
    : (
      <Segment>
        <Header>{i18n.t('registrations.list.waiting_list')}</Header>
        { registrationsWithUser.length > 0
          ? (
            <Table collapsing>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Position</Table.HeaderCell>
                  <Table.HeaderCell>{i18n.t('delegates_page.table.name')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {registrationsWithUser
                  .toSorted(
                    (w1, w2) => w1.waiting_list_position - w2.waiting_list_position,
                  ) // We just care about the order of the waitlisted competitors
                  .map((w, i) => (
                    <Table.Row key={w.user_id}>
                      <Table.Cell>
                        {w.waiting_list_position === 0 ? 'Not yet assigned' : i + 1}
                      </Table.Cell>
                      <Table.Cell>{w.user.name}</Table.Cell>
                    </Table.Row>
                  ))}
              </Table.Body>
            </Table>
          ) : 'No one on the Waiting List.'}
      </Segment>
    );
}
