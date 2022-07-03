import React, { useCallback } from 'react';
import cn from 'classnames';
// import _ from 'lodash';

import I18n from 'i18n-js';
import {
  Button, Header, Rail, Segment,
} from 'semantic-ui-react';
import events from '../../../lib/wca-data/events.js.erb';
import { pluralize } from '../../../lib/utils/edit-events';
// import { addRoundToEvent, removeRoundsFromSharedTimeLimits } from './utils';
import RoundsTable from './RoundsTable';
import RoundCountInput from './RoundCountInput';
import { useStore, useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { addRound, removeRounds } from '../store/actions';
import { EditQualificationModal } from '../Modals';

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
  }, [wcifEvent, confirm, event.name, dispatch]);

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
      // We do not have enough rounds any or we do not have enough rounds: create the missing ones.
      while (!wcifEvent.rounds || wcifEvent.rounds.length < newRoundCount) {
        // addRoundToEvent(wcifEvent);
        dispatch(addRound(wcifEvent.id));
      }
    }
  }, [wcifEvent.rounds, wcifEvent.id, confirm, event.name, dispatch]);

  const renderRoundCountInputs = () => {
    if (wcifEvent.rounds) {
      return (
        <>
          <RoundCountInput
            roundCount={wcifEvent.rounds.length}
            onChange={(e) => setRoundCount(e)}
            disabled={disabled}
          />

          <Button
            disabled={!canAddAndRemoveEvents}
            title={
              !canAddAndRemoveEvents
                ? `Cannot remove ${event.name} because the competition is confirmed.`
                : ''
            }
            onClick={removeEvent}
            color="red"
            size="tiny"
            style={{
              fontSize: '.75em',
            }}
          >
            Remove event
          </Button>
        </>
      );
    }

    return (
      <Button
        className="add-event"
        disabled={!canAddAndRemoveEvents}
        title={
          !canAddAndRemoveEvents
            ? `Cannot add ${event.name} because the competition is confirmed.`
            : ''
        }
        onClick={() => setRoundCount(0)}
        color="green"
        size="tiny"
        style={{
          fontSize: '.75em',
        }}
      >
        Add event
      </Button>
    );
  };

  return (
    <Segment.Group
      size="tiny"
      compact
      className={`event-${wcifEvent.id}`}
      style={{
        width: '100%',
      }}
    >

      <Header
        className="event-panel__heading"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
        attached
      >
        <div
          style={{
            margin: '-1.5em -1em',
          }}
        >
          <span className={cn('img-thumbnail', 'cubing-icon', `event-${event.id}`)} />
        </div>
        <span
          className="title"
          style={{
            flexGrow: 1,
            marginLeft: '2em',
          }}
        >
          {event.name}

        </span>
        <div>
          {renderRoundCountInputs()}
        </div>
      </Header>

      {wcifEvent.rounds && (
        <RoundsTable
          wcifEvents={wcifEvents}
          wcifEvent={wcifEvent}
          disabled={disabled}
        />
      )}
      <Segment>
        <h5 style={{ display: 'inline' }}>
          <span style={{ marginRight: '0.25em' }}>
            {I18n.t('competitions.events.qualification')}
            :
          </span>
          <EditQualificationModal wcifEvent={wcifEvent} disabled={disabled} />
        </h5>
      </Segment>
    </Segment.Group>
  );
}
