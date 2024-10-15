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
import ManageVenues from './ManageVenues';

function EditVenues({
  countryZones,
  referenceTime,
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
        Depending on the size and setup of the competition, it may take place in
        several rooms of several venues.
        Therefore a schedule is necessarily linked to a specific room.
        Each room may have its own schedule (with all or a subset of events).
        To create the competition&rsquo;s schedule, start by adding at
        least one venue with one room below.
        Then you will be able to select this room in the &quot;Manage schedule&quot;
        panel, and drag and drop event rounds (or attempts for some events) on it.
      </p>
      <p>
        For the typical simple competition, creating one &quot;Main venue&quot;
        with one &quot;Main room&quot; is enough.
        If your competition has a single venue but multiple &quot;stages&quot; with different
        schedules, please input them as different rooms.
      </p>
    </Container>
  );

  return (
    <>
      {renderIntroductionMessage()}
      <div>
        {unsavedChanges && renderUnsavedChangesAlert()}
        <ManageVenues
          countryZones={countryZones}
          referenceTime={referenceTime}
        />
        {unsavedChanges && renderUnsavedChangesAlert()}
      </div>
    </>
  );
}

export default function Wrapper({
  competitionId,
  wcifSchedule,
  countryZones,
  referenceTime,
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
        <EditVenues
          countryZones={countryZones}
          referenceTime={referenceTime}
        />
      </ConfirmProvider>
    </Store>
  );
}
