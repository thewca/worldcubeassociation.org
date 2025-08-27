import React, { useState } from 'react';
import {
  Form, Header, Label, Loader, Message, Segment, Tab, Table,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls, competitionUrl } from '../../../../lib/requests/routes.js.erb';

const hasWcaId = (val) => typeof val === 'string' && val.trim().length > 0;

const statusColor = (s) => {
  switch ((s || '').toLowerCase()) {
    case 'accepted': return 'green';
    case 'pending': return 'grey';
    case 'waiting_list': return 'yellow';
    case 'cancelled': return 'orange';
    case 'rejected': return 'red';
    default: return 'grey';
  }
};

async function fetchRegistrations(wcaId) {
  if (!hasWcaId(wcaId)) return [];
  const { data } = await fetchJsonOrError(viewUrls.persons.registrations(wcaId));
  const arr = data || [];
  return arr.map((r) => ({
    id: r.competition.id,
    name: r.competition.name,
    city_name: r.competition.city_name,
    country_id: r.competition.country_id,
    start_date: r.competition.start_date,
    status: r.competing_status,
  }));
}

async function fetchOrganized(wcaId) {
  if (!hasWcaId(wcaId)) return [];
  const { data } = await fetchJsonOrError(viewUrls.persons.organizedCompetitions(wcaId));
  return (data || []);
}

async function fetchDelegated(wcaId) {
  if (!hasWcaId(wcaId)) return [];
  const { data } = await fetchJsonOrError(viewUrls.persons.delegatedCompetitions(wcaId));
  return (data || []);
}

function RegistrationsPane({ wcaId }) {
  const enabled = hasWcaId(wcaId);
  const { data = [], isFetching } = useQuery({
    queryKey: ['hq-registrations', wcaId],
    queryFn: () => fetchRegistrations(wcaId),
    enabled,
  });

  if (!enabled) return <Message info content="Select a WCA ID to load registrations." />;
  if (!isFetching && data.length === 0) return <Message content="No registrations found for this competitor." />;

  return (
    <>
      <Loader active={isFetching} inline />
      {data.length > 0 && (
        <Table celled striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Competition</Table.HeaderCell>
              <Table.HeaderCell>City</Table.HeaderCell>
              <Table.HeaderCell>Country</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((row) => (
              <Table.Row key={row.id}>
                <Table.Cell><a href={competitionUrl(row.id)}>{row.name}</a></Table.Cell>
                <Table.Cell>{row.city_name}</Table.Cell>
                <Table.Cell>{row.country_id}</Table.Cell>
                <Table.Cell>{row.start_date}</Table.Cell>
                <Table.Cell>
                  <Label basic color={statusColor(row.status)}>{row.status}</Label>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </>
  );
}

function OrganizedPane({ wcaId }) {
  const enabled = hasWcaId(wcaId);
  const { data = [], isFetching } = useQuery({
    queryKey: ['hq-organized', wcaId],
    queryFn: () => fetchOrganized(wcaId),
    enabled,
  });

  if (!enabled) return <Message info content="Select a WCA ID to load organized competitions." />;
  if (!isFetching && data.length === 0) return <Message content="No organized competitions found." />;

  return (
    <>
      <Loader active={isFetching} inline />
      {data.length > 0 && (
        <Table celled compact striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Competition</Table.HeaderCell>
              <Table.HeaderCell>City</Table.HeaderCell>
              <Table.HeaderCell>Country</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((row) => (
              <Table.Row key={row.id}>
                <Table.Cell><a href={competitionUrl(row.id)}>{row.name}</a></Table.Cell>
                <Table.Cell>{row.city_name}</Table.Cell>
                <Table.Cell>{row.country_id}</Table.Cell>
                <Table.Cell>{row.start_date}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </>
  );
}

function DelegatedPane({ wcaId }) {
  const enabled = hasWcaId(wcaId);
  const { data = [], isFetching } = useQuery({
    queryKey: ['hq-delegated', wcaId],
    queryFn: () => fetchDelegated(wcaId),
    enabled,
  });

  if (!enabled) return <Message info content="Select a WCA ID to load delegated competitions." />;
  if (!isFetching && data.length === 0) return <Message content="No delegated competitions found." />;

  return (
    <>
      <Loader active={isFetching} inline />
      {data.length > 0 && (
        <Table celled compact striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Competition</Table.HeaderCell>
              <Table.HeaderCell>City</Table.HeaderCell>
              <Table.HeaderCell>Country</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((row) => (
              <Table.Row key={row.id}>
                <Table.Cell><a href={competitionUrl(row.id)}>{row.name}</a></Table.Cell>
                <Table.Cell>{row.city_name}</Table.Cell>
                <Table.Cell>{row.country_id}</Table.Cell>
                <Table.Cell>{row.start_date}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </>
  );
}

function HelpfulQueriesPage() {
  const [wcaId, setWcaId] = useState();

  const panes = [
    {
      menuItem: 'Competitor Registrations',
      render: () => (
        <Tab.Pane>
          <RegistrationsPane wcaId={wcaId} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Organized Competitions',
      render: () => (
        <Tab.Pane>
          <OrganizedPane wcaId={wcaId} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Delegated Competitions',
      render: () => (
        <Tab.Pane>
          <DelegatedPane wcaId={wcaId} />
        </Tab.Pane>
      ),
    },
  ];

  return (
    <>
      <Header>Helpful Queries</Header>
      <Segment>
        <Form>
          <Form.Field
            label="WCA ID"
            name="wcaId"
            control={IdWcaSearch}
            model={SEARCH_MODELS.person}
            multiple={false}
            value={wcaId}
            onChange={(_, { value }) => setWcaId(value || '')}
          />
        </Form>
      </Segment>
      <Tab panes={panes} />
    </>
  );
}

export default HelpfulQueriesPage;
