import React from 'react';
import { Divider } from 'semantic-ui-react';
import SubSection from './SubSection';
import {
  InputBoolean,
  InputBooleanSelect,
  InputNumber,
  InputSelect,
  InputTextArea,
} from '../Inputs/FormInputs';
import { events } from '../../../lib/wca-data.js.erb';
import { useStore } from '../../../lib/providers/StoreProvider';
import ConditionalSection from './ConditionalSection';

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
  const { competition: { eventRestrictions: restrictionsData } } = useStore();

  const earlySubmission = restrictionsData && restrictionsData.early_puzzle_submission;
  const needQualification = restrictionsData && restrictionsData.qualification_results;
  const restrictEvents = restrictionsData && restrictionsData.event_restrictions;

  return (
    <SubSection section="eventRestrictions">
      <InputBoolean id="early_puzzle_submission" />
      <ConditionalSection showIf={earlySubmission}>
        <InputTextArea id="early_puzzle_submission_reason" />
      </ConditionalSection>
      <InputBoolean id="qualification_results" />
      <ConditionalSection showIf={needQualification}>
        <InputTextArea id="qualification_results_reason" />
        <InputBooleanSelect id="allow_registration_without_qualification" />
      </ConditionalSection>
      <InputBoolean id="event_restrictions" />
      <ConditionalSection showIf={restrictEvents}>
        <InputTextArea id="event_restrictions_reason" />
        <InputNumber id="events_per_registration_limit" />
      </ConditionalSection>
      <Divider />
      <InputSelect id="main_event_id" options={mainEventOptions} />
    </SubSection>
  );
}
