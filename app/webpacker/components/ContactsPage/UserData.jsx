import React from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

export default function UserData({ formValues, setFormValues }) {
  const handleFormChange = (_, { name, value }) => setFormValues(
    { ...formValues, [name]: value },
  );

  return (
    <>
      <Form.Input
        label={I18n.t('page.contacts.form.user_data.name.label')}
        name="name"
        value={formValues.name}
        onChange={handleFormChange}
      />
      <Form.Input
        label={I18n.t('page.contacts.form.user_data.email.label')}
        name="email"
        value={formValues.email}
        onChange={handleFormChange}
      />
    </>
  );
}
