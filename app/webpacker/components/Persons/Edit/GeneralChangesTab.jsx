import React, { useState } from 'react';
import {
  Form, Segment, Message, ButtonGroup, Button,
} from 'semantic-ui-react';
import useInputState from '../../../lib/hooks/useInputState';
import CountrySelector from '../../CountrySelector/CountrySelector';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { personUrl, profileClaimWCAIdUrl, updateUserUrl } from '../../../lib/requests/routes.js.erb';
import I18n from '../../../lib/i18n';
import './preferences.scss';
import GenderSelector from '../../GenderSelector/GenderSelector';
import RailsForm from './RailsForm';

export default function GeneralChangesTab({ user, currentUser, editableFields }) {
  const [name, setName] = useInputState(user.name);
  const [dob, setDob] = useInputState(user.dob);
  const [gender, setGender] = useInputState(user.gender);
  const [countryIso2, setCountryIso2] = useState(user.country_iso2);
  const [wcaId, setWcaId] = useInputState(user.wca_id);
  const [unconfirmedWcaId, setUnconfirmedWcaId] = useInputState(user.unconfirmed_wca_id);

  return (
    <Segment>
      <RailsForm method="patch" action={updateUserUrl(user.id)} className="preferences-form">
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
        { currentUser['can_view_all_users?'] ? (
          <>
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
            <ButtonGroup widths={2}>
              <Button>{I18n.t('users.edit.profile')}</Button>
              <Button>{I18n.t('users.edit.approve')}</Button>
            </ButtonGroup>
            { currentUser['can_edit_any_user?'] && user['is_special_account?']
            && (
              <Message>
                {/* i18n-tasks-use t('users.edit.account_is_special') */}
                <I18nHTMLTranslate i18nKey="users.edit.account_is_special" />
              </Message>
            )}
          </>
        ) : (
          <I18nHTMLTranslate
            /* i18n-tasks-use t('users.edit.have_wca_id_html') */
            /* i18n-tasks-use t('users.edit.have_no_wca_id_html') */
            i18nKey={wcaId ? 'users.edit.have_wca_id_html' : 'users.edit.have_no_wca_id_html'}
            options={{
              here: `<a href="${profileClaimWCAIdUrl()}">${I18n.t('common.here')}</a>`,
              link_id: `<a href="${personUrl(wcaId)}">${wcaId}</a>`,
            }}
          />
        )}
        <Form.Button>Save</Form.Button>
      </RailsForm>
    </Segment>
  );
}
