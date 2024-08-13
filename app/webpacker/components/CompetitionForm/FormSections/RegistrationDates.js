import React, {useMemo} from 'react';
import { Form } from 'semantic-ui-react';
import { InputDate } from '../../wca/FormBuilder/input/FormInputs';
import RegistrationCollisions from '../Tables/RegistrationCollisions';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';
import {DateTime} from "luxon";

export default function RegistrationDates() {
  const {
    registration: {
      openingDateTime,
      closingDateTime,
    },
  } = useFormObject();

  const registrationNotYetPast = useMemo(() => {
    const openingLuxon = DateTime.fromISO(openingDateTime, { zone: 'UTC' });
    const nowLuxon = DateTime.now();

    return openingLuxon > nowLuxon;
  }, []);

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
          overrideEnabled={registrationNotYetPast}
        />
      </Form.Group>
      <RegistrationCollisions />
    </SubSection>
  );
}
