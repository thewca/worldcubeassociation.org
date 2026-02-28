import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button, Confirm,
} from 'semantic-ui-react';
import approveClaimWcaId from '../../api/claimWcaId/approveClaimWcaId';
import { updateTicketMetadata } from '../../../../lib/helpers/update-ticket-query-data';
import { ticketStatuses } from '../../../../lib/wca-data.js.erb';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';

export default function ApproveView({
  ticketId, currentStakeholder, onSuccess, disabled,
}) {
  const queryClient = useQueryClient();
  const [showApproveConfirm, setShowApproveConfirm] = useState();

  const {
    mutate: approveClaimWcaIdMutate,
    isPending: isApproving,
    isError: isApproveError,
    error: approveError,
  } = useMutation({
    mutationFn: approveClaimWcaId,
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

  if (isApproving) return <Loading />;
  if (isApproveError) return <Errored error={approveError} />;

  return (
    <>
      <Button
        positive
        onClick={() => setShowApproveConfirm(true)}
        disabled={disabled}
      >
        Approve
      </Button>

      <Confirm
        open={showApproveConfirm}
        content="You are about to approve the WCA ID claim. This will also remove all other claims for this WCA ID. Are you sure you want to continue?"
        onCancel={() => setShowApproveConfirm(false)}
        onConfirm={() => {
          approveClaimWcaIdMutate({
            ticketId,
            actingStakeholderId: currentStakeholder.id,
          });
          setShowApproveConfirm(false);
        }}
      />
    </>
  );
}
