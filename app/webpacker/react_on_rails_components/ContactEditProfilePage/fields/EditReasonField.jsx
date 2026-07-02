import React from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';

export default function EditReasonField({
  name,
  label,
  isChanged,
  value,
  onChange,
}) {
  if (!isChanged) return null;

  return (
    <Form.TextArea
      label={I18n.t('page.contact_edit_profile.form.edit_reason_for.label', {
        attribute: label,
      })}
      name={name}
      required
      value={value}
      onChange={onChange}
    />
  );
}
