import React from 'react';
import { Button } from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ResultsPreview } from './ResultsPreview';
import mergeInboxScrambles from '../../api/competitionResult/mergeInboxScrambles';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';

export default function MergeInboxScrambles({ ticketDetails, currentStakeholder }) {
  const { ticket: { id, metadata: { competition_id: competitionId } } } = ticketDetails;

  const queryClient = useQueryClient();
  const {
    mutate: mergeInboxScramblesMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: mergeInboxScrambles,
    onSuccess: () => {
      queryClient.setQueryData(
        ['ticket-details', id],
        (oldTicketDetails) => ({
          ...oldTicketDetails,
          ticket: {
            ...oldTicketDetails.ticket,
            metadata: {
              ...oldTicketDetails.ticket.metadata,
              status: ticketsCompetitionResultStatuses.merged_inbox_scrambles,
            },
          },
        }),
      );
      queryClient.setQueryData(['imported-temporary-scrambles', competitionId], []);
    },
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <ResultsPreview competitionId={competitionId} />
      <Button onClick={() => mergeInboxScramblesMutate({
        ticketId: id,
        actingStakeholderId: currentStakeholder.id,
      })}
      >
        Merge Inbox Scrambles
      </Button>
    </>
  );
}
