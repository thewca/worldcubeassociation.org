import React, { useState } from 'react';
import {
  Form, Grid, Icon, Popup,
} from 'semantic-ui-react';

import _ from 'lodash';
import { events, roundTypes } from '../../../lib/wca-data.js.erb';
import useNestedInputUpdater from '../../../lib/hooks/useNestedInputUpdater';
import useRoundDataSetter from '../../../lib/hooks/useRoundDataSetter';
import { competitionEventsDataUrl } from '../../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';

const itemFromId = (id, items) => ({
  key: id,
  value: id,
  text: items.byId[id].name,
});

const formatRoundData = ({ eventId, formatId, roundTypeId }) => ({
  [eventId]: {
    eventId,
    rounds: [{ formatId, roundTypeId }],
  },
});

const extractFromRoundData = (roundData, eventId, key, items) => {
  const ids = _.uniq(roundData[eventId].rounds.map((r) => r[key]));
  return ids.map((id) => itemFromId(id, items));
};

function RoundForm({ roundData, setRoundData }) {
  const {
    competitionId, roundTypeId, eventId, roundId,
  } = roundData;

  const setCompetition = useNestedInputUpdater(setRoundData, 'competitionId');

  const [localRoundData, setLocalRoundData] = useState(formatRoundData(roundData));

  const setEvent = useRoundDataSetter(setRoundData, 'eventId', roundId, localRoundData);
  const setRoundType = useRoundDataSetter(setRoundData, 'roundTypeId', roundId, localRoundData);

  const [competitionIdError, setCompetitionIdError] = useState(null);

  const availableEvents = Object.keys(localRoundData).map((k) => itemFromId(k, events));
  const availableRoundTypes = extractFromRoundData(localRoundData, eventId, 'roundTypeId', roundTypes);

  const fetchDataForCompetition = (id) => {
    setCompetitionIdError(null);
    fetchJsonOrError(competitionEventsDataUrl(id)).then(({ data }) => {
      setLocalRoundData(data);
    }).catch((err) => setCompetitionIdError(err.message));
  };

  // FIXME: we use padded grid here because Bootstrap's row conflicts with
  // FUI's row and messes up the negative margins... :(
  return (
    <Form>
      <Grid stackable padded columns={3}>
        <Grid.Column>
          <Form.Input
            label="Competition ID"
            value={competitionId}
            onChange={setCompetition}
            error={competitionIdError}
            icon={(
              <Popup
                trigger={(
                  <Icon
                    circular
                    link
                    onClick={() => fetchDataForCompetition(competitionId)}
                    name="sync"
                  />
                )}
                content="Get the events and round data for that competition"
                position="top right"
              />
            )}
          />
        </Grid.Column>
        <Grid.Column>
          <Form.Select
            label="Event"
            value={eventId}
            onChange={setEvent}
            options={availableEvents}
          />
        </Grid.Column>
        <Grid.Column>
          <Form.Select
            label="Round type"
            value={roundTypeId}
            onChange={setRoundType}
            options={availableRoundTypes}
          />
        </Grid.Column>
      </Grid>
    </Form>
  );
}

export default RoundForm;
