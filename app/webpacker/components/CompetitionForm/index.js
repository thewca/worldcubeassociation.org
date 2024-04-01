import React, { useCallback } from 'react';
import {
  Divider,
  Form,
  Message,
} from 'semantic-ui-react';
import VenueInfo from './FormSections/VenueInfo';
import {
  InputBoolean,
  InputChampionships,
  InputMarkdown,
  InputTextArea,
} from './Inputs/FormInputs';
import CompetitorLimit from './FormSections/CompetitorLimit';
import Staff from './FormSections/Staff';
import Website from './FormSections/Website';
import RegistrationFee from './FormSections/RegistrationFees';
import RegistrationDetails from './FormSections/RegistrationDetails';
import EventRestrictions from './FormSections/EventRestrictions';
import Admin from './FormSections/Admin';
import NameDetails from './FormSections/NameDetails';
import NearbyComps from './Tables/NearbyComps';
import Series from './FormSections/Series';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import StoreProvider, { useStore } from '../../lib/providers/StoreProvider';
import useSaveAction from '../../lib/hooks/useSaveAction';
import CompDates from './FormSections/CompDates';
import RegistrationDates from './FormSections/RegistrationDates';
import AnnouncementActions from './AnnouncementActions';
import { createCompetitionUrl, competitionUrl } from '../../lib/requests/routes.js.erb';
import ConfirmationActions, { CreateOrUpdateButton } from './ConfirmationActions';
import UserPreferences from './UserPreferences';
import EditForm, { useInitialFormObject } from '../wca/FormProvider/EditForm';
import SubSection from '../wca/FormProvider/SubSection';

// FIXME: We should consider a better way of accessing the friendly ID instead of hard-coding.
const WCAT_FRIENDLY_ID = 'wcat';

function AnnouncementMessage() {
  const {
    isPersisted,
    isAdminView,
  } = useStore();

  const {
    admin: {
      isConfirmed,
      isVisible,
    },
  } = useInitialFormObject();

  if (!isPersisted) return null;

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
    i18nReplacements = { contact: WCAT_FRIENDLY_ID.toLocaleUpperCase() };
  } else if (!isConfirmed && isVisible) {
    messageStyle = 'error';
    i18nKey = 'competitions.competition_form.is_visible';
  } else if (!isConfirmed && !isVisible) {
    messageStyle = 'warning';
    i18nKey = 'competitions.competition_form.pending_confirmation_html';
    i18nReplacements = { contact: WCAT_FRIENDLY_ID.toLocaleUpperCase() };
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
  onError,
  unsavedChanges,
}) {
  const { isPersisted } = useStore();

  if (isPersisted && !unsavedChanges) {
    return (
      <ConfirmationActions
        createComp={createComp}
        updateComp={updateComp}
        onError={onError}
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

  const { save, saving } = useSaveAction();

  const createComp = useCallback((onSuccess, onError) => {
    save(createCompetitionUrl, competition, onSuccess, { method: 'POST' }, onError);
  }, [competition, save]);

  const updateComp = useCallback((onSuccess, onError) => {
    save(`${competitionUrl(initialCompetition.competitionId)}?adminView=${isAdminView}`, competition, onSuccess, { method: 'PATCH' }, onError);
  }, [competition, initialCompetition.competitionId, isAdminView, save]);

  return (
    <>
      {isPersisted && <AnnouncementActions disabled={unsavedChanges} onError={onError} />}
      {isPersisted && <UserPreferences disabled={unsavedChanges} />}
      <AnnouncementMessage />

      <Form>
        <Admin />
        <NameDetails />
        <VenueInfo />
        <Divider />

        <CompDates />
        <NearbyComps />
        <Series />
        <Divider />

        <RegistrationDates />

        <InputMarkdown id="information" required />

        <CompetitorLimit />
        <Staff />
        <Divider />

        <InputChampionships id="championships" noHint="blank" />
        <Divider />

        <Website />
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
        onError={onError}
        unsavedChanges={unsavedChanges}
      />
    </>
  );
}

export default function Wrapper({
  competition = null,
  usesV2Registrations = false,
  storedEvents = [],
  isAdminView = false,
  isPersisted = false,
  isSeriesPersisted = false,
  isCloning = false,
}) {
  return (
    <StoreProvider
      reducer={_.identity}
      initialState={{
        usesV2Registrations,
        storedEvents,
        isAdminView,
        isPersisted,
        isSeriesPersisted,
        isCloning,
      }}
    >
      <EditForm initialState={competition}>
        <CompetitionForm />
      </EditForm>
    </StoreProvider>
  );
}
