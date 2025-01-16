import React from 'react';
import { Form } from 'semantic-ui-react';
import { usersAuthenticateSensitiveUrl } from '../../../lib/requests/routes.js.erb';
import useInputState from '../../../lib/hooks/useInputState';
import I18n from '../../../lib/i18n';

export default function PasswordConfirm() {
  const [password, setPassword] = useInputState();
  return (
    <Form action={usersAuthenticateSensitiveUrl}>
      <Form.Input type="password" autoComplete="off" value={password} onChange={setPassword} />
      <Form.Button type="submit">{I18n.t('users.edit.sensitive.confirm_proceed')}</Form.Button>
    </Form>
  );
}
