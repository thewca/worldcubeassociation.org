import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Button,
  Divider,
  Form,
  Message, Sticky,
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
import FormErrors from './FormErrors';
import Series from './FormSections/Series';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import StoreProvider, { useDispatch, useStore } from '../../lib/providers/StoreProvider';
import competitionFormReducer from './store/reducer';
import { changesSaved, setErrors } from './store/actions';
import SectionProvider from './store/sections';
import useSaveAction from '../../lib/hooks/useSaveAction';
import CompDates from './FormSections/CompDates';
import SubSection from './FormSections/SubSection';
import AnnouncementActions from './AnnouncementActions';
import { teams } from '../../lib/wca-data.js.erb';
import { createCompetitionUrl, competitionUrl } from '../../lib/requests/routes.js.erb';
import ConfirmationActions, { CreateOrUpdateButton } from './ConfirmationActions';

function AnnouncementMessage() {
  const {
    initialCompetition: {
      admin: {
        isConfirmed,
        isVisible,
      },
    },
    isPersisted,
    isAdminView,
  } = useStore();

  if (!isPersisted) return null;

  const wcatTeam = teams.byId.wcat;

  let messageStyle = null;

  let i18nKey = null;
  let i18nReplacements = {};

  if (isConfirmed && isVisible) {
    if (isAdminView) return null;

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
  unsavedChanges,
}) {
  const { isPersisted } = useStore();

  if (isPersisted && !unsavedChanges) {
    return (
      <ConfirmationActions
        createComp={createComp}
        updateComp={updateComp}
      />
    );
  }

  return (
    <>
      {unsavedChanges && (
        <Message info>
          You have unsaved changes. Please save the competition before taking any other action.
        </Message>
      )}
      <CreateOrUpdateButton
        createComp={createComp}
        updateComp={updateComp}
      />
    </>
  );
}

function CompetitionForm() {
  const {
    competition,
    initialCompetition,
    isPersisted,
    isCloning,
    isAdminView,
  } = useStore();
  const dispatch = useDispatch();

  const { save, saving } = useSaveAction();

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

  const onSuccess = useCallback((data) => {
    const { redirect } = data;

    if (redirect) {
      window.removeEventListener('beforeunload', onUnload);
      window.location.replace(redirect);
    } else {
      dispatch(changesSaved());
      dispatch(setErrors(null));
    }
  }, [dispatch, onUnload]);

  const onError = useCallback((err) => {
    // check whether the 'json' and 'response' properties are set,
    // which means it's (very probably) a FetchJsonError
    if (err.json !== undefined && err.response !== undefined) {
      // The 'error' property means we pasted a generic error message in the backend.
      if (err.json.error !== undefined) {
        // json schema errors have only one error message, but our frontend supports
        // an arbitrary number of messages per property. So we wrap it in an array.
        if (err.response.status === 422 && err.json.schema !== undefined) {
          const jsonSchemaError = {
            [err.json.jsonProperty]: [
              `Did not match the expected format: ${JSON.stringify(err.json.schema)}`,
            ],
          };

          dispatch(setErrors(jsonSchemaError));
        }
      } else {
        dispatch(setErrors(err.json));
      }
    } else {
      throw err;
    }
  }, [dispatch]);

  const createComp = useCallback(() => {
    save(createCompetitionUrl, competition, onSuccess, { method: 'POST' }, onError);
  }, [competition, save, onSuccess, onError]);

  const updateComp = useCallback(() => {
    save(`${competitionUrl(initialCompetition.competitionId)}?adminView=${isAdminView}`, competition, onSuccess, { method: 'PATCH' }, onError);
  }, [competition, initialCompetition.competitionId, isAdminView, save, onSuccess, onError]);

  useEffect(() => {
    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [onUnload]);

  const renderUnsavedChangesAlert = () => (
    <Message info>
      You have unsaved changes. Don&apos;t forget to
      {' '}
      <Button
        onClick={isPersisted ? updateComp : createComp}
        disabled={saving}
        loading={saving}
        primary
      >
        save your changes!
      </Button>
    </Message>
  );

  const stickyRef = useRef();

  return (
    <div ref={stickyRef}>
      {unsavedChanges && (
        <Sticky context={stickyRef} offset={20} styleElement={{ zIndex: 2000 }}>
          {renderUnsavedChangesAlert()}
        </Sticky>
      )}

      {isPersisted && <AnnouncementActions disabled={unsavedChanges} />}
      <AnnouncementMessage />
      <FormErrors />

      <Form>
        <Admin />
        <NameDetails />
        <VenueInfo />
        <Divider />

        <CompDates />
        <NearbyComps />
        <Series />
        <Divider />

        <SubSection section="registration">
          <Form.Group widths="equal">
            <InputDate id="openingDateTime" dateTime required />
            <InputDate id="closingDateTime" dateTime required />
          </Form.Group>
          <RegistrationCollisions />
        </SubSection>

        <InputMarkdown id="information" required />

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
      </Form>

      <Divider />

      <BottomConfirmationPanel
        createComp={createComp}
        updateComp={updateComp}
        unsavedChanges={unsavedChanges}
      />
    </div>
  );
}

export default function Wrapper({
  competition = null,
  storedEvents = [],
  isAdminView = false,
  isPersisted = false,
  isSeriesPersisted = false,
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
        isSeriesPersisted,
        isCloning,
      }}
    >
      <SectionProvider>
        <CompetitionForm />
      </SectionProvider>
    </StoreProvider>
  );
}
