import React, { useState } from 'react';
import { Form, Segment } from 'semantic-ui-react';
import useInputState from '../../../lib/hooks/useInputState';
import CountrySelector from '../../CountrySelector/CountrySelector';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { updateUserUrl } from '../../../lib/requests/routes.js.erb';
import './preferences.scss';
import GenderSelector from '../../GenderSelector/GenderSelector';

export default function GeneralChangesTab({ user, editableFields }) {
  const [name, setName] = useInputState(user.name);
  const [dob, setDob] = useInputState(user.dob);
  const [gender, setGender] = useInputState(user.gender);
  const [countryIso2, setCountryIso2] = useState(user.country_iso2);
  const [wcaId, setWcaId] = useInputState(user.wca_id);
  const [unconfirmedWcaId, setUnconfirmedWcaId] = useInputState(user.unconfirmed_wca_id);

  return (
    <Segment>
      <Form method="POST" action={updateUserUrl(user.id)} className="preferences-form">
        <input type="hidden" name="_method" value="patch" />
        <input type="hidden" name="authenticity_token" value={document.querySelector('meta[name=csrf-token]').content} />
        <Form.Field>
          <Form.Input
            label="Full Name"
            name="user[name]"
            fluid
            onChange={setName}
            value={name}
            disabled={!editableFields.includes('name')}
          />
          <I18nHTMLTranslate i18nKey="simple_form.hints.user.name" />
        </Form.Field>
        <Form.Field>
          <Form.Input
            type="date"
            label="Birthdate"
            name="user[dob]"
            onChange={setDob}
            value={dob}
            disabled={!editableFields.includes('dob')}
          />
          <I18nHTMLTranslate i18nKey="simple_form.hints.user.dob" />
        </Form.Field>
        <Form.Field fluid>
          <GenderSelector onChange={setGender} gender={gender} name="user[gender]" disabled={!editableFields.includes('gender')} />
        </Form.Field>
        <Form.Field fluid>
          <CountrySelector
            label="Country"
            name="user[country_iso2]"
            disabled={!editableFields.includes('country')}
            countryIso2={countryIso2}
            onChange={(({ region }) => setCountryIso2(region))}
          />
        </Form.Field>
        <Form.Group widths={2}>
          {unconfirmedWcaId && (
          <Form.Input
            value={unconfirmedWcaId}
            onChange={setUnconfirmedWcaId}
            disabled={!editableFields.includes('unconfirmed_wca_id')}
          />
          )}
          <Form.Input
            label="WCA ID"
            name="user[wca_id]"
            value={wcaId}
            onChange={setWcaId}
            disabled={!editableFields.includes('wca_id')}
          />
        </Form.Group>
        <Form.Button>Save</Form.Button>
      </Form>
    </Segment>
  );
}
