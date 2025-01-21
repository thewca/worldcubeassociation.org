import React, { useEffect } from 'react';
import { Form, Modal } from 'semantic-ui-react';

export default function TwoFactorChangeTab({ user, recentlyAuthenticated }) {
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
    <Form>
      TODO+
    </Form>
  );
}
