import React from 'react';
import {
  Form, Grid,
} from 'semantic-ui-react';

import AttemptResultField from '../WCALive/AttemptResultField/AttemptResultField';
import MarkerField from '../WCALive/AttemptResultField/MarkerField';
import { average, best, formatAttemptResult } from '../../../lib/wca-live/attempts';
import useNestedInputUpdater from '../../../lib/hooks/useNestedInputUpdater';

function AttemptsForm({
  state, setState, eventId, computeAverage,
}) {
  const { attempts, markerBest, markerAvg } = state;

  const setMarkerBest = useNestedInputUpdater(setState, 'markerBest');
  const setMarkerAvg = useNestedInputUpdater(setState, 'markerAvg');

  // FIXME: we use padded grid here because Bootstrap's row conflicts with
  // FUI's row and messes up the negative margins... :(
  /* eslint react/no-array-index-key: "off" */
  return (
    <Form>
      <Grid stackable padded columns={2}>
        <Grid.Column className="attempts-column">
          {attempts.map((attempt, index) => {
            const setAttempt = useNestedInputUpdater(setState, `attempts[${index}]`);
            return (
              <AttemptResultField
                key={index}
                eventId={eventId}
                label={`Attempt ${index + 1}`}
                initialValue={attempt}
                value={attempt}
                onChange={setAttempt}
              />
            );
          })}
        </Grid.Column>
        <Grid.Column>
          <Form.Input
            label="Best"
            readOnly
            value={formatAttemptResult(best(attempts), eventId)}
            action={(
              <MarkerField
                onChange={setMarkerBest}
                marker={markerBest}
              />
            )}
          />
          {computeAverage && (
          <Form.Input
            label="Average"
            readOnly
            value={formatAttemptResult(average(state.attempts, eventId), eventId)}
            action={(
              <MarkerField
                onChange={setMarkerAvg}
                marker={markerAvg}
              />
            )}
          />
          )}
        </Grid.Column>
      </Grid>
    </Form>
  );
}

export default AttemptsForm;
