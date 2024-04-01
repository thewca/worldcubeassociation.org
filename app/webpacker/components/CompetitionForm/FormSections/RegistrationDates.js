import React from 'react';
import { Form } from 'semantic-ui-react';
import { InputDate } from '../../wca/FormBuilder/input/FormInputs';
import RegistrationCollisions from '../Tables/RegistrationCollisions';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';

export default function RegistrationDates() {
  const {
    registration: {
      openingDateTime,
      closingDateTime,
    },
  } = useFormObject();

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
        />
      </Form.Group>
      <RegistrationCollisions />
    </SubSection>
  );
}
