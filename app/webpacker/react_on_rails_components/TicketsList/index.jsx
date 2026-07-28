import React from 'react';
import { List } from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { viewUrls } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';

export default function TicketsList({ type, status, sort }) {
  const { data: tickets, loading, error } = useLoadedData(
    viewUrls.tickets.list(type, status, sort),
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <List divided relaxed>
      {tickets.map((ticket) => (
        <List.Item>
          <List.Content>
            <List.Header as="a" href={viewUrls.tickets.show(ticket.id)}>
              {`Ticket #${ticket.id}`}
            </List.Header>
          </List.Content>
        </List.Item>
      ))}
    </List>
  );
}
