import React, { useState } from 'react';
import { Button, Confirm, Popup } from 'semantic-ui-react';
import { ticketsCompetitionResultStatuses } from '../../../../../lib/wca-data.js.erb';

export default function AbortProcess({ ticketDetails, updateStatus }) {
  const { ticket: { metadata: { status } } } = ticketDetails;
  const [confirmAbort, setConfirmAbort] = useState();

  // Result Process can be aborted before the inbox results are merged.
  const canAbort = [
    ticketsCompetitionResultStatuses.submitted,
    ticketsCompetitionResultStatuses.locked_for_posting,
    ticketsCompetitionResultStatuses.warnings_verified,
  ].includes(status);

  return (
    <>
      <Popup
        trigger={(
          <div>
            {/* Button wrapped in a div because disabled button does not fire mouse events */}
            <Button
              disabled={!canAbort}
              onClick={() => setConfirmAbort(true)}
            >
              Abort Process
            </Button>
          </div>
      )}
        content={canAbort ? 'Allow Delegate to resubmit results.' : 'Cannot abort at this stage.'}
      />
      <Confirm
        open={confirmAbort}
        onCancel={() => setConfirmAbort(false)}
        onConfirm={() => updateStatus(ticketsCompetitionResultStatuses.aborted)}
        content="Are you sure you want to abort the process and allow Delegates to resubmit results?"
      />
    </>
  );
}
