import React from 'react';
import { Form } from 'semantic-ui-react';
import { InputDate } from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import RegistrationCollisions from '../Tables/RegistrationCollisions';
import SubSection from '../../wca/FormProvider/SubSection';

export default function RegistrationDates() {
  const {
    competition: {
      registration: {
        openingDateTime,
        closingDateTime,
      },
    },
  } = useStore();

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
