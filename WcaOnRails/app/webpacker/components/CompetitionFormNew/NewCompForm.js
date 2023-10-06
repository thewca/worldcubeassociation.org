import React from 'react';
import {
  Button,
  Divider,
  Form,
  Message,
} from 'semantic-ui-react';
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
import { setErrors } from './store/actions';
import SectionProvider from './store/sections';
import useSaveAction from '../../lib/hooks/useSaveAction';

// TODO: Need to add cloning params

function FormActions() {
  const {
    persisted,
    competition,
    initialCompetition,
  } = useStore();

  const dispatch = useDispatch();

  const { save, saving } = useSaveAction();

  const createComp = () => {
    save('/competitions', competition, (data) => { dispatch(setErrors(data)); }, { method: 'POST' });
  };

  const updateComp = () => {
    save(`/competitions/${initialCompetition.id}`, competition, (data) => { dispatch(setErrors(data)); });
  };

  // TODO should we handle stuff like this in the save hook?
  /* if (response.redirected) {
    window.location.replace(response.url);
    return;
  } */

  if (persisted) {
    return (
      <Button onClick={updateComp} primary>Update Competition</Button>
    );
  }

  return (
    <Button onClick={createComp} primary>Create Competition</Button>
  );
}

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
  const { competition } = useStore();

  const [showDebug, setShowDebug] = useToggleState(false);

  return (
    <>
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
        <Form.Group widths="equal">
          <InputDate id="start_date" />
          <InputDate id="end_date" />
        </Form.Group>
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

        <FormActions />
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
