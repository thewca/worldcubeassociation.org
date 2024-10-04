import React, {
  useCallback,
  useEffect,
  useMemo,
} from 'react';

import {
  Button,
  Container,
  Message,
} from 'semantic-ui-react';

import _ from 'lodash';

import { useSaveWcifAction } from '../../lib/utils/wcif';
import { changesSaved } from './store/actions';
import wcifScheduleReducer from './store/reducer';
import Store, { useDispatch, useStore } from '../../lib/providers/StoreProvider';
import ConfirmProvider from '../../lib/providers/ConfirmProvider';
import ManageActivities from './ManageActivities';

function EditSchedule({
  wcifEvents,
  referenceTime,
  calendarLocale,
}) {
  const {
    competitionId,
    wcifSchedule,
    initialWcifSchedule,
  } = useStore();

  const dispatch = useDispatch();

  const unsavedChanges = useMemo(() => (
    !_.isEqual(wcifSchedule, initialWcifSchedule)
  ), [wcifSchedule, initialWcifSchedule]);

  const onUnload = useCallback((e) => {
    // Prompt the user before letting them navigate away from this page with unsaved changes.
    if (unsavedChanges) {
      const confirmationMessage = 'You have unsaved changes, are you sure you want to leave?';
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }

    return null;
  }, [unsavedChanges]);

  useEffect(() => {
    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [onUnload]);

  const { saveWcif, saving } = useSaveWcifAction();

  const save = useCallback(() => {
    saveWcif(
      competitionId,
      { schedule: wcifSchedule },
      () => dispatch(changesSaved()),
    );
  }, [competitionId, dispatch, saveWcif, wcifSchedule]);

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

  const renderIntroductionMessage = () => (
    <Container text>
      <p>
        To create a schedule, first visit the &quot;Manage venues&quot; panel to add venues and rooms/stages.
      </p>
    </Container>
  );

  return (
    <>
      {renderIntroductionMessage()}
      <div>
        {unsavedChanges && renderUnsavedChangesAlert()}
          <ManageActivities
            wcifEvents={wcifEvents}
            referenceTime={referenceTime}
            calendarLocale={calendarLocale}
          />
        {unsavedChanges && renderUnsavedChangesAlert()}
      </div>
    </>
  );
}

export default function Wrapper({
  competitionId,
  wcifEvents,
  wcifSchedule,
  referenceTime,
  calendarLocale,
}) {
  return (
    <Store
      reducer={wcifScheduleReducer}
      initialState={{
        competitionId,
        wcifSchedule,
        initialWcifSchedule: wcifSchedule,
      }}
    >
      <ConfirmProvider>
        <EditSchedule
          wcifEvents={wcifEvents}
          referenceTime={referenceTime}
          calendarLocale={calendarLocale}
        />
      </ConfirmProvider>
    </Store>
  );
}
