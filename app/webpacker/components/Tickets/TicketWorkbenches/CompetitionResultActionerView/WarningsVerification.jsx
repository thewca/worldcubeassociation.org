import React from 'react';
import { Button } from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import WarningsAndMessage from './WarningsAndMessage';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import verifyWarnings from '../../api/competitionResult/verify_warnings';
import { updateTicketMetadata } from '../../../../lib/helpers/update-ticket-query-data';

export default function WarningsVerification({ ticketDetails, currentStakeholder }) {
  const { ticket: { id } } = ticketDetails;

  const queryClient = useQueryClient();
  const {
    mutate: verifyWarningsMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: verifyWarnings,
    onSuccess: () => {
      queryClient.setQueryData(
        ['ticket-details', id],
        (oldTicketDetails) => ({
          ...oldTicketDetails,
          ticket: {
            ...oldTicketDetails.ticket,
            metadata: {
              ...oldTicketDetails.ticket.metadata,
              status: ticketsCompetitionResultStatuses.merged_inbox_results,
            },
          },
        }),
      );
      queryClient.setQueryData(
        ['ticket-details', id],
        (oldTicketDetails) => updateTicketMetadata(
          oldTicketDetails,
          'status',
          ticketsCompetitionResultStatuses.warnings_verified,
        ),
      );
    },
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;
  return (
    <>
      <WarningsAndMessage
        ticketDetails={ticketDetails}
      />
      <Button
        primary
        onClick={() => verifyWarningsMutate({
          ticketId: id,
          actingStakeholderId: currentStakeholder.id,
        })}
      >
        Warnings verified
      </Button>
    </>
  );
}
