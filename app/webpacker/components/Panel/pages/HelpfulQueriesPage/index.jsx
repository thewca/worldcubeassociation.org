import React, { useMemo } from 'react';
import {
  Form, Header, Label, Loader, Message, Segment, Tab, Table,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls, competitionUrl } from '../../../../lib/requests/routes.js.erb';
import useInputState from '../../../../lib/hooks/useInputState';

const hasWcaId = (val) => val?.trim()?.length > 0;

const statusColor = (s) => {
  switch ((s?.toLowerCase() || '')) {
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
  return (data || []);
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

  if (isFetching) return <Loader active inline />;

  return data.length > 0 ? (
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
          <Table.Row key={row.competition.id}>
            <Table.Cell>
              <a href={competitionUrl(row.competition.id)}>{row.competition.name}</a>
            </Table.Cell>
            <Table.Cell>{row.competition.city_name}</Table.Cell>
            <Table.Cell>{row.competition.country_id}</Table.Cell>
            <Table.Cell>{row.competition.start_date}</Table.Cell>
            <Table.Cell>
              <Label basic color={statusColor(row.competing_status)}>{row.competing_status}</Label>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ) : <Message content="No registrations found for this competitor." />;
}

function OrganizedPane({ wcaId }) {
  const enabled = hasWcaId(wcaId);
  const { data = [], isFetching } = useQuery({
    queryKey: ['hq-organized', wcaId],
    queryFn: () => fetchOrganized(wcaId),
    enabled,
  });

  if (isFetching) return <Loader active inline />;

  return data.length > 0 ? (
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
  ) : <Message content="No organized competitions found." />;
}

function DelegatedPane({ wcaId }) {
  const enabled = hasWcaId(wcaId);
  const { data = [], isFetching } = useQuery({
    queryKey: ['hq-delegated', wcaId],
    queryFn: () => fetchDelegated(wcaId),
    enabled,
  });

  if (isFetching) return <Loader active inline />;

  return data.length > 0 ? (
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
  ) : <Message content="No delegated competitions found." />;
}

function HelpfulTabs({ wcaId }) {
  const panes = useMemo(() => ([
    {
      menuItem: 'Competitor Registrations',
      render: () => (
        <Tab.Pane>
          {!hasWcaId(wcaId)
            ? <Message info content="Select a WCA ID to load registrations." />
            : <RegistrationsPane wcaId={wcaId} />}
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Organized Competitions',
      render: () => (
        <Tab.Pane>
          {!hasWcaId(wcaId)
            ? <Message info content="Select a WCA ID to load organized competitions." />
            : <OrganizedPane wcaId={wcaId} />}
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Delegated Competitions',
      render: () => (
        <Tab.Pane>
          {!hasWcaId(wcaId)
            ? <Message info content="Select a WCA ID to load delegated competitions." />
            : <DelegatedPane wcaId={wcaId} />}
        </Tab.Pane>
      ),
    },
  ]), [wcaId]);

  return <Tab panes={panes} />;
}

function HelpfulQueriesPage() {
  const [wcaId, setWcaId] = useInputState();

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
            onChange={setWcaId}
          />
        </Form>
      </Segment>
      <HelpfulTabs wcaId={wcaId} />
    </>
  );
}

export default HelpfulQueriesPage;
