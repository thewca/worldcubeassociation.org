import React, { useEffect } from 'react';
import {
  Button, Divider, Form, Header, Modal,
} from 'semantic-ui-react';
import useInputState from '../../../lib/hooks/useInputState';
import { updateUserUrl } from '../../../lib/requests/routes.js.erb';

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
    <>
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
      <Button negative>Sign out of Other devices</Button>
    </>
  );
}
