import React, { useMemo } from 'react';
import { Divider } from 'semantic-ui-react';
import {
  InputBoolean,
  InputBooleanSelect,
  InputNumber,
  InputSelect,
  InputTextArea,
} from '../../wca/FormProvider/input/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormProvider/SubSection';
import { useFormObject } from '../../wca/FormProvider/provider/FormObjectProvider';

export default function EventRestrictions() {
  const {
    usesV2Registrations,
    isCloning,
    isPersisted,
    storedEvents,
  } = useStore();

  const {
    eventRestrictions: {
      forbidNewcomers,
      earlyPuzzleSubmission,
      qualificationResults,
      eventLimitation,
    },
  } = useFormObject();

  const mainEventOptions = useMemo(() => {
    const storedEventOptions = storedEvents.map((event) => ({
      key: event.id,
      value: event.id,
      text: event.name,
    }));

    return [{
      key: '',
      value: '',
      text: '',
    }, ...storedEventOptions];
  }, [storedEvents]);

  const newcomers = forbidNewcomers.enabled;
  const earlySubmission = earlyPuzzleSubmission.enabled;
  const needQualification = qualificationResults.enabled;
  const restrictEvents = eventLimitation.enabled;

  return (
    <SubSection section="eventRestrictions">
      { usesV2Registrations && (
        <SubSection section="forbidNewcomers">
          <InputBoolean id="enabled" />
          <ConditionalSection showIf={newcomers}>
            <InputTextArea id="reason" />
          </ConditionalSection>
        </SubSection>
      )}
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

      {!isCloning && isPersisted && (
        <>
          <Divider />
          <InputSelect id="mainEventId" options={mainEventOptions} />
        </>
      )}
    </SubSection>
  );
}
