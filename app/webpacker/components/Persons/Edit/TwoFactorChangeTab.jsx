import React from 'react';
import { Form } from 'semantic-ui-react';
import PasswordConfirm from './PasswordConfirm';

export default function TwoFactorChangeTab({ user, recentlyAuthenticated }) {
  if (!recentlyAuthenticated) {
    return (<PasswordConfirm />);
  }

  return (
    <Form>
      TODO+
    </Form>
  );
}
