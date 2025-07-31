import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, List } from 'semantic-ui-react';
import getInboxPersonSummary from '../../api/competitionResult/getInboxPersonSummary';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import { viewUrls } from '../../../../lib/requests/routes.js.erb';

export default function CreateWcaIds({ ticketDetails }) {
  const { ticket: { id, metadata: { competition_id: competitionId } } } = ticketDetails;

  const {
    data: inboxPersonSummary,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inbox-person-summary', id],
    queryFn: () => getInboxPersonSummary({ ticketId: id }),
  });

  if (isFetching) return <Loading />;
  if (isError) return <Errored error={error} />;

  const {
    inbox_person_count: inboxPersonCount,
    inbox_person_no_wca_id_count: inboxPersonNoWcaIdCount,
    result_no_wca_id_count: resultNoWcaIdCount,
  } = inboxPersonSummary;

  return (
    <>
      There are a total of
      {' '}
      {inboxPersonCount}
      {' '}
      entries in InboxPersons pending for this competition.
      <List bulleted>
        <List.Item>
          {inboxPersonNoWcaIdCount}
          {' '}
          entries from InboxPersons for this competition are missing a WCA ID.
        </List.Item>
        <List.Item>
          {resultNoWcaIdCount}
          {' '}
          competitors in the Results table for this competition still have to be assigned a WCA ID.
        </List.Item>
      </List>
      <List>
        <List.Item>
          <Button as="a" primary href={viewUrls.admin.completePersons([competitionId])} target="_blank">
            Assign WCA IDs to newcomers
          </Button>
          Click this button to assign WCA IDs to newcomers.
        </List.Item>
        <List.Item>
          <Button primary onClick={refetch}>
            Refresh
          </Button>
          If you are done with assigning, please click this button.
        </List.Item>
      </List>
    </>
  );
}
