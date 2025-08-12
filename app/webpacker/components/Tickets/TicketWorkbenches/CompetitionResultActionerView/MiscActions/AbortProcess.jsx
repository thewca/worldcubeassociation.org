import React, { useState } from 'react';
import { Button, Confirm, Popup } from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsCompetitionResultStatuses } from '../../../../../lib/wca-data.js.erb';
import clearResultsSubmission from '../../../api/competitionResult/clearResultsSubmission';
import Loading from '../../../../Requests/Loading';
import Errored from '../../../../Requests/Errored';

export default function AbortProcess({ ticketDetails }) {
  const { ticket: { id, metadata: { status, competition_id: competitionId } } } = ticketDetails;
  const [confirmAbort, setConfirmAbort] = useState();

  const queryClient = useQueryClient();
  const {
    mutate: clearResultsSubmissionMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: clearResultsSubmission,
    onSuccess: () => queryClient.setQueryData(
      ['ticket-details', id],
      (oldTicketDetails) => ({
        ...oldTicketDetails,
        ticket: {
          ...oldTicketDetails.ticket,
          metadata: {
            ...oldTicketDetails.ticket.metadata,
            status: ticketsCompetitionResultStatuses.aborted,
          },
        },
      }),
    ),
  });

  // Result Process can be aborted before the inbox results are merged.
  const canAbort = [
    ticketsCompetitionResultStatuses.submitted,
    ticketsCompetitionResultStatuses.locked_for_posting,
    ticketsCompetitionResultStatuses.warnings_verified,
  ].includes(status);

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

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
        onConfirm={() => {
          setConfirmAbort(false);
          clearResultsSubmissionMutate({ competitionId });
        }}
        content="Are you sure you want to abort the process and allow Delegates to resubmit results?"
      />
    </>
  );
}
