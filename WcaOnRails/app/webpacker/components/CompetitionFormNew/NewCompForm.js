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
import { changesSaved } from './store/actions';
import SectionProvider from './store/sections';
import useSaveAction from '../../lib/hooks/useSaveAction';
import CompDates from './FormSections/CompDates';
import SubSection from './FormSections/SubSection';
import AnnouncementActions from './AnnouncementActions';
import { teams } from '../../lib/wca-data.js.erb';
import ConfirmationActions, { CreateOrUpdateButton } from './ConfirmationActions';

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

  const wcatTeam = teams.byId.wcat;

  let messageStyle = null;

  let i18nKey = null;
  let i18nReplacements = {};

  if (isConfirmed && isVisible) {
    messageStyle = 'success';
    i18nKey = 'competitions.competition_form.public_and_locked_html';
  } else if (isConfirmed && !isVisible) {
    messageStyle = 'warning';
    i18nKey = 'competitions.competition_form.confirmed_but_not_visible_html';
    i18nReplacements = { contact: wcatTeam.email };
  } else if (!isConfirmed && isVisible) {
    messageStyle = 'error';
    i18nKey = 'competitions.competition_form.is_visible';
  } else if (!isConfirmed && !isVisible) {
    messageStyle = 'warning';
    i18nKey = 'competitions.competition_form.pending_confirmation_html';
    i18nReplacements = { contact: wcatTeam.email };
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

function BottomConfirmationPanel({
  createComp,
  updateComp,
}) {
  const { isPersisted } = useStore();

  // we only want to fetch data about confirming/deleting a competition when it's already persisted
  // but we cannot wrap the "useLoadedData" call itself into an if-statement because then
  // React suddenly becomes a crybaby about "rules of hooks". So we hack around it this way instead.
  if (isPersisted) {
    return (
      <ConfirmationActions
        createComp={createComp}
        updateComp={updateComp}
      />
    );
  }

  return (
    <CreateOrUpdateButton
      createComp={createComp}
      updateComp={updateComp}
    />
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

  const onSuccess = useCallback(() => dispatch(changesSaved()), [dispatch]);

  const onError = useCallback((err) => {
    // TODO
    throw err;
  }, []);

  const createComp = useCallback(() => {
    save('/competitions', competition, onSuccess, { method: 'POST' }, onError);
  }, [competition, save, onSuccess, onError]);

  const updateComp = useCallback(() => {
    save(`/competitions/${initialCompetition.id}`, competition, onSuccess, { method: 'PATCH' }, onError);
  }, [competition, initialCompetition.id, save, onSuccess, onError]);

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
        onClick={isPersisted ? updateComp : createComp}
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

        <InputTextArea id="remarks" disabled={competition.admin.isConfirmed} />

        {isCloning && (
          <SubSection section="cloning">
            <InputBoolean id="cloneTabs" />
          </SubSection>
        )}

        <Divider />

        <BottomConfirmationPanel
          createComp={createComp}
          updateComp={updateComp}
        />
      </Form>
    </>
  );
}

export default function Wrapper({
  competition = null,
  storedEvents = [],
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
        storedEvents,
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
