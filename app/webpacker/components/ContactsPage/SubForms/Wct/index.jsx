import React, { useEffect, useState } from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';

const FORM_DEFAULT_VALUE = {
  message: '',
};

export default function Wct({ setSubformValues, setFormValid }) {
  const [formValues, setFormValues] = useState(FORM_DEFAULT_VALUE);
  const handleFormChange = (_, { name, value }) => setFormValues(
    { ...formValues, [name]: value },
  );

  useEffect(() => {
    setSubformValues(formValues);
    setFormValid(formValues.message?.length > 0);
  }, [formValues, setFormValid, setSubformValues]);

  return (
    <Form.TextArea
      label={I18n.t('page.contacts.form.communications_team.message.label')}
      name="message"
      value={formValues.message}
      onChange={handleFormChange}
    />
  );
}
