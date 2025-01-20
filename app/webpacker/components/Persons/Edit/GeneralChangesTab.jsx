import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import useInputState from '../../../lib/hooks/useInputState';
import CountrySelector from '../../CountrySelector/CountrySelector';

export default function GeneralChangesTab({ user, editableFields }) {
  const [name, setName] = useInputState(user.name);
  const [dob, setDob] = useInputState(user.dob);
  const [gender, setGender] = useInputState(user.gender);
  const [countryIso2, setCountryIso2] = useState(user.country_iso2);
  const [wcaId, setWcaId] = useInputState(user.wca_id);
  const [unconfirmedWcaId, setUnconfirmedWcaId] = useInputState(user.unconfirmed_wca_id);

  return (
    <Form>
      <Form.Field>
        <Form.Input label="Full Name" fluid onChange={setName} value={name} disabled={!editableFields.includes('name')} />
        Enter the competitor's full name correctly, for example Stefan Pochmann. Not sloppily like s pochman.
        Middle names (either full or as initials) are optional.
      </Form.Field>
      <Form.Field>
        <Form.Input type="date" label="Birthdate" onChange={setDob} value={dob} disabled={!editableFields.includes('dob')} />
        Enter the competitor's date of birth in the format YYYY-MM-DD.
      </Form.Field>
      <Form.Field fluid>
        <Form.Input label="Gender" onChange={setGender} value={gender} disabled={!editableFields.includes('gender')} />
      </Form.Field>
      <Form.Field fluid>
        <CountrySelector label="Country" disabled={!editableFields.includes('country')} countryIso2={countryIso2} onChange={(({ region }) => setCountryIso2(region))} />
      </Form.Field>
      <Form.Group widths={2}>
        { unconfirmedWcaId && <Form.Input value={unconfirmedWcaId} onChange={setUnconfirmedWcaId} disabled={!editableFields.includes('unconfirmed_wca_id')} />}
        <Form.Input label="WCA ID" value={wcaId} onChange={setWcaId} disabled={!editableFields.includes('wca_id')} />
      </Form.Group>
      <Form.Button>Save</Form.Button>
    </Form>
  );
}
