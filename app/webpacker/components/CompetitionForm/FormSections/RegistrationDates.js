import React, { useMemo } from 'react';
import { Form } from 'semantic-ui-react';
import { InputDate } from '../../wca/FormBuilder/input/FormInputs';
import RegistrationCollisions from '../Tables/RegistrationCollisions';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormInitialObject, useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';
import { hasNotPassedOrNull } from '../../../lib/utils/dates';

export default function RegistrationDates() {
  const {
    registration: {
      openingDateTime,
      closingDateTime,
    },
  } = useFormObject();

  const {
    registration: {
      closingDateTime: originalClosingDateTime,
    },
  } = useFormInitialObject();

  const registrationNotYetClosed = useMemo(
    () => hasNotPassedOrNull(originalClosingDateTime, 'UTC'),
    [originalClosingDateTime],
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
