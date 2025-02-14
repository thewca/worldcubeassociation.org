import React, { useMemo } from 'react';
import {
  Button, Container, Dropdown, Message, Modal,
} from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { actionUrls } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import TicketHeader from './TicketHeader';
import TicketWorkbench from './TicketWorkbench';
import TicketLogs from './TicketLogs';
import useInputState from '../../lib/hooks/useInputState';
import TicketComments from './TicketComments';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';

function SkateholderSelector({ stakeholderList, setUserSelectedStakeholder }) {
  const [selectedOption, setSelectedOption] = useInputState(stakeholderList[0]);
  return (
    <>
      <p>
        You are part of more than one stakeholder, please select the stakeholder as which you want
        to visit the ticket page.
      </p>
      <Dropdown
        options={stakeholderList.map((requesterStakeholder) => ({
          key: requesterStakeholder.id,
          text: requesterStakeholder.stakeholder.name,
          value: requesterStakeholder,
        }))}
        value={selectedOption}
        onChange={setSelectedOption}
      />
      <Button
        disabled={!selectedOption}
        onClick={() => setUserSelectedStakeholder(selectedOption)}
      >
        Select
      </Button>
    </>
  );
}

function TicketContent({ ticketDetails, currentStakeholder, sync }) {
  return (
    <>
      <TicketHeader
        ticketDetails={ticketDetails}
        currentStakeholder={currentStakeholder}
        sync={sync}
      />
      <TicketWorkbench
        ticketDetails={ticketDetails}
        sync={sync}
        currentStakeholder={currentStakeholder}
      />
      <TicketComments
        ticketId={ticketDetails.ticket.id}
        currentStakeholder={currentStakeholder}
      />
      <TicketLogs logs={ticketDetails.ticket.ticket_logs} />
    </>
  );
}

export default function Wrapper(args) {
  return (
    <WCAQueryClientProvider>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Tickets {...args} />
    </WCAQueryClientProvider>
  );
}

function Tickets({ id }) {
  const {
    data: ticketDetails, sync, loading, error,
  } = useLoadedData(actionUrls.tickets.show(id));

  const [userSelectedStakeholder, setUserSelectedStakeholder] = useInputState();
  const currentStakeholder = useMemo(() => {
    if (userSelectedStakeholder) {
      return userSelectedStakeholder;
    } if (ticketDetails?.requester_stakeholders.length === 1) {
      return ticketDetails?.requester_stakeholders[0];
    }
    return null;
  }, [ticketDetails?.requester_stakeholders, userSelectedStakeholder]);

  if (loading) return <Loading />;
  if (error) return <Errored />;

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
            sync={sync}
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
