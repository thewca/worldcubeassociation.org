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
  const {
    competition: {
      eventRestrictions: {
        earlyPuzzleSubmission,
        qualificationResults,
        eventLimitation,
      },
    },
  } = useStore();

  const earlySubmission = earlyPuzzleSubmission.enabled;
  const needQualification = qualificationResults.enabled;
  const restrictEvents = eventLimitation.enabled;

  return (
    <SubSection section="eventRestrictions">
      <SubSection section="earlyPuzzleSubmission">
        <InputBoolean id="enabled" />
        <ConditionalSection showIf={earlySubmission}>
          <InputTextArea id="reason" />
        </ConditionalSection>
      </SubSection>
      <SubSection section="qualificationResults">
        <InputBoolean id="enabled" />
        <ConditionalSection showIf={needQualification}>
          <InputTextArea id="reason" />
          <InputBooleanSelect id="allowRegistrationWithout" />
        </ConditionalSection>
      </SubSection>
      <SubSection section="eventLimitation">
        <InputBoolean id="enabled" />
        <ConditionalSection showIf={restrictEvents}>
          <InputTextArea id="reason" />
          <InputNumber id="perRegistrationLimit" />
        </ConditionalSection>
      </SubSection>
      <Divider />

      <InputSelect id="mainEventId" options={mainEventOptions} />
    </SubSection>
  );
}
