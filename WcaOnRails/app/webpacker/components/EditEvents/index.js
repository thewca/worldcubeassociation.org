import React, { useCallback, useState } from 'react';
import cn from 'classnames';
// import _ from 'lodash';

import {
  saveWcif,
} from '../../lib/utils/wcif';

import EventPanel from './EventPanel';
import { changesSaved } from './store/actions';
import wcifEventsReducer from './store/reducer';
import Store, { useStore } from '../../lib/providers/StoreProvider';

function EditEvents() {
  const {
    store: {
      competitionId, wcifEvents, canAddAndRemoveEvents, canUpdateEvents, unsavedChanges,
    }, dispatch,
  } = useStore();
  const [saving, setSaving] = useState(false);

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
  }, []);

  const renderUnsavedChangesAlert = () => (
    <div className="alert alert-info">
      You have unsaved changes. Don&apos;t forget to
      {' '}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className={cn('btn', 'btn-default btn-primary', {
          saving,
        })}
      >
        save your changes!
      </button>
    </div>
  );

  return (
    <Store>
      {unsavedChanges() && renderUnsavedChangesAlert()}
      <div className="row equal">
        {wcifEvents.map((wcifEvent) => (
          <div
            key={wcifEvent.id}
            className="col-xs-12 col-sm-12 col-md-12 col-lg-4"
          >
            <EventPanel
              wcifEvents={wcifEvents}
              wcifEvent={wcifEvent}
              canAddAndRemoveEvents={canAddAndRemoveEvents}
              canUpdateEvents={canUpdateEvents}
            />
          </div>
        ))}
      </div>
      {unsavedChanges}
    </Store>
  );
}

export default function Wrapper({
  competitionId, canAddAndRemoveEvents, canUpdateEvents, wcifEvents,
}) {
  return (
    <Store
      reducer={wcifEventsReducer}
      initialState={{
        competitionId,
        canAddAndRemoveEvents,
        canUpdateEvents,
        events: wcifEvents,
        unsavedChanges: false,
      }}
    >
      <EditEvents />
    </Store>
  );
}
