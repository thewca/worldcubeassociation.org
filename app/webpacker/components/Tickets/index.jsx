import React, { useMemo } from 'react';
import {
  Button, Container, Message, Modal,
} from 'semantic-ui-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import useInputState from '../../lib/hooks/useInputState';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import TicketContent from './TicketContent';
import SkateholderSelector from './SkateholderSelector';
import getTicketDetails from './api/getTicketDetails';
import updateStatus from './api/updateStatus';

export default function Wrapper({ id }) {
  return (
    <WCAQueryClientProvider>
      <Tickets id={id} />
    </WCAQueryClientProvider>
  );
}

function Tickets({ id }) {
  const queryClient = useQueryClient();
  const {
    data: ticketDetails,
    isPending: isPendingTicketDetails,
    isError: isErrorTicketDetails,
    error: errorTicketDetails,
  } = useQuery({
    queryKey: ['ticket-details', id],
    queryFn: () => getTicketDetails({ ticketId: id }),
  });

  const [userSelectedStakeholder, setUserSelectedStakeholder] = useInputState();
  const currentStakeholder = useMemo(() => {
    if (userSelectedStakeholder) {
      return userSelectedStakeholder;
    } if (ticketDetails?.requester_stakeholders.length === 1) {
      return ticketDetails?.requester_stakeholders[0];
    }
    return null;
  }, [ticketDetails?.requester_stakeholders, userSelectedStakeholder]);

  const {
    mutate: updateStatusMutate,
    isPending: isPendingUpdateStatus,
    isError: isErrorUpdateStatus,
    error: errorUpdateStatus,
  } = useMutation({
    mutationFn: (status) => updateStatus({
      ticketId: id,
      status,
      currentStakeholderId: currentStakeholder.id,
    }),
    onSuccess: (status) => {
      queryClient.setQueryData(
        ['ticket-details', id],
        (oldTicketDetails) => ({
          ...oldTicketDetails,
          ticket: {
            ...oldTicketDetails.ticket,
            metadata: {
              ...oldTicketDetails.ticket.metadata,
              status,
            },
          },
        }),
      );
    },
  });

  if (isPendingTicketDetails || isPendingUpdateStatus) return <Loading />;
  if (isErrorTicketDetails) return <Errored error={errorTicketDetails} />;
  if (isErrorUpdateStatus) return <Errored error={errorUpdateStatus} />;

  return (
    <>
      <Container fluid>
        {userSelectedStakeholder && (
          <Message>
            {`You are currently viewing the ticket as stakeholder "${userSelectedStakeholder.stakeholder.name}".`}
            <Button
              onClick={() => setUserSelectedStakeholder(false)}
            >
              Click here to change
            </Button>
          </Message>
        )}
        {currentStakeholder && (
          <TicketContent
            ticketDetails={ticketDetails}
            currentStakeholder={currentStakeholder}
            updateStatus={updateStatusMutate}
          />
        )}
      </Container>
      <Modal
        open={!currentStakeholder}
        closeOnEscape={false}
        closeOnDimmerClick={false}
      >
        <Modal.Header>Select stakeholder</Modal.Header>
        <Modal.Content>
          <SkateholderSelector
            stakeholderList={ticketDetails?.requester_stakeholders}
            setUserSelectedStakeholder={setUserSelectedStakeholder}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
