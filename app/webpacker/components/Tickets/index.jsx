import React from 'react';
import { Container } from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { actionUrls } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import TicketHeader from './TicketHeader';
import TicketWorkbench from './TicketWorkbench';
import TicketLogs from './TicketLogs';

export default function Tickets({ id }) {
  const {
    data: ticketDetails, sync, loading, error,
  } = useLoadedData(actionUrls.tickets.show(id));

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <Container fluid>
      <TicketHeader ticketDetails={ticketDetails} />
      <TicketWorkbench ticketDetails={ticketDetails} sync={sync} />
      <TicketLogs logs={ticketDetails.ticket.ticket_logs} />
    </Container>
  );
}
