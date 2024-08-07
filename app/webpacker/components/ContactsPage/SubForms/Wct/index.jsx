import React, { useEffect } from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import { useDispatch, useStore } from '../../../../lib/providers/StoreProvider';
import { setSubFormValidity, updateSectionData } from '../../store/actions';

const SECTION = 'wct';

export default function Wct() {
  const { formValues: { wct } } = useStore();
  const dispatch = useDispatch();
  const handleFormChange = (_, { name, value }) => dispatch(
    updateSectionData(SECTION, name, value),
  );

  useEffect(() => {
    const isValid = Boolean(wct?.message);
    dispatch(setSubFormValidity(SECTION, isValid));
  }, [dispatch, wct]);

  return (
    <Form.TextArea
      label={I18n.t('page.contacts.form.wct.message.label')}
      name="message"
      value={wct?.message}
      onChange={handleFormChange}
    />
  );
}
