import React from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';

export default function Wct({ formValues, setFormValues }) {
  const handleFormChange = (_, { name, value }) => setFormValues(
    { ...formValues, [name]: value },
  );
  return (
    <Form.TextArea
      label={I18n.t('page.contacts.form.communications_team.message.label')}
      name="message"
      value={formValues.message}
      onChange={handleFormChange}
    />
  );
}
