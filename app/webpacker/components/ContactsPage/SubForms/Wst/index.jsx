import React, { useEffect } from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import { useDispatch, useStore } from '../../../../lib/providers/StoreProvider';
import { setSubFormValidity, updateSectionData } from '../../store/actions';

const SECTION = 'wst';

export default function Wst() {
  const { formValues: { wst } } = useStore();
  const dispatch = useDispatch();
  const handleFormChange = (_, { name, value }) => dispatch(
    updateSectionData(SECTION, name, value),
  );

  useEffect(() => {
    const isValid = Boolean(wst?.message);
    dispatch(setSubFormValidity(SECTION, isValid));
  }, [dispatch, wst]);

  return (
    <Form.TextArea
      label={I18n.t('page.contacts.form.wst.message.label')}
      name="message"
      value={wst?.message}
      onChange={handleFormChange}
    />
  );
}
