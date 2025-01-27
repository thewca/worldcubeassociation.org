import React, { useEffect } from 'react';
import {
  Button, Divider, Form, Header, Modal, Segment,
} from 'semantic-ui-react';
import useInputState from '../../../lib/hooks/useInputState';
import { destroyOtherSessionsUrl, updateUserUrl } from '../../../lib/requests/routes.js.erb';
import I18n from '../../../lib/i18n';

export default function PasswordChangeTab({ user, recentlyAuthenticated }) {
  const [password, setPassword] = useInputState('');
  const [confirmPassword, setConfirmPassword] = useInputState('');
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
      <Form method="POST" action={updateUserUrl(user.id)}>
        <input type="hidden" name="_method" value="patch" />
        <input type="hidden" name="authenticity_token" value={document.querySelector('meta[name=csrf-token]').content} />
        <Form.Field>
          <Form.Input value={password} name="user[password]" type="password" onChange={setPassword} label="Password" />
        </Form.Field>
        <Form.Field>
          <Form.Input value={confirmPassword} name="user[password_confirmation]" type="password" onChange={setConfirmPassword} label="Re-enter password" />
        </Form.Field>
        <Form.Button type="submit">Save</Form.Button>
      </Form>
      <Divider />
      <Header>Actions</Header>
      <Form action={destroyOtherSessionsUrl()} method="DELETE">
        <input
          type="hidden"
          name="authenticity_token"
          value={document.querySelector('meta[name=csrf-token]').content}
        />
        <Form.Button primary type="submit">
          {I18n.t('users.edit.sign_out_of_devices')}
        </Form.Button>
      </Form>
    </Segment>
  );
}
