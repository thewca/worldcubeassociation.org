import React, { useEffect } from 'react';
import { Form } from 'semantic-ui-react';

export default function PasswordChangeTab({ user, recentlyAuthenticated }) {
  // Hack to allow this with devise
  useEffect(() => {
    if (!recentlyAuthenticated) {
      document.getElementById('2fa-check').display = 'block';
    }
  }, [recentlyAuthenticated]);

  if (!recentlyAuthenticated) {
    return <> Please reauthenticate</>;
  }

  return (
    <Form>
      TODO+
    </Form>
  );
}
