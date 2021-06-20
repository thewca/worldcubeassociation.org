import React, { useState } from 'react';
import {
  Form, Grid, Icon, Popup,
} from 'semantic-ui-react';

import _ from 'lodash';
import formats from '../../../lib/wca-data/formats.js.erb';
import events from '../../../lib/wca-data/events.js.erb';
import roundTypes from '../../../lib/wca-data/roundTypes.js.erb';
import useNestedInputUpdater from '../../../lib/hooks/useNestedInputUpdater';
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
    competitionId, roundTypeId, eventId, formatId,
  } = roundData;

  const setCompetition = useNestedInputUpdater(setRoundData, 'competitionId');
  const setEvent = useNestedInputUpdater(setRoundData, 'eventId');
  const setFormat = useNestedInputUpdater(setRoundData, 'formatId');
  const setRoundType = useNestedInputUpdater(setRoundData, 'roundTypeId');

  const [competitionIdError, setCompetitionIdError] = useState(null);

  const [localRoundData, setLocalRoundData] = useState(formatRoundData(roundData));

  const availableEvents = Object.keys(localRoundData).map((k) => itemFromId(k, events));
  const availableRoundTypes = extractFromRoundData(localRoundData, eventId, 'roundTypeId', roundTypes);
  const availableFormats = extractFromRoundData(localRoundData, eventId, 'formatId', formats);

  const fetchDataForCompetition = (id) => {
    setCompetitionIdError(null);
    fetchJsonOrError(competitionEventsDataUrl(id)).then((data) => {
      setLocalRoundData(data);
    }).catch((err) => setCompetitionIdError(err.message));
  };

  // FIXME: we use padded grid here because Bootstrap's row conflicts with
  // FUI's row and messes up the negative margins... :(
  return (
    <Form>
      <Grid stackable padded columns={4}>
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
        <Grid.Column>
          <Form.Select
            label="Format"
            value={formatId}
            onChange={setFormat}
            options={availableFormats}
          />
        </Grid.Column>
      </Grid>
    </Form>
  );
}

export default RoundForm;
