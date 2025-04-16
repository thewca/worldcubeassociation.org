import React, { useMemo } from 'react';
import { Form } from 'semantic-ui-react';
import { InputDate } from '../../wca/FormBuilder/input/FormInputs';
import RegistrationCollisions from '../Tables/RegistrationCollisions';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';
import { hasNotPassed } from '../../../lib/utils/dates';

export default function RegistrationDates() {
  const {
    registration: {
      openingDateTime,
      closingDateTime,
    },
  } = useFormObject();

  const registrationNotYetClosed = useMemo(
    () => closingDateTime === null || hasNotPassed(closingDateTime, 'UTC'),
    [closingDateTime],
  );

  return (
    <SubSection section="registration">
      <Form.Group widths="equal">
        <InputDate
          id="openingDateTime"
          dateTime
          required
          selectsStart
          startDate={openingDateTime}
          endDate={closingDateTime}
        />
        <InputDate
          id="closingDateTime"
          dateTime
          required
          selectsEnd
          startDate={openingDateTime}
          endDate={closingDateTime}
          minDate={openingDateTime}
          ignoreDisabled={registrationNotYetClosed}
        />
      </Form.Group>
      <RegistrationCollisions />
    </SubSection>
  );
}
