import React from 'react';
import cn from 'classnames';
import _ from 'lodash';

import events from '../../lib/wca-data/events.js.erb';
import { pluralize } from '../../lib/utils/edit-events';
import { addRoundToEvent, removeRoundsFromSharedTimeLimits } from './utils';
import RoundsTable from './RoundsTable';
import RoundCountInput from './RoundCountInput';

export default function EventPanel({
  wcifEvents,
  canAddAndRemoveEvents,
  canUpdateEvents,
  wcifEvent,
}) {
  const event = events.byId[wcifEvent.id];

  const removeEvent = () => {
    if (
      !wcifEvent.rounds
      || (wcifEvent.rounds.length > 0
        // eslint-disable-next-line no-restricted-globals
        && !confirm(
          `Are you sure you want to remove all ${pluralize(
            wcifEvent.rounds.length,
            'round',
          )} of ${event.name}?`,
        ))
    ) {
      return;
    }

    // before removing all rounds of the event, remove those rounds from any
    // shared cumulative time limits
    removeRoundsFromSharedTimeLimits(
      wcifEvents,
      wcifEvent.rounds.map((round) => round.id),
    );

    // remove the rounds themselves
    wcifEvent.rounds = null;
  };

  const setRoundCount = (newRoundCount) => {
    wcifEvent.rounds = wcifEvent.rounds || [];
    const roundsToRemoveCount = wcifEvent.rounds.length - newRoundCount;
    if (roundsToRemoveCount > 0) {
      if (
        // eslint-disable-next-line no-restricted-globals
        !confirm(
          `Are you sure you want to remove ${pluralize(
            roundsToRemoveCount,
            'round',
          )} of ${event.name}?`,
        )
      ) {
        return;
      }
      // We have too many rounds

      // Rounds to remove may have been part of shared cumulative time limits,
      // so remove these rounds from those groupings
      removeRoundsFromSharedTimeLimits(
        wcifEvents,
        wcifEvent.rounds
          .filter((_, index) => index >= newRoundCount)
          .map((round) => round.id),
      );

      // Remove the extra rounds themselves
      // Note: do this after dealing with cumulative time limits above
      wcifEvent.rounds = _.take(wcifEvent.rounds, newRoundCount);

      // Final rounds must not have an advance to next round requirement.
      if (wcifEvent.rounds.length >= 1) {
        _.last(wcifEvent.rounds).advancementCondition = null;
      }
    } else {
      // We do not have enough rounds, create the missing ones.
      while (wcifEvent.rounds.length < newRoundCount) {
        addRoundToEvent(wcifEvent);
      }
    }
  };

  let roundsCountSelector = null;
  const disabled = !canUpdateEvents;
  if (wcifEvent.rounds) {
    const disableRemove = !canAddAndRemoveEvents;
    roundsCountSelector = (
      <div className="input-group">
        <RoundCountInput
          roundCount={wcifEvent.rounds.length}
          onChange={(e) => setRoundCount(e)}
          disabled={disabled}
        />

        <span className="input-group-btn">
          <button
            type="button"
            className="btn btn-danger btn-xs remove-event"
            disabled={disableRemove}
            title={
              disableRemove
                ? `Cannot remove ${event.name} because the competition is confirmed.`
                : ''
            }
            onClick={removeEvent}
          >
            Remove event
          </button>
        </span>
      </div>
    );
  } else {
    const disableAdd = !canAddAndRemoveEvents;
    roundsCountSelector = (
      <button
        type="button"
        className="btn btn-success btn-xs add-event"
        disabled={disableAdd}
        title={
          disableAdd
            ? `Cannot add ${event.name} because the competition is confirmed.`
            : ''
        }
        onClick={() => setRoundCount(0)}
      >
        Add event
      </button>
    );
  }

  return (
    <div className={`panel panel-default event-${wcifEvent.id}`}>
      <div className="panel-heading">
        <h3 className="panel-title">
          <span
            className={cn('img-thumbnail', 'cubing-icon', `event-${event.id}`)}
          />
          <span className="title">{event.name}</span>
          {' '}
          {roundsCountSelector}
        </h3>
      </div>

      {wcifEvent.rounds && (
        <div className="panel-body">
          <RoundsTable
            wcifEvents={wcifEvents}
            wcifEvent={wcifEvent}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
