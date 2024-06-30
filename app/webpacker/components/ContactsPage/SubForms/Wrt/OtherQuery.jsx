import React from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import { useDispatch, useStore } from '../../../../lib/providers/StoreProvider';
import { updateSectionData } from '../../store/actions';

const SECTION = 'wrt';

export default function OtherQuery() {
  const { formValues: { wrt: { message } } } = useStore();
  const dispatch = useDispatch();
  const handleFormChange = (_, { name, value }) => dispatch(
    updateSectionData(SECTION, name, value),
  );

  return (
    <Form.TextArea
      label={I18n.t('page.contacts.form.wrt.message.label')}
      name="message"
      value={message}
      onChange={handleFormChange}
    />
  );
}
