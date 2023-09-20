import React, { useCallback, useMemo, useState } from 'react';
import _ from 'lodash';

import { Button, Message } from 'semantic-ui-react';
import { events } from '../../lib/wca-data.js.erb';

import { saveWcif } from '../../lib/utils/wcif';
import EventPanel from './EventPanel';
import { changesSaved } from './store/actions';
import wcifEventsReducer from './store/reducer';
import Store, { useDispatch, useStore } from '../../lib/providers/StoreProvider';
import ConfirmProvider from '../../lib/providers/ConfirmProvider';

function EditEvents() {
  const {
    competitionId, wcifEvents, initialWcifEvents,
  } = useStore();
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);

  const unsavedChanges = useMemo(() => (
    !_.isEqual(wcifEvents, initialWcifEvents)
  ), [wcifEvents, initialWcifEvents]);

  const onUnload = useCallback((e) => {
    // Prompt the user before letting them navigate away from this page with unsaved changes.
    if (unsavedChanges) {
      const confirmationMessage = 'You have unsaved changes, are you sure you want to leave?';
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }

    return null;
  }, [unsavedChanges]);

  useState(() => {
    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [onUnload]);

  const save = useCallback(() => {
    setSaving(true);

    const onSuccess = () => {
      setSaving(false);
      dispatch(changesSaved());
    };

    const onFailure = () => {
      setSaving(false);
    };

    saveWcif(competitionId, { events: wcifEvents }, onSuccess, onFailure);
  }, [competitionId, dispatch, wcifEvents]);

  const renderUnsavedChangesAlert = () => (
    <Message color="blue">
      You have unsaved changes. Don&apos;t forget to
      {' '}
      <Button
        onClick={save}
        disabled={saving}
        loading={saving}
        color="blue"
      >
        save your changes!
      </Button>
    </Message>
  );

  return (
    <div>
      {unsavedChanges && renderUnsavedChangesAlert()}
      <div
        style={{
          // https://css-tricks.com/an-auto-filling-css-grid-with-max-columns/
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(max(400px, calc((100% - calc(calc(3 - 1) * 1em)) / 3)), 1fr))',
          gridGap: '1em',
          alignItems: 'baseline',
        }}
        className="event-panel-container"
      >
        {wcifEvents.map((wcifEvent) => (
          <EventPanel key={wcifEvent.id} wcifEvent={wcifEvent} />
        ))}
      </div>
      {unsavedChanges && renderUnsavedChangesAlert()}
    </div>
  );
}

function normalizeWcifEvents(wcifEvents) {
  // Since we want to support deprecated events and be able to edit their rounds,
  // we want to show deprecated events if they exist in the WCIF, but not if they
  // don't.
  // Therefore we first build the list of events from the official one, updating
  // it with WCIF data if any.
  // And then we add all events that are still in the WCIF (which means they are
  // not official anymore).
  const ret = events.official.map(
    (event) => _.remove(wcifEvents, { id: event.id })[0] || {
      id: event.id,
      rounds: null,
    },
  );
  return ret.concat(wcifEvents);
}

export default function Wrapper({
  competitionId,
  canAddAndRemoveEvents,
  canUpdateEvents,
  canUpdateQualifications,
  wcifEvents,
}) {
  const normalizedEvents = normalizeWcifEvents(wcifEvents);

  return (
    <Store
      reducer={wcifEventsReducer}
      initialState={{
        competitionId,
        canAddAndRemoveEvents,
        canUpdateEvents,
        canUpdateQualifications,
        wcifEvents: normalizedEvents,
        initialWcifEvents: normalizedEvents,
        unsavedChanges: false,
      }}
    >
      <ConfirmProvider>
        <EditEvents />
      </ConfirmProvider>
    </Store>
  );
}
