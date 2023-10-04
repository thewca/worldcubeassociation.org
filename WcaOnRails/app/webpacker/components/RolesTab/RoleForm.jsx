import React from 'react';

import { Form } from 'semantic-ui-react';

import useLoadedData from '../../lib/hooks/useLoadedData';
import { roleDataUrl, roleUpdateUrl } from '../../lib/requests/routes.js.erb';
import useSaveAction from '../../lib/hooks/useSaveAction';
import Errored from '../Requests/Errored';
import DelegateForm from './DelegateForm';

const groups = [{
  key: 'delegates',
  text: 'Delegates',
  value: 'Delegates',
}];

const endRoleValue = {
  delegateStatus: '',
  seniorDelegateId: '',
  location: '',
};

export default function RoleForm() {
  const userId = window.location.pathname.split('/')[2];
  const roleId = window.location.pathname.split('/')[4];
  const { data, loading, error } = useLoadedData(roleDataUrl(userId, roleId));
  const { save } = useSaveAction();
  const [selectedGroup] = React.useState(groups[0].value);
  const [formValues, setFormValues] = React.useState({});
  const [apiError, setError] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const updateRole = (endRole = false) => {
    setSaving(true);
    save(
      roleUpdateUrl,
      {
        userId,
        roleId,
        ...(endRole ? endRoleValue : formValues),
      },
      () => {
        window.location.href = `/users/${userId}/edit?section=roles`;
      },
      { method: 'POST' },
      () => setError(true),
    );
  };

  const endRole = () => {
    updateRole(true);
  };

  if (loading) return 'Loading...';
  if (error || apiError) return <Errored />;

  return (
    <Form
      onSubmit={() => updateRole()}
      loading={saving}
    >
      <Form.Dropdown
        label="Group"
        fluid
        selection
        value={selectedGroup}
        options={groups}
      />
      {selectedGroup === groups[0].value // Delegates is selected
        && (
          <DelegateForm
            formValues={formValues}
            setFormValues={setFormValues}
            roleData={(data?.roleData || {})}
            seniorDelegates={data?.seniorDelegates.map((seniorDelegate) => ({
              key: seniorDelegate.id,
              text: seniorDelegate.name,
              value: seniorDelegate.id,
            })) || []}
          />
        )}
      <div style={{
        display: 'flex',
      }}
      >
        <Form.Button
          primary
          type="submit"
          disabled={(JSON.stringify(formValues) === JSON.stringify(data?.roleData || {}))}
        >
          {roleId === 'new' ? 'Create Role' : 'Update Role'}
        </Form.Button>
        <Form.Button
          secondary
          onClick={endRole}
          disabled={roleId === 'new'}
        >
          End Role
        </Form.Button>
      </div>
    </Form>
  );
}
