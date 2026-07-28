import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Confirm } from 'semantic-ui-react';
import approveEditPersonRequest from '../../api/editPerson/approveEditPersonRequest';
import { updateTicketMetadata } from '../../../../lib/helpers/update-ticket-query-data';
import { ticketStatuses } from '../../../../lib/wca-data.js.erb';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';

export default function ApproveView({ ticketId, currentStakeholder }) {
  const queryClient = useQueryClient();
  const [changeType, setChangeType] = useState();

  const {
    mutate: approveEditPersonRequestMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: approveEditPersonRequest,
    onSuccess: () => {
      queryClient.setQueryData(
        ['ticket-details', ticketId],
        (oldTicketDetails) => updateTicketMetadata(
          oldTicketDetails,
          'status',
          ticketStatuses.edit_person.closed,
        ),
      );
    },
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <Button
        positive
        onClick={() => setChangeType('fix')}
      >
        Execute as Fix
      </Button>
      <Button
        positive
        onClick={() => setChangeType('update')}
      >
        Execute as Update
      </Button>
      <Confirm
        open={!!changeType}
        content={`You are about to approve the request as ${changeType}. Are you sure?`}
        onCancel={() => setChangeType(null)}
        onConfirm={() => {
          approveEditPersonRequestMutate({
            ticketId,
            actingStakeholderId: currentStakeholder.id,
            changeType,
          });
          setChangeType(null);
        }}
      />
    </>
  );
}
