import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button, Confirm,
} from 'semantic-ui-react';
import rejectClaimWcaId from '../../api/claimWcaId/rejectClaimWcaId';
import { updateTicketMetadata } from '../../../../lib/helpers/update-ticket-query-data';
import { ticketStatuses } from '../../../../lib/wca-data.js.erb';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';

export default function RejectView({
  ticketId, currentStakeholder, onSuccess, disabled,
}) {
  const queryClient = useQueryClient();
  const [showRejectConfirm, setShowRejectConfirm] = useState();

  const {
    mutate: rejectClaimWcaIdMutate,
    isPending: isRejecting,
    isError: isRejectError,
    error: rejectError,
  } = useMutation({
    mutationFn: rejectClaimWcaId,
    onSuccess: () => {
      onSuccess();
      queryClient.setQueryData(
        ['ticket-details', ticketId],
        (oldTicketDetails) => updateTicketMetadata(
          oldTicketDetails,
          'status',
          ticketStatuses.claim_wca_id.closed,
        ),
      );
    },
  });

  if (isRejecting) return <Loading />;
  if (isRejectError) return <Errored error={rejectError} />;

  return (
    <>
      <Button
        negative
        onClick={() => setShowRejectConfirm(true)}
        disabled={disabled}
      >
        Reject
      </Button>

      <Confirm
        open={showRejectConfirm}
        content="You are about to reject the WCA ID claim. Are you sure?"
        onCancel={() => setShowRejectConfirm(false)}
        onConfirm={() => {
          rejectClaimWcaIdMutate({
            ticketId,
            actingStakeholderId: currentStakeholder.id,
          });
          setShowRejectConfirm(false);
        }}
      />
    </>
  );
}
