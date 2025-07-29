import React from 'react';
import _ from 'lodash';
import PickerWithMatching from './PickerWithMatching';
import { parseActivityCode } from '../../lib/utils/wcif';

function extractEventId(roundId) {
  return parseActivityCode(roundId).eventId;
}

export default function MatchingPickerChain({
  wcifEvents,
  matchState,
  dispatchMatchState,
}) {
  const wrappedMatchState = _.groupBy(
    _.map(matchState, (values, id) => ({ id, values })),
    (item) => extractEventId(item.id),
  );

  return (
    <PickerWithMatching
      pickerKey="events"
      selectableEntities={wcifEvents}
      entityLookup={wrappedMatchState}
      dispatchMatchState={dispatchMatchState}
      nestedPickers={[
        { key: 'rounds', mapping: 'values' },
        { key: 'groups', mapping: 'inbox_scrambles' },
      ]}
    />
  );
}
