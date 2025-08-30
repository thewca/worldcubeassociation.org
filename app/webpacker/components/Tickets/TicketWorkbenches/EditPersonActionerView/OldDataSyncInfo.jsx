import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Button, Message } from 'semantic-ui-react';
import syncEditPersonRequest from '../../api/editPerson/syncEditPersonRequest';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';

export default function OldDataSyncInfo({ ticketDetails, currentStakeholder }) {
  const {
    ticket: {
      id,
      metadata: {
        tickets_edit_person_fields: ticketsEditPersonFields,
        person,
      },
    },
  } = ticketDetails;

  const queryClient = useQueryClient();
  const {
    mutate: syncEditPersonRequestMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: syncEditPersonRequest,
    onSuccess: (syncedTicketDetails) => {
      queryClient.setQueryData(
        ['ticket-details', id],
        (oldTicketDetails) => ({ ...oldTicketDetails, ticket: syncedTicketDetails }),
      );
    },
  });

  const personsDataSynced = useMemo(() => ticketsEditPersonFields.every(
    (field) => field.old_value === person[field.field_name],
  ), [person, ticketsEditPersonFields]);

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;
  if (personsDataSynced) return null;

  return (
    <Message error>
      The old data provided here is not in sync with actual person data.
      <Button
        onClick={() => syncEditPersonRequestMutate({
          ticketId: id,
          actingStakeholderId: currentStakeholder.id,
        })}
      >
        Sync Now
      </Button>
    </Message>
  );
}
