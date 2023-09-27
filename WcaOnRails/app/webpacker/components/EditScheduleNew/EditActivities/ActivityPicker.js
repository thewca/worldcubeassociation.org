import React, { useMemo } from 'react';
import { Label, List, Popup } from 'semantic-ui-react';
import cn from 'classnames';
import { useStore } from '../../../lib/providers/StoreProvider';
import {
  activityCodeListFromWcif,
  parseActivityCode,
  roundIdToString
} from '../../../lib/utils/wcif';
import { formats } from '../../../lib/wca-data.js.erb';
import _ from 'lodash';

function ActivityPicker({
  wcifEvents,
}) {
  return (
    <>
      <List relaxed>
        {wcifEvents.map((event, eventIdx) => (
          <List.Item key={eventIdx}>
            <List.Icon
              className={cn('cubing-icon', `event-${event.id}`)}
              verticalAlign="middle"
              size="large"
            />
            <List.Content>
              {event.rounds.map((round, roundIdx) => (
                <PickerRow
                  key={roundIdx}
                  wcifEvent={event}
                  wcifRound={round}
                />
              ))}
            </List.Content>
          </List.Item>
        ))}
      </List>
      <p>
        Want to add a custom activity such as lunch or registration?
        Click and select a timeframe on the calendar!
      </p>
    </>
  );
}

function PickerRow({
  wcifEvent,
  wcifRound,
}) {
  if (['333fm', '333mbf'].includes(wcifEvent.id)) {
    const numberOfAttempts = formats.byId[wcifRound.format].expectedSolveCount;

    return _.times(numberOfAttempts, (n) => (
      <ActivityLabel
        key={n}
        activityCode={`${wcifRound.id}-a${n + 1}`}
        attemptNumber={n + 1}
      />
    ));
  }

  return (
    <ActivityLabel
      activityCode={wcifRound.id}
      attemptNumber={null}
    />
  );
}

function ActivityLabel({
  activityCode,
  attemptNumber,
}) {
  const { wcifSchedule } = useStore();

  const usedActivityCodes = useMemo(() => {
    return activityCodeListFromWcif(wcifSchedule);
  }, [wcifSchedule]);

  const { roundNumber } = parseActivityCode(activityCode);

  let tooltipText = roundIdToString(activityCode);
  let text = `R${roundNumber}`;

  if (attemptNumber) {
    tooltipText += `, Attempt ${attemptNumber}`;
    text += `A${attemptNumber}`;
  }

  const isEnabled = !usedActivityCodes.includes(activityCode);

  return (
    <Popup
      content={tooltipText}
      trigger={(
        <Label
          className={isEnabled ? 'fc-draggable' : ''}
          color={isEnabled ? 'blue' : 'grey'}
        >
          {text}
        </Label>
      )}
    />
  );
}

export default ActivityPicker;
