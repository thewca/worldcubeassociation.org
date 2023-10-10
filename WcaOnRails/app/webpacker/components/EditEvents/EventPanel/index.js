import React from 'react';

import {
  Button,
  Card,
  Header,
  Icon,
  Label, Segment,
} from 'semantic-ui-react';
import i18n from '../../../lib/i18n';
import { events } from '../../../lib/wca-data.js.erb';
import { pluralize } from '../../../lib/utils/edit-events';
import RoundsTable from './RoundsTable';
import RoundCountInput from './RoundCountInput';
import { useStore, useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import {
  addEvent, addRounds, removeEvent, removeRounds,
} from '../store/actions';
import { EditQualificationModal } from '../Modals';

export default function EventPanel({
  wcifEvent,
}) {
  const {
    wcifEvents, canAddAndRemoveEvents, canUpdateEvents, canUpdateQualifications,
  } = useStore();
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const disabled = !canUpdateEvents;
  const event = events.byId[wcifEvent.id];

  const handleRemoveEvent = () => {
    if (wcifEvent.rounds && wcifEvent.rounds.length > 0) {
      confirm({
        content: `Are you sure you want to remove all ${pluralize(
          wcifEvent.rounds.length,
          'round',
        )} of ${event.name}?`,
      })
        .then(() => {
          dispatch(removeEvent(wcifEvent.id));
        });
    } else {
      dispatch(removeEvent(wcifEvent.id));
    }
  };

  const setRoundCount = (newRoundCount) => {
    const roundsToRemoveCount = wcifEvent.rounds.length - newRoundCount;

    if (roundsToRemoveCount > 0) {
      // remove the rounds
      confirm({
        content: `Are you sure you want to remove ${pluralize(
          roundsToRemoveCount,
          'round',
        )} of ${event.name}?`,
      }).then(() => {
        // We have too many rounds
        dispatch(removeRounds(wcifEvent.id, roundsToRemoveCount));
      });
    } else {
      // We do not have enough rounds any or we do not have enough rounds: create the missing ones.
      dispatch(addRounds(wcifEvent.id, newRoundCount - wcifEvent.rounds.length));
    }
  };

  const renderRoundCountInputs = () => {
    if (wcifEvent.rounds) {
      return (
        <>
          <RoundCountInput
            roundCount={wcifEvent.rounds.length}
            onChange={setRoundCount}
            disabled={disabled}
          />

          <Button
            disabled={!canAddAndRemoveEvents}
            title={
              !canAddAndRemoveEvents
                ? `Cannot remove ${event.name} because the competition is confirmed.`
                : ''
            }
            onClick={handleRemoveEvent}
            negative
            size="small"
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
        onClick={() => dispatch(addEvent(wcifEvent.id))}
        positive
        size="small"
      >
        Add event
      </Button>
    );
  };

  return (
    <Card
      size="tiny"
      compact
      className={`event-panel event-${wcifEvent.id}`}
    >
      <Card.Content
        // replicate the way SemUI Cards handle images (borderless) without an actual image
        style={{ padding: 0 }}
      >
        <Segment basic tertiary>
          <Header as="span">
            <Icon className="cubing-icon" name={`event-${event.id}`} />
            <Header.Content>
              {event.name}
            </Header.Content>
          </Header>
          <Button.Group floated="right">
            {renderRoundCountInputs()}
          </Button.Group>
        </Segment>
      </Card.Content>
      {wcifEvent.rounds !== null && (
        <>
          <Card.Content>
            <RoundsTable
              wcifEvents={wcifEvents}
              wcifEvent={wcifEvent}
              disabled={disabled}
            />
          </Card.Content>
          <Card.Content>
            <Label basic>
              {i18n.t('competitions.events.qualification')}
              :
            </Label>
            {/* Qualifications cannot be edited after the competition has been announced. */}
            {/* Qualifications cannot be added if the box from the competition form is unchecked. */}
            <EditQualificationModal
              wcifEvent={wcifEvent}
              disabled={
                disabled || !canAddAndRemoveEvents || !canUpdateQualifications
              }
              disabledReason={
                // todo: translations?
                canUpdateQualifications
                  ? undefined
                  : 'Turn on Qualifications under Edit > Organizer View and add a reason.'
              }
            />
          </Card.Content>
        </>
      )}
    </Card>
  );
}
