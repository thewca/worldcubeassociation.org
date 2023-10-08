import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Button,
  Divider,
  Form,
  Message,
} from 'semantic-ui-react';
import _ from 'lodash';
import VenueInfo from './FormSections/VenueInfo';
import {
  InputDate,
  InputMarkdown,
  InputTextArea,
} from './Inputs/FormInputs';
import CompetitorLimit from './FormSections/CompetitorLimit';
import Staff from './FormSections/Staff';
import Website from './FormSections/Website';
import InputChampionship from './Inputs/InputChampionship';
import PerUserSettings from './FormSections/UserSettings';
import RegistrationFee from './FormSections/RegistrationFees';
import RegistrationDetails from './FormSections/RegistrationDetails';
import EventRestrictions from './FormSections/EventRestrictions';
import Admin from './FormSections/Admin';
import NameDetails from './FormSections/NameDetails';
import NearbyComps from './Tables/NearbyComps';
import RegistrationCollisions from './Tables/RegistrationCollisions';
import Errors from './Errors';
import Series from './FormSections/Series';
import useToggleState from '../../lib/hooks/useToggleState';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import StoreProvider, { useDispatch, useStore } from '../../lib/providers/StoreProvider';
import competitionFormReducer from './store/reducer';
import { changesSaved, setErrors } from './store/actions';
import SectionProvider from './store/sections';
import useSaveAction from '../../lib/hooks/useSaveAction';
import CompDates from './FormSections/CompDates';

// TODO: Need to add cloning params

function AnnouncementMessage() {
  const { competition, persisted } = useStore();

  if (!persisted) return null;

  let messageStyle = null;

  let i18nKey = null;
  let i18nReplacements = {};

  // TODO: Replace the emails
  if (competition.confirmed && competition.showAtAll) {
    messageStyle = 'success';
    i18nKey = 'competitions.competition_form.public_and_locked_html';
  } else if (competition.confirmed && !competition.showAtAll) {
    messageStyle = 'warning';
    i18nKey = 'competitions.competition_form.confirmed_but_not_visible_html';
    i18nReplacements = { contact: 'replace-me' };
  } else if (!competition.confirmed && competition.showAtAll) {
    messageStyle = 'error';
    i18nKey = 'competitions.competition_form.is_visible';
  } else if (!competition.confirmed && !competition.showAtAll) {
    messageStyle = 'warning';
    i18nKey = 'competitions.competition_form.pending_confirmation_html';
    i18nReplacements = { contact: 'replace-me' };
  }

  return (
    <Message error={messageStyle === 'error'} warning={messageStyle === 'warning'} success={messageStyle === 'success'}>
      <I18nHTMLTranslate
        i18nKey={i18nKey}
        options={i18nReplacements}
      />
    </Message>
  );
}

// TODO: There are various parts which have overrides for enabled and disabled which need to done
function NewCompForm() {
  const { competition, initialCompetition, persisted } = useStore();
  const dispatch = useDispatch();

  const { save, saving } = useSaveAction();

  const createComp = useCallback(() => {
    save('/competitions', competition, (data) => {
      dispatch(setErrors(data));
      // TODO we should probably check whether there are _actual_ errors here
      //   -- in the backend, return errors only if there are errors as an error state!
      dispatch(changesSaved());
    }, { method: 'POST' });
  }, [dispatch, competition, save]);

  const updateComp = useCallback(() => {
    save(`/competitions/${initialCompetition.id}`, competition, (data) => {
      dispatch(setErrors(data));
      // TODO see above
      dispatch(changesSaved());
    });
  }, [dispatch, competition, initialCompetition.id, save]);

  const saveComp = useMemo(
    () => (persisted ? updateComp : createComp),
    [persisted, createComp, updateComp],
  );

  const unsavedChanges = useMemo(() => (
    !_.isEqual(competition, initialCompetition)
  ), [competition, initialCompetition]);

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

  const renderUnsavedChangesAlert = () => (
    <Message color="blue">
      You have unsaved changes. Don&apos;t forget to
      {' '}
      <Button
        onClick={saveComp}
        disabled={saving}
        loading={saving}
        color="blue"
      >
        save your changes!
      </Button>
    </Message>
  );

  const [showDebug, setShowDebug] = useToggleState(false);

  return (
    <>
      {unsavedChanges && renderUnsavedChangesAlert()}
      <Button toggle active={showDebug} onClick={setShowDebug}>
        {showDebug ? 'Hide' : 'Show'}
        {' '}
        Debug
      </Button>
      {showDebug && (
        <pre>
          <code>
            {JSON.stringify(competition, null, 2)}
          </code>
        </pre>
      )}
      <Divider />
      <AnnouncementMessage />
      <Errors />
      <Form>
        <Admin />
        <NameDetails />
        <VenueInfo />
        <CompDates />
        <NearbyComps />
        <Series />
        <Divider />

        <Form.Group widths="equal">
          <InputDate id="registration_open" dateTime />
          <InputDate id="registration_close" dateTime />
        </Form.Group>
        <RegistrationCollisions />
        <InputMarkdown id="information" />
        <CompetitorLimit />
        <Staff />
        <Divider />

        <InputChampionship id="championships" />
        <Divider />

        <Website />
        <Divider />

        <PerUserSettings />
        <Divider />

        <RegistrationFee />
        <RegistrationDetails />
        <Divider />

        <EventRestrictions />

        <InputTextArea id="remarks" />
        <Divider />

        <Button onClick={saveComp} primary>{persisted ? 'Update Competition' : 'Create Competition'}</Button>
      </Form>
    </>
  );
}

export default function Wrapper({
  competition = null,
  persisted = false,
  adminView = false,
  organizerView = false,
}) {
  return (
    <StoreProvider
      reducer={competitionFormReducer}
      initialState={{
        unsavedChanges: false,
        competition,
        initialCompetition: competition,
        persisted,
        errors: null,
        adminView,
        organizerView,
      }}
    >
      <SectionProvider>
        <NewCompForm
          competition={competition}
          persisted={persisted}
          adminView={adminView}
          organizerView={organizerView}
        />
      </SectionProvider>
    </StoreProvider>
  );
}
