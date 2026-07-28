import React, { useMemo } from 'react';
import {
  Button, Container, Message, Modal,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import Loading from '../components/Requests/Loading';
import Errored from '../components/Requests/Errored';
import useInputState from '../lib/hooks/useInputState';
import WCAQueryClientProvider from '../lib/providers/WCAQueryClientProvider';
import TicketContent from '../components/Tickets/TicketContent';
import SkateholderSelector from '../components/Tickets/SkateholderSelector';
import getTicketDetails from '../components/Tickets/api/getTicketDetails';
import SelfRoleAssigner from '../components/Tickets/SelfRoleAssigner';

export default function Wrapper({ id }) {
  return (
    <WCAQueryClientProvider>
      <Tickets id={id} />
    </WCAQueryClientProvider>
  );
}

function Tickets({ id }) {
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

  const {
    requester_stakeholders: stakeholders = [],
  } = ticketDetails || {};

  const currentStakeholder = useMemo(() => {
    if (userSelectedStakeholder) {
      return userSelectedStakeholder;
    } if (stakeholders.length === 1) {
      return stakeholders[0];
    }
    return null;
  }, [stakeholders, userSelectedStakeholder]);

  if (isPendingTicketDetails) return <Loading />;
  if (isErrorTicketDetails) {
    if (errorTicketDetails.message.includes('No access to ticket')) {
      return <SelfRoleAssigner ticketId={id} />;
    }
    return <Errored />;
  }

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
            stakeholderList={stakeholders}
            setUserSelectedStakeholder={setUserSelectedStakeholder}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
