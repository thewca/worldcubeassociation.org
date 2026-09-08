import React from 'react';
import { Button } from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import ResultsDataPreview from './ResultsDataPreview';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import getImportedTemporaryResults from '../../api/competitionResult/getImportedTemporaryResults';
import getImportedTemporaryScrambles from '../../api/competitionResult/getImportedTemporaryScrambles';
import mergeInboxResults from '../../api/competitionResult/mergeInboxResults';
import mergeInboxScrambles from '../../api/competitionResult/mergeInboxScrambles';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import { ResultRowHeader } from '../../../ResultsData/Results/ResultRowHeader';
import ResultRowBody from '../../../ResultsData/Results/ResultRowBody';
import ScrambleRowHeader from '../../../ResultsData/Scrambles/ScrambleRowHeader';
import ScrambleRowBody from '../../../ResultsData/Scrambles/ScrambleRowBody';

export function MergeInboxResults({ ticketDetails, currentStakeholder }) {
  return (
    <MergeInboxResultsData
      dataType="results"
      ticketDetails={ticketDetails}
      currentStakeholder={currentStakeholder}
      fetchResultsDataFn={getImportedTemporaryResults}
      mergeResultsDataFn={mergeInboxResults}
      dataSortingKey="pos"
      successTargetStatus={ticketsCompetitionResultStatuses.merged_inbox_results}
      rowHeaderComponent={ResultRowHeader}
      rowComponent={ResultRowBody}
    />
  );
}

export function MergeInboxScrambles({ ticketDetails, currentStakeholder }) {
  return (
    <MergeInboxResultsData
      dataType="scrambles"
      ticketDetails={ticketDetails}
      currentStakeholder={currentStakeholder}
      fetchResultsDataFn={getImportedTemporaryScrambles}
      mergeResultsDataFn={mergeInboxScrambles}
      dataSortingKey={['group_id', 'is_extra', 'scramble_num']}
      successTargetStatus={ticketsCompetitionResultStatuses.merged_inbox_scrambles}
      rowHeaderComponent={ScrambleRowHeader}
      rowComponent={ScrambleRowBody}
    />
  );
}

export default function MergeInboxResultsData({
  dataType,
  ticketDetails,
  currentStakeholder,
  fetchResultsDataFn,
  mergeResultsDataFn,
  dataSortingKey,
  successTargetStatus,
  rowHeaderComponent,
  rowComponent,
}) {
  const { ticket: { id, metadata: { competition_id: competitionId } } } = ticketDetails;

  const queryClient = useQueryClient();
  const {
    mutate: mergeInboxResultsDataMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: mergeResultsDataFn,
    onSuccess: () => {
      queryClient.setQueryData(
        ['ticket-details', id],
        (oldTicketDetails) => ({
          ...oldTicketDetails,
          ticket: {
            ...oldTicketDetails.ticket,
            metadata: {
              ...oldTicketDetails.ticket.metadata,
              status: successTargetStatus,
            },
          },
        }),
      );
      queryClient.setQueryData([`imported-temporary-${dataType}`, competitionId], []);
    },
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <ResultsDataPreview
        dataType={dataType}
        competitionId={competitionId}
        fetchResultsDataFn={fetchResultsDataFn}
        dataSortingKey={dataSortingKey}
        rowHeaderComponent={rowHeaderComponent}
        rowComponent={rowComponent}
      />
      <Button
        onClick={() => mergeInboxResultsDataMutate({
          ticketId: id,
          actingStakeholderId: currentStakeholder.id,
        })}
      >
        Merge Inbox
        {' '}
        {_.upperFirst(dataType)}
      </Button>
    </>
  );
}
