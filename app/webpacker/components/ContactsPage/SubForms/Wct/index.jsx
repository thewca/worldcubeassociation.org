import React from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import { useDispatch, useStore } from '../../../../lib/providers/StoreProvider';
import { updateSectionData } from '../../store/actions';

const SECTION = 'wct';

export default function Wct() {
  const { wct } = useStore();
  const dispatch = useDispatch();
  const handleFormChange = (_, { name, value }) => dispatch(
    updateSectionData(SECTION, name, value),
  );
  return (
    <Form.TextArea
      label={I18n.t('page.contacts.form.wct.message.label')}
      name="message"
      value={wct?.message}
      onChange={handleFormChange}
    />
  );
}
