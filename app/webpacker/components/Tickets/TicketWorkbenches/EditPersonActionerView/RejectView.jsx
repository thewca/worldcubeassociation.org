import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Confirm } from 'semantic-ui-react';
import rejectEditPersonRequest from '../../api/editPerson/rejectEditPersonRequest';
import Errored from '../../../Requests/Errored';
import Loading from '../../../Requests/Loading';
import { ticketStatuses } from '../../../../lib/wca-data.js.erb';

export default function RejectView({ ticketId, currentStakeholder }) {
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState();

  const {
    mutate: rejectEditPersonRequestMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: rejectEditPersonRequest,
    onSuccess: () => {
      queryClient.setQueryData(
        ['ticket-details', ticketId],
        (oldTicketDetails) => ({
          ...oldTicketDetails,
          ticket: {
            ...oldTicketDetails.ticket,
            metadata: {
              ...oldTicketDetails.ticket.metadata,
              status: ticketStatuses.edit_person.closed,
            },
          },
        }),
      );
    },
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <Button
        negative
        onClick={() => setShowConfirm(true)}
      >
        Reject Edit Request
      </Button>
      <Confirm
        open={showConfirm}
        content="You are about to reject the request. Are you sure?"
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          rejectEditPersonRequestMutate({
            ticketId,
            actingStakeholderId: currentStakeholder.id,
          });
          setShowConfirm(false);
        }}
      />
    </>
  );
}
