import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import useInputState from '../../../lib/hooks/useInputState';
import { InputDate, InputString } from '../../wca/FormBuilder/input/FormInputs';
import CountrySelector from '../../CountrySelector/CountrySelector';

export default function GeneralChangesTab({ user, editableFields }) {
  const [name, setName] = useInputState(user.name);
  const [dob, setDob] = useInputState(user.dob);
  const [gender, setGender] = useInputState(user.gender);
  const [countryIso2, setCountryIso2] = useState(user.countryIso2);
  const [wcaId, setWcaId] = useInputState(user.wcaId);
  const [unconfirmedWcaId, setUnconfirmedWcaId] = useInputState(user.wca_id);

  return (
    <Form>
      <Form.Field label="Name">
        <InputString onChange={setName} value={name} disabled={!editableFields.includes('name')} />
        Enter the competitor's full name correctly, for example Stefan Pochmann. Not sloppily like s pochman.
        Middle names (either full or as initials) are optional.
      </Form.Field>
      <Form.Field label="Birthdate">
        <InputDate onChange={setDob} value={dob} disabled={!editableFields.includes('dob')} />
        Enter the competitor's date of birth in the format YYYY-MM-DD.
      </Form.Field>
      <Form.Field label="Gender">
        <InputString onChange={setGender} value={gender} disabled={!editableFields.includes('gender')} />
      </Form.Field>
      <Form.Field label="Country">
        <CountrySelector disabled={editableFields.includes('country')} countryIso2={countryIso2} onChange={(({ region }) => setCountryIso2(region))} />
      </Form.Field>
      <Form.Group widths={2}>
        <InputString value={unconfirmedWcaId} onChange={setUnconfirmedWcaId} disabled={!editableFields.includes('unconfirmed_wca_id')} />
        <InputString value={wcaId} onChange={setWcaId} disabled={!editableFields.includes('wca_id')} />
      </Form.Group>
    </Form>
  );
}
