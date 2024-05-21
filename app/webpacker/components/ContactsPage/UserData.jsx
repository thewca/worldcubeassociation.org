import React from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import { useDispatch, useStore } from '../../lib/providers/StoreProvider';
import { updateSectionData } from './store/actions';

const SECTION = 'userData';

export default function UserData({ loggedInUserData }) {
  const { formValues: { userData } } = useStore();
  const dispatch = useDispatch();
  const handleFormChange = (_, { name, value }) => dispatch(
    updateSectionData(SECTION, name, value),
  );

  if (loggedInUserData) return null;

  return (
    <>
      <Form.Input
        label={I18n.t('page.contacts.form.user_data.name.label')}
        name="name"
        value={userData.name}
        onChange={handleFormChange}
      />
      <Form.Input
        label={I18n.t('page.contacts.form.user_data.email.label')}
        name="email"
        value={userData.email}
        onChange={handleFormChange}
      />
    </>
  );
}
