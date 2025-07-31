import React, { useState } from 'react';
import { Button, Confirm, List } from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import postResults from '../../api/competitionResult/postResults';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import { viewUrls, competitionUrl } from '../../../../lib/requests/routes.js.erb';

export default function FinalSteps({ ticketDetails }) {
  const { ticket: { id, metadata: { competition_id: competitionId } } } = ticketDetails;
  const [showPostConfirm, setShowPostConfirm] = useState();

  const queryClient = useQueryClient();
  const {
    mutate: postResultsMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: postResults,
    onSuccess: () => {
      queryClient.setQueryData(
        ['ticket-details', id],
        (oldTicketDetails) => ({
          ...oldTicketDetails,
          ticket: {
            ...oldTicketDetails.ticket,
            metadata: {
              ...oldTicketDetails.ticket.metadata,
              status: ticketsCompetitionResultStatuses.posted,
            },
          },
        }),
      );
    },
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <p>All inbox data has been imported. You should consider the following steps next:</p>
      <List bulleted>
        <List.Item>
          <Button
            primary
            href={viewUrls.admin.overrideRegionalRecords(competitionId, 'all', true)}
            target="_blank"
          >
            Check record markers
          </Button>
        </List.Item>
        <List.Item>
          <Button
            primary
            href={viewUrls.competitions.adminDoComputeAuxiliaryData}
            target="_blank"
          >
            Compute auxiliary data
          </Button>
        </List.Item>
      </List>
      <List>
        <List.Item>
          <Button
            primary
            href={competitionUrl(competitionId)}
            target="_blank"
          >
            Competitions Page
          </Button>
          You can click this to visit the competition page as an additional sanity check.
          Once you are sure, you can post the results using the button below.
        </List.Item>
        <List.Item />
        <List.Item>
          <Button primary onClick={() => setShowPostConfirm(true)}>
            Post Results
          </Button>
        </List.Item>
        <List.Item />
      </List>
      <Confirm
        open={showPostConfirm}
        content="You are about to publish the results, including sending out emails to the competitors. Are you sure?"
        onCancel={() => setShowPostConfirm(false)}
        onConfirm={() => {
          postResultsMutate({ ticketId: id });
          setShowPostConfirm(false);
        }}
      />
    </>
  );
}
