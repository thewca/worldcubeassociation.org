import React from 'react';
import { Divider } from 'semantic-ui-react';
import VenueInfo from './FormSections/VenueInfo';
import {
  InputBoolean,
  InputChampionships,
  InputMarkdown,
  InputTextArea,
} from '../wca/FormBuilder/input/FormInputs';
import CompetitorLimit from './FormSections/CompetitorLimit';
import Staff from './FormSections/Staff';
import Website from './FormSections/Website';
import RegistrationFee from './FormSections/RegistrationFees';
import RegistrationDetails from './FormSections/RegistrationDetails';
import EventRestrictions from './FormSections/EventRestrictions';
import NameDetails from './FormSections/NameDetails';
import NearbyComps from './Tables/NearbyComps';
import Series from './FormSections/Series';
import CompDates from './FormSections/CompDates';
import RegistrationDates from './FormSections/RegistrationDates';
import SubSection from '../wca/FormBuilder/SubSection';

export default function MainForm({ isCloning = false }) {
  return (
    <>
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

      <InputTextArea id="remarks" />

      {isCloning && (
        <SubSection section="cloning">
          <InputBoolean id="cloneTabs" />
        </SubSection>
      )}
    </>
  );
}
