import React from 'react';
import { Button } from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ResultsPreview } from './ResultsPreview';
import mergeInboxResults from '../../api/competitionResult/mergeInboxResults';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';

export default function MergeInboxResults({ ticketDetails, currentStakeholder }) {
  const { ticket: { id, metadata: { competition_id: competitionId } } } = ticketDetails;

  const queryClient = useQueryClient();
  const {
    mutate: mergeInboxResultsMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: mergeInboxResults,
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
      queryClient.setQueryData(['imported-temporary-results', competitionId], []);
    },
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <ResultsPreview competitionId={competitionId} />
      <Button onClick={() => mergeInboxResultsMutate({
        ticketId: id,
        actingStakeholderId: currentStakeholder.id,
      })}
      >
        Merge Inbox Results
      </Button>
    </>
  );
}
