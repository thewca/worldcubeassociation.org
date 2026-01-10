import React, { useState } from 'react';
import { Message } from 'semantic-ui-react';
import { ticketStatuses, ticketStakeholderConnections } from '../../../../lib/wca-data.js.erb';
import ApproveView from './ApproveView';
import RejectView from './RejectView';
import TransferView from './TransferView';

export default function ClaimWcaIdActionerView({ ticketDetails, currentStakeholder }) {
  const { ticket: { id, metadata: { status } } } = ticketDetails;
  const [showSuccess, setShowSuccess] = useState();
  const isAssignee = currentStakeholder.connection === ticketStakeholderConnections.assigned;

  if (showSuccess) {
    return (
      <Message
        positive
        onDismiss={() => setShowSuccess(false)}
      >
        Request processed successfully!
      </Message>
    );
  }

  if (status === ticketStatuses.claim_wca_id.closed) {
    return (
      <>
        This request is already handled.
      </>
    );
  }

  return (
    <>
      {!isAssignee && (
        <Message info>
          Only the assigned delegate can approve or reject this request. To proceed, please
          transfer this ticket to yourself using the transfer button below.
        </Message>
      )}
      <ApproveView
        ticketId={id}
        currentStakeholder={currentStakeholder}
        onSuccess={() => setShowSuccess(true)}
        disabled={!isAssignee}
      />
      <RejectView
        ticketId={id}
        currentStakeholder={currentStakeholder}
        onSuccess={() => setShowSuccess(true)}
        disabled={!isAssignee}
      />
      <TransferView
        ticketId={id}
        currentStakeholder={currentStakeholder}
      />
    </>
  );
}
