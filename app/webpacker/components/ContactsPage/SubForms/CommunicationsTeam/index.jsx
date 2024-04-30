import React from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import { useDispatch, useStore } from '../../../../lib/providers/StoreProvider';
import { updateSubFormCommunicationsTeam } from '../../store/actions';

export default function CommunicationsTeam() {
  const { communications_team: communicationsTeam } = useStore();
  const dispatch = useDispatch();
  const handleFormChange = (_, { name, value }) => dispatch(
    updateSubFormCommunicationsTeam(name, value),
  );
  return (
    <Form.TextArea
      label={I18n.t('page.contacts.form.communications_team.message.label')}
      name="message"
      value={communicationsTeam.message}
      onChange={handleFormChange}
    />
  );
}
