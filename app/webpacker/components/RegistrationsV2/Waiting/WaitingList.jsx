import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Table, TableFooter } from 'semantic-ui-react';
import { getWaitingCompetitors } from '../api/registration/get/get_registrations';
import useWithUserData from '../hooks/useWithUserData';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from '../Register/RegistrationMessage';
import Loading from '../../Requests/Loading';

export default function WaitingList({ competitionInfo }) {
  const dispatch = useDispatch();
  const { isLoading: waitingLoading, data: waiting } = useQuery({
    queryKey: ['waiting', competitionInfo.id],
    queryFn: () => getWaitingCompetitors(competitionInfo.id),
    retry: false,
    onError: (data) => {
      const { error } = data.json;
      dispatch(setMessage(
        data
          ? `competitions.registration_v2.errors.${error}`
          : 'registrations.flash.failed',
        'negative',
      ));
    },
  });

  const { isLoading: infoLoading, data: registrationsWithUser } = useWithUserData(waiting ?? []);

  return waitingLoading || infoLoading ? (
    <Loading />
  ) : (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Position</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {registrationsWithUser?.length ? (
          registrationsWithUser
            .toSorted(
              (w1, w2) => w1.waiting_list_position - w2.waiting_list_position,
            ) // We just care about the order of the waitlisted competitors
            .map((w, i) => (
              <Table.Row key={w.user_id}>
                <Table.Cell>{w.user.name}</Table.Cell>
                <Table.Cell>
                  {w.waiting_list_position === 0 ? 'Not yet assigned' : i + 1}
                </Table.Cell>
              </Table.Row>
            ))
        ) : (
          <TableFooter>No one on the Waiting List.</TableFooter>
        )}
      </Table.Body>
    </Table>
  );
}
