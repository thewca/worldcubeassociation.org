import React, { useEffect } from 'react';
import { Form } from 'semantic-ui-react';
import useInputState from '../../../lib/hooks/useInputState';

export default function EmailChangeTab({ user, recentlyAuthenticated }) {
  const [email, setEmail] = useInputState(user.email);

  // Hack to allow this with devise
  useEffect(() => {
    if (!recentlyAuthenticated) {
      document.getElementById('2fa-check').style.display = 'block';
    }
  }, [recentlyAuthenticated]);

  if (!recentlyAuthenticated) {
    return <> Please reauthenticate</>;
  }

  return (
    <Form>
      <Form.Field>
        <Form.Input value={email} onChange={setEmail} label="Email" />
        Changing your email will require confirming the new email before being effective.
      </Form.Field>
    </Form>
  );
}
