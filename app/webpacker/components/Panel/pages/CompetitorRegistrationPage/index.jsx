import React, { useState } from 'react';
import {
  Form, Header, Message, Label, Table, Loader,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { viewUrls } from '../../../../lib/requests/routes.js.erb';

async function getCompetitions({ wcaId }) {
  const { data } = await fetchJsonOrError(
    viewUrls.persons.registrations(wcaId),
  );
  return data || {};
}

function CompetitorRegistrationPage() {
  const [formValues, setFormValues] = useState({});

  const { wcaId } = formValues;

  const {
    data: competitionsList,
    isFetching: competitionsFetching,
  } = useQuery({
    queryKey: ['competitor-registration-competitions', wcaId],
    queryFn: () => getCompetitions({ wcaId }),
    enabled: !!wcaId,
  });

  const handleWcaIdChange = (_, { value: newWcaId }) => setFormValues(
    (prev) => ({
      ...prev,
      wcaId: newWcaId,
    }),
  );

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

  return (
    <>
      <Header>Competitor Registrations</Header>
      <Form>
        <Form.Field
          label="WCA ID"
          name="wcaId"
          control={IdWcaSearch}
          model={SEARCH_MODELS.person}
          multiple={false}
          value={formValues?.wcaId}
          onChange={handleWcaIdChange}
        />
      </Form>
      <Loader active={competitionsFetching} />
      {!wcaId && (
        <Message info content="Select a WCA ID to load registrations." />
      )}

      {wcaId && competitionsList?.length === 0 && (
        <Message content="No registrations found for this competitor." />
      )}

      {wcaId && competitionsList?.length > 0 && (
        <Table celled compact striped>
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
            {competitionsList.map((row) => (
              <Table.Row key={row.competition_id}>
                <Table.Cell><a href={`/competitions/${row.competition_id}`}>{row.competition_name}</a></Table.Cell>
                <Table.Cell>{row.city_name}</Table.Cell>
                <Table.Cell>{row.country_id}</Table.Cell>
                <Table.Cell>{row.start_date}</Table.Cell>
                <Table.Cell>
                  <Label basic color={statusColor(row.competing_status)}>
                    {row.competing_status}
                  </Label>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </>
  );
}

export default CompetitorRegistrationPage;
