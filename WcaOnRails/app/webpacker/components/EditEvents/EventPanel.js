import React, { useCallback } from 'react';
import cn from 'classnames';
// import _ from 'lodash';

import events from '../../lib/wca-data/events.js.erb';
import { pluralize } from '../../lib/utils/edit-events';
// import { addRoundToEvent, removeRoundsFromSharedTimeLimits } from './utils';
import RoundsTable from './RoundsTable';
import RoundCountInput from './RoundCountInput';
import { useStore, useDispatch } from '../../lib/providers/StoreProvider';
import { useConfirm } from '../../lib/providers/ConfirmProvider';
import { addRound, removeRounds } from './store/actions';

export default function EventPanel({
  wcifEvent,
}) {
  const {
    wcifEvents, canAddAndRemoveEvents, canUpdateEvents,
  } = useStore();
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const disabled = !canUpdateEvents;
  const event = events.byId[wcifEvent.id];

  const removeEvent = useCallback(() => {
    if (!wcifEvent.rounds || (wcifEvent.rounds.length > 0)) {
      confirm({
        content: `Are you sure you want to remove all ${pluralize(
          wcifEvent.rounds.length,
          'round',
        )} of ${event.name}?`,
      })
        .then(() => {
          dispatch(removeEvent(wcifEvent));

          // // before removing all rounds of the event, remove those rounds from any
          // // shared cumulative time limits
          // removeRoundsFromSharedTimeLimits(
          //   wcifEvents,
          //   wcifEvent.rounds.map((round) => round.id),
          // );

          // // remove the rounds themselves
          // wcifEvent.rounds = null;
        });
    }
  }, [wcifEvent, wcifEvents, dispatch, confirm]);

  const setRoundCount = useCallback((newRoundCount) => {
    // wcifEvent.rounds = wcifEvent.rounds || [];

    const roundsToRemoveCount = wcifEvent.rounds.length - newRoundCount;

    if (roundsToRemoveCount > 0) {
      // remove the rounds
      confirm({
        content: `Are you sure you want to remove ${pluralize(
          roundsToRemoveCount,
          'round',
        )} of ${event.name}?`,
      }).then(() => {
        dispatch(removeRounds(wcifEvent.id, roundsToRemoveCount));
        // // We have too many rounds

        // // Rounds to remove may have been part of shared cumulative time limits,
        // // so remove these rounds from those groupings
        // removeRoundsFromSharedTimeLimits(
        //   wcifEvents,
        //   wcifEvent.rounds
        //     .filter((v, index) => index >= newRoundCount)
        //     .map((round) => round.id),
        // );

        // // Remove the extra rounds themselves
        // // Note: do this after dealing with cumulative time limits above
        // wcifEvent.rounds = _.take(wcifEvent.rounds, newRoundCount);

        // Final rounds must not have an advance to next round requirement.
        // if (wcifEvent.rounds.length >= 1) {
        //   _.last(wcifEvent.rounds).advancementCondition = null;
        // }
      });
    } else {
      // We do not have enough rounds, create the missing ones.
      while (wcifEvent.rounds.length < newRoundCount) {
        // addRoundToEvent(wcifEvent);
        dispatch(addRound(wcifEvent.id));
      }
    }
  }, [wcifEvent, wcifEvents, dispatch, confirm]);

  const renderRoundCountInputs = () => {
    if (wcifEvent.rounds) {
      return (
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
              disabled={!canAddAndRemoveEvents}
              title={
                !canAddAndRemoveEvents
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
    }

    return (
      <button
        type="button"
        className="btn btn-success btn-xs add-event"
        disabled={!canAddAndRemoveEvents}
        title={
          !canAddAndRemoveEvents
            ? `Cannot add ${event.name} because the competition is confirmed.`
            : ''
        }
        onClick={() => setRoundCount(0)}
      >
        Add event
      </button>
    );
  };

  return (
    <div className={`panel panel-default event-${wcifEvent.id}`}>
      <div className="panel-heading">
        <h3 className="panel-title">
          <span
            className={cn('img-thumbnail', 'cubing-icon', `event-${event.id}`)}
          />
          <span className="title">{event.name}</span>
          {' '}
          {renderRoundCountInputs()}
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
