import React, { useState } from 'react';
import {
  Button, Form, Header, Loader,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import { events, roundTypes } from '../../../../lib/wca-data.js.erb';
import { editResultUrl } from '../../../../lib/requests/routes.js.erb';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import Errored from '../../../Requests/Errored';
import { getCompetitions, getEvents, getResults } from './api/getFixResultsData';

function FixResultsPage() {
  const [formValues, setFormValues] = useState({});

  const {
    wcaId, competitionId, eventId, resultId,
  } = formValues;

  const {
    data: competitionsList,
    isFetching: competitionsFetching,
    isError: competitionsError,
  } = useQuery({
    queryKey: ['fix-results-competitions', wcaId],
    queryFn: () => getCompetitions({ wcaId }),
    enabled: !!wcaId,
  });

  const {
    data: eventsList,
    isFetching: eventsFetching,
    isError: eventsError,
  } = useQuery({
    queryKey: ['fix-results-events', wcaId, competitionId],
    queryFn: () => getEvents({ wcaId, competitionId }),
    enabled: !!competitionId,
  });

  const {
    data: resultsList,
    isFetching: resultsFetching,
    isError: resultsError,
  } = useQuery({
    queryKey: ['fix-results-rounds', wcaId, competitionId, eventId],
    queryFn: () => getResults({ wcaId, competitionId, eventId }),
    enabled: !!eventId,
  });

  const handleWcaIdChange = (_, { value: newWcaId }) => setFormValues(
    (prev) => ({
      ...prev,
      wcaId: newWcaId,
      competitionId: undefined,
      eventId: undefined,
      resultId: undefined,
    }),
  );

  const handleCompetitionIdChange = (_, { value: newCompetitionId }) => setFormValues(
    (prev) => ({
      ...prev,
      competitionId: newCompetitionId,
      eventId: undefined,
      resultId: undefined,
    }),
  );

  const handleEventIdChange = (_, { value: newEventId }) => setFormValues(
    (prev) => ({
      ...prev,
      eventId: newEventId,
      resultId: undefined,
    }),
  );

  const handleResultIdChange = (_, { value: newResultId }) => setFormValues(
    (prev) => ({
      ...prev,
      resultId: newResultId,
    }),
  );

  const anyLoading = competitionsFetching || eventsFetching || resultsFetching;
  const anyError = competitionsError || eventsError || resultsError;

  if (anyError) return <Errored />;

  return (
    <>
      <Header>Fix Results</Header>
      <Loader active={anyLoading} />
      <Form>
        <Form.Field
          label="WCA ID"
          name="wcaId"
          control={IdWcaSearch}
          model={SEARCH_MODELS.person}
          multiple={false}
          value={formValues?.wcaId}
          onChange={handleWcaIdChange}
          disabled={anyLoading}
        />
        <Form.Dropdown
          label="Competition"
          name="competitionId"
          placeholder="Select Competition"
          fluid
          scrolling
          options={competitionsList?.reverse().map((competition) => ({
            key: competition.competitionId,
            text: competition.competitionName,
            value: competition.competitionId,
          }))}
          disabled={anyLoading}
          value={formValues?.competitionId}
          onChange={handleCompetitionIdChange}
        />
        <Form.Dropdown
          label="Event"
          name="eventId"
          placeholder="Select Event"
          fluid
          scrolling
          options={eventsList?.map((event) => ({
            key: event,
            text: events.byId[event].name,
            value: event,
          }))}
          disabled={anyLoading}
          value={formValues?.eventId}
          onChange={handleEventIdChange}
        />
        <Form.Dropdown
          label="Round"
          name="resultId"
          placeholder="Select Round"
          fluid
          scrolling
          options={resultsList?.map((result) => ({
            key: result.id,
            text: roundTypes.byId[result.round_type_id].name,
            value: result.id,
          }))}
          disabled={anyLoading}
          value={formValues?.resultId}
          onChange={handleResultIdChange}
        />
        <Button
          content="Fix Results"
          href={editResultUrl(resultId)}
          disabled={!resultId}
        />
      </Form>
    </>
  );
}

export default FixResultsPage;
