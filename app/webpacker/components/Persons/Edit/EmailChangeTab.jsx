import React, { useEffect } from 'react';
import { Form, Modal } from 'semantic-ui-react';
import useInputState from '../../../lib/hooks/useInputState';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';

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
    <Form>
      <input type="hidden" name="_method" value="patch" />
      <input type="hidden" name="authenticity_token" value={document.querySelector('meta[name=csrf-token]').content} />
      <Form.Field>
        <Form.Input value={email} onChange={setEmail} label="Email" />
        <I18nHTMLTranslate i18nKey="users.edit.confirm_new_email" />
      </Form.Field>
      <Form.Button>Save</Form.Button>
    </Form>
  );
}
