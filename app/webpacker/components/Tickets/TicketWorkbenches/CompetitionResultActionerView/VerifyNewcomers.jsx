import React, { useState } from 'react';
import { Button, Message } from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import { NewcomerChecks } from '../../../NewcomerChecks';
import CreateWcaIdsNonWcaRegistrations from './CreateWcaIdsNonWcaRegistrations';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import verifyNewcomers from '../../api/competitionResult/verifyNewcomers';
import { updateTicketMetadata } from '../../../../lib/helpers/update-ticket-query-data';

export default function VerifyNewcomers({ ticketDetails, currentStakeholder }) {
  const {
    ticket: {
      id,
      metadata: {
        competition: {
          id: competitionId,
          use_wca_registration: useWcaRegistration,
        },
      },
    },
  } = ticketDetails;
  const [newUi, setNewUi] = useState(useWcaRegistration);

  const queryClient = useQueryClient();
  const {
    mutate: verifyNewcomersMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: verifyNewcomers,
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
          ticketsCompetitionResultStatuses.newcomers_verified,
        ),
      );
    },
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      {newUi && (
        <>
          <Message info>
            Currently using new UI for competitions that use WCA registrations.
            <Button onClick={() => setNewUi(false)}>
              Click here to switch to old view
            </Button>
          </Message>
          <NewcomerChecks competitionId={competitionId} />
          <Button
            onClick={() => verifyNewcomersMutate({
              ticketId: id,
              actingStakeholderId: currentStakeholder.id,
            })}
          >
            Verified newcomers
          </Button>
        </>
      )}
      {!newUi && (
        <>
          {useWcaRegistration && (
            <Message info>
              Currently using old UI for competitions that use WCA registrations.
              <Button onClick={() => setNewUi(true)}>
                Click here to switch to new view
              </Button>
            </Message>
          )}
          <CreateWcaIdsNonWcaRegistrations
            ticketDetails={ticketDetails}
          />
        </>
      )}
    </>
  );
}
