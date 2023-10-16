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
  InputBoolean,
  InputChampionships,
  InputDate,
  InputMarkdown,
  InputTextArea,
} from './Inputs/FormInputs';
import CompetitorLimit from './FormSections/CompetitorLimit';
import Staff from './FormSections/Staff';
import Website from './FormSections/Website';
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
import SubSection from './FormSections/SubSection';
import AnnouncementActions from './AnnouncementActions';

// TODO: Need to add cloning params

function AnnouncementMessage() {
  const {
    competition: {
      admin: {
        isConfirmed,
        isVisible,
      },
    },
    isPersisted,
  } = useStore();

  if (!isPersisted) return null;

  let messageStyle = null;

  let i18nKey = null;
  let i18nReplacements = {};

  // TODO: Replace the emails
  if (isConfirmed && isVisible) {
    messageStyle = 'success';
    i18nKey = 'competitions.competition_form.public_and_locked_html';
  } else if (isConfirmed && !isVisible) {
    messageStyle = 'warning';
    i18nKey = 'competitions.competition_form.confirmed_but_not_visible_html';
    i18nReplacements = { contact: 'replace-me' };
  } else if (!isConfirmed && isVisible) {
    messageStyle = 'error';
    i18nKey = 'competitions.competition_form.is_visible';
  } else if (!isConfirmed && !isVisible) {
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
  const {
    competition,
    initialCompetition,
    isPersisted,
    isCloning,
  } = useStore();
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
    () => (isPersisted ? updateComp : createComp),
    [isPersisted, createComp, updateComp],
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

      {isPersisted && <AnnouncementActions />}
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

        <SubSection section="registration">
          <Form.Group widths="equal">
            <InputDate id="openingDateTime" dateTime />
            <InputDate id="closingDateTime" dateTime />
          </Form.Group>
          <RegistrationCollisions />
        </SubSection>

        <InputMarkdown id="information" />

        <CompetitorLimit />
        <Staff />
        <Divider />

        <InputChampionships id="championships" noHint="blank" />
        <Divider />

        <Website />
        <Divider />

        <PerUserSettings />
        <Divider />

        <RegistrationDetails />
        <RegistrationFee />
        <Divider />

        <EventRestrictions />

        <InputTextArea id="remarks" />

        {isCloning && (
          <SubSection section="cloning">
            <InputBoolean id="cloneTabs" />
          </SubSection>
        )}

        <Divider />

        <Button onClick={saveComp} primary>{isPersisted ? 'Update Competition' : 'Create Competition'}</Button>
      </Form>
    </>
  );
}

export default function Wrapper({
  competition = null,
  isAdminView = false,
  isPersisted = false,
  isCloning = false,
}) {
  return (
    <StoreProvider
      reducer={competitionFormReducer}
      initialState={{
        competition,
        initialCompetition: competition,
        errors: null,
        isAdminView,
        isPersisted,
        isCloning,
      }}
    >
      <SectionProvider>
        <NewCompForm />
      </SectionProvider>
    </StoreProvider>
  );
}
