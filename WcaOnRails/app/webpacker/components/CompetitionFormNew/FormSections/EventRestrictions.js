import React, { useContext } from 'react';
import { Divider } from 'semantic-ui-react';
import SubSection from './SubSection';
import {
  InputBoolean,
  InputBooleanSelect,
  InputNumber,
  InputSelect,
  InputTextArea,
} from '../Inputs/FormInputs';
import FormContext from '../State/FormContext';
import { events } from '../../../lib/wca-data.js.erb';

const mainEventOptions = events.official.map((event) => ({
  key: event.id,
  value: event.id,
  text: event.name,
}));

mainEventOptions.unshift({
  key: '',
  value: '',
  text: '',
});

export default function EventRestrictions() {
  const restrictionsData = useContext(FormContext).formData.eventRestrictions;

  const earlySubmission = restrictionsData && restrictionsData.early_puzzle_submission === 'true';
  const needQualification = restrictionsData && restrictionsData.qualification_results === 'true';
  const restrictEvents = restrictionsData && restrictionsData.event_restrictions === 'true';
  return (
    <SubSection section="eventRestrictions">
      <InputBoolean id="early_puzzle_submission" />
      {earlySubmission && <InputTextArea id="early_puzzle_submission_reason" />}
      <InputBoolean id="qualification_results" />
      {needQualification && <InputTextArea id="qualification_results_reason" />}
      {needQualification && <InputBooleanSelect id="allow_registration_without_qualification" />}
      <InputBoolean id="event_restrictions" />
      {restrictEvents && <InputTextArea id="event_restrictions_reason" />}
      {restrictEvents && <InputNumber id="events_per_registration_limit" />}
      <Divider />
      <InputSelect id="main_event_id" options={mainEventOptions} />
    </SubSection>
  );
}
