import React, { useEffect } from 'react';
import { Form, Modal, Segment } from 'semantic-ui-react';
import useInputState from '../../../lib/hooks/useInputState';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { updateUserUrl } from '../../../lib/requests/routes.js.erb';
import RailsForm from './RailsForm';

export default function EmailChangeTab({ user, recentlyAuthenticated }) {
  const [email, setEmail] = useInputState(user.email);

  // Hack to allow this with devise
  useEffect(() => {
    if (!recentlyAuthenticated) {
      document.getElementById('2fa-check').style.display = 'block';
    }
  }, [recentlyAuthenticated]);

  if (!recentlyAuthenticated) {
    return <Modal dimmer="blurring" open />;
  }

  return (
    <Segment>
      <RailsForm method="patch" action={updateUserUrl(user.id)}>
        <Form.Field>
          <Form.Input name="user[email]" value={email} onChange={setEmail} label="Email" />
          {/* i18n-tasks-use t('users.edit.confirm_new_email') */}
          <I18nHTMLTranslate i18nKey="users.edit.confirm_new_email" />
        </Form.Field>
        <Form.Button type="submit">Save</Form.Button>
      </RailsForm>
    </Segment>
  );
}
