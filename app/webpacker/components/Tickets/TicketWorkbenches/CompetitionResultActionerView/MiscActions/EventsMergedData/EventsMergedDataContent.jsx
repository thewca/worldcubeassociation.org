import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  Button, Confirm, Message, Table,
} from 'semantic-ui-react';
import getEventsMergedData from '../../../../api/competitionResult/getEventsMergedData';
import Loading from '../../../../../Requests/Loading';
import Errored from '../../../../../Requests/Errored';
import deleteResultsData from '../../../../api/competitionResult/deleteResultsData';

export default function EventsMergedDataContent({ ticketDetails }) {
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState();
  const {
    ticket: {
      id: ticketId,
      metadata: { competition_id: competitionId },
    },
  } = ticketDetails;

  const {
    data: eventsMergedData,
    isPending: isEventsMergedDataPending,
    isError: isEventsMergedDataError,
    error: eventsMergedDataError,
  } = useQuery({
    queryKey: ['events-merged-data', ticketId],
    queryFn: () => getEventsMergedData({ ticketId }),
  });

  const {
    mutate: deleteResultsDataMutate,
    isPending: isDeleteDataPending,
    isError: isDeleteDataError,
    error: deleteDataError,
  } = useMutation({
    mutationFn: deleteResultsData,
    onSuccess: (_, { model, roundId }) => {
      queryClient.setQueryData(
        ['events-merged-data', ticketId],
        (previousData) => previousData.map((roundData) => {
          if (model === 'All') {
            return {
              ...roundData,
              count: {
                result: 0,
                scramble: 0,
              },
            };
          }
          if (roundData.round_id === roundId) {
            return {
              ...roundData,
              count: {
                ...roundData.count,
                [model.toLowerCase()]: 0,
              },
            };
          }
          return roundData;
        }),
      );
    },
  });

  if (isEventsMergedDataPending || isDeleteDataPending) return <Loading />;
  if (isEventsMergedDataError) return <Errored error={eventsMergedDataError} />;
  if (isDeleteDataError) return <Errored error={deleteDataError} />;

  return (
    <>
      <Message warning>
        Note: The table below shows if there are merged data for Result and Scramble. Importing
        more data will override the existing inbox data, but not the merged results data. You
        may remove the currently merged results data using the interface below.
      </Message>
      <Table celled striped compact="very" definition>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Event Round</Table.HeaderCell>
            <Table.HeaderCell colSpan="2">Has Merged Results</Table.HeaderCell>
            <Table.HeaderCell colSpan="2">Has Merged Scrambles</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {eventsMergedData.map((roundData) => (
            <Table.Row key={roundData.round_id}>
              <Table.Cell verticalAlign="middle">{roundData.round_name}</Table.Cell>
              <DataActioner
                roundData={roundData}
                model="Result"
                deleteMutate={deleteResultsDataMutate}
                competitionId={competitionId}
              />
              <DataActioner
                roundData={roundData}
                model="Scramble"
                deleteMutate={deleteResultsDataMutate}
                competitionId={competitionId}
              />
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      Please be careful removing data! Data in the above table is live.
      Remove all results and scrambles only, does not affect persons:
      {' '}
      <Button negative onClick={() => setShowConfirm(true)}>X ALL</Button>
      <Confirm
        open={showConfirm}
        content={`You are about to remove all entries from Results and Scrambles for ${competitionId}. THIS ACTION CANNOT BE UNDONE! Please confirm below if you're sure.`}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          deleteResultsDataMutate({ competitionId, model: 'All' });
          setShowConfirm(false);
        }}
      />
    </>
  );
}

function DataActioner({
  roundData, model, deleteMutate, competitionId,
}) {
  const [showConfirm, setShowConfirm] = useState();
  const count = roundData.count[model.toLowerCase()];

  return (
    <>
      <Table.Cell verticalAlign="middle">{count > 0 ? 'Yes' : 'No'}</Table.Cell>
      <Table.Cell>
        <Button
          negative
          onClick={() => setShowConfirm(true)}
          compact
          disabled={count === 0}
        >
          X
        </Button>
      </Table.Cell>
      <Confirm
        open={showConfirm}
        content={`You are about to remove ${count} entries from ${model}. Please confirm below if you're sure.`}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          deleteMutate({ competitionId, model, roundId: roundData.round_id });
          setShowConfirm(false);
        }}
      />
    </>
  );
}
