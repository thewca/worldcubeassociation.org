import React from 'react';
import { Button } from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ResultsPreview } from './ResultsPreview';
import mergeTemporaryResults from '../../api/competitionResult/mergeTemporaryResults';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';

export default function MergeTemporaryResults({ ticketDetails }) {
  const { ticket: { id, metadata: { competition_id: competitionId } } } = ticketDetails;

  const queryClient = useQueryClient();
  const {
    mutate: mergeTemporaryResultsMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: () => mergeTemporaryResults({ ticketId: id }),
    onSuccess: () => {
      queryClient.setQueryData(
        ['ticket-details', id],
        (oldTicketDetails) => ({
          ...oldTicketDetails,
          ticket: {
            ...oldTicketDetails.ticket,
            metadata: {
              ...oldTicketDetails.ticket.metadata,
              status: ticketsCompetitionResultStatuses.merged_temporary_results,
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
      <Button onClick={mergeTemporaryResultsMutate}>
        Merge Temporary Results
      </Button>
    </>
  );
}
