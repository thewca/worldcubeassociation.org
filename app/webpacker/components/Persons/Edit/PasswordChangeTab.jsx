import React, { useEffect } from 'react';
import {
  Button, Divider, Form, Header, Modal,
} from 'semantic-ui-react';
import useInputState from '../../../lib/hooks/useInputState';

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
      <Form>
        <input type="hidden" name="_method" value="patch" />
        <input type="hidden" name="authenticity_token" value={document.querySelector('meta[name=csrf-token]').content} />
        <Form.Field>
          <Form.Input value={password} type="password" onChange={setPassword} label="Password" />
        </Form.Field>
        <Form.Field>
          <Form.Input value={confirmPassword} type="password" onChange={setConfirmPassword} label="Re-enter password" />
        </Form.Field>
        <Form.Button>Save</Form.Button>
      </Form>
      <Divider />
      <Header>Actions</Header>
      <Button negative>Sign out of Other devices</Button>
    </>
  );
}
