import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Accordion,
  Button,
  Container,
  Message,
} from 'semantic-ui-react';

import _ from 'lodash';

import { events } from '../../lib/wca-data.js.erb';

import { saveWcif } from '../../lib/utils/wcif';
import { changesSaved } from './store/actions';
import wcifScheduleReducer from './store/reducer';
import Store, { useDispatch, useStore } from '../../lib/providers/StoreProvider';
import ConfirmProvider from '../../lib/providers/ConfirmProvider';
import EditVenues from './EditVenues';
import EditActivities from './EditActivities';

function EditScheduleNew({
  wcifEvents,
  countryZones,
  calendarLocale,
}) {
  const {
    competitionId,
    wcifSchedule,
    initialWcifSchedule,
  } = useStore();

  const dispatch = useDispatch();

  const [saving, setSaving] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(-1);

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

  const save = useCallback(() => {
    setSaving(true);

    const onSuccess = () => {
      setSaving(false);
      dispatch(changesSaved());
    };

    const onFailure = () => {
      setSaving(false);
    };

    saveWcif(competitionId, { schedule: wcifSchedule }, onSuccess, onFailure);
  }, [competitionId, dispatch, wcifSchedule]);

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
        So you can start creating the competition&rsquo;s schedule below by adding at
        least one venue with one room.
        Then you will be able to select this room in the &quot;Edit schedules&quot;
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

  const handleAccordionClick = (evt, titleProps) => {
    const { index } = titleProps;
    const newIndex = openAccordion === index ? -1 : index;

    setOpenAccordion(newIndex);
  };

  return (
    <>
      {renderIntroductionMessage()}
      <div>
        {unsavedChanges && renderUnsavedChangesAlert()}
        <Accordion fluid styled>
          <Accordion.Title
            index={0}
            active={openAccordion === 0}
            onClick={handleAccordionClick}
          >
            Edit venues information
          </Accordion.Title>
          <Accordion.Content
            active={openAccordion === 0}
          >
            <EditVenues
              countryZones={countryZones}
            />
          </Accordion.Content>
          <Accordion.Title
            index={1}
            active={openAccordion === 1}
            onClick={handleAccordionClick}
          >
            Edit schedules
          </Accordion.Title>
          <Accordion.Content
            active={openAccordion === 1}
          >
            <EditActivities
              wcifEvents={wcifEvents}
              calendarLocale={calendarLocale}
            />
          </Accordion.Content>
        </Accordion>
        {unsavedChanges && renderUnsavedChangesAlert()}
      </div>
    </>
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
  wcifEvents,
  wcifSchedule,
  countryZones,
  calendarLocale,
}) {
  const normalizedEvents = normalizeWcifEvents(wcifEvents);

  return (
    <Store
      reducer={wcifScheduleReducer}
      initialState={{
        competitionId,
        wcifSchedule,
        initialWcifSchedule: wcifSchedule,
        unsavedChanges: false,
      }}
    >
      <ConfirmProvider>
        <EditScheduleNew
          countryZones={countryZones}
          wcifEvents={normalizedEvents}
          calendarLocale={calendarLocale}
        />
      </ConfirmProvider>
    </Store>
  );
}
