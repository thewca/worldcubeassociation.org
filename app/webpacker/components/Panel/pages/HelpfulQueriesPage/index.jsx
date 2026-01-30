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

const statusColor = (s) => {
  switch (s?.toLowerCase()) {
    case 'accepted': return 'green';
    case 'pending': return 'grey';
    case 'waiting_list': return 'yellow';
    case 'cancelled': return 'orange';
    case 'rejected': return 'red';
    default: return 'grey';
  }
};

async function fetchRegistrations(userId) {
  const { data } = await fetchJsonOrError(viewUrls.helpfulQueries.registrations(userId));
  return (data || []);
}

async function fetchOrganized(userId) {
  const { data } = await fetchJsonOrError(viewUrls.helpfulQueries.organizedCompetitions(userId));
  return (data || []);
}

async function fetchDelegated(userId) {
  const { data } = await fetchJsonOrError(viewUrls.helpfulQueries.delegatedCompetitions(userId));
  return (data || []);
}

async function fetchPast(userId) {
  const { data } = await fetchJsonOrError(viewUrls.helpfulQueries.pastCompetitions(userId));
  return (data || []);
}

function RegistrationsPane({ userId }) {
  const { data = [], isFetching } = useQuery({
    queryKey: ['hq-registrations', userId],
    queryFn: () => fetchRegistrations(userId),
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

function OrganizedPane({ userId }) {
  const { data = [], isFetching } = useQuery({
    queryKey: ['hq-organized', userId],
    queryFn: () => fetchOrganized(userId),
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

function DelegatedPane({ userId }) {
  const { data = [], isFetching } = useQuery({
    queryKey: ['hq-delegated', userId],
    queryFn: () => fetchDelegated(userId),
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

function PastCompetitionsPane({ userId }) {
  const { data = [], isFetching } = useQuery({
    queryKey: ['hq-past-competitions', userId],
    queryFn: () => fetchPast(userId),
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
  ) : <Message content="No past competitions found." />;
}

function HelpfulTabs({ userId }) {
  const panes = useMemo(() => ([
    {
      menuItem: 'Competitor Registrations',
      render: () => (
        <Tab.Pane>
          <RegistrationsPane userId={userId} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Organized Competitions',
      render: () => (
        <Tab.Pane>
          <OrganizedPane userId={userId} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Delegated Competitions',
      render: () => (
        <Tab.Pane>
          <DelegatedPane userId={userId} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Past Competitions',
      render: () => (
        <Tab.Pane>
          <PastCompetitionsPane userId={userId} />
        </Tab.Pane>
      ),
    },
  ]), [userId]);

  if (!userId) return <Message info content="Select a User to load data." />;

  return <Tab panes={panes} />;
}

function HelpfulQueriesPage() {
  const [userId, setUserId] = useInputState();

  return (
    <>
      <Header>Helpful Queries</Header>
      <Segment>
        <Form>
          <Form.Field
            label="User"
            name="userId"
            control={IdWcaSearch}
            model={SEARCH_MODELS.user}
            multiple={false}
            value={userId}
            onChange={setUserId}
          />
        </Form>
      </Segment>
      <HelpfulTabs userId={userId} />
    </>
  );
}

export default HelpfulQueriesPage;
