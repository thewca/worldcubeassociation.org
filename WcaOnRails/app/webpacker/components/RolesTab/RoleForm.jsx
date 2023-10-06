import React from 'react';

import { Form } from 'semantic-ui-react';

import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  roleDataUrl,
  roleUpdateUrl,
  roleEndUrl,
} from '../../lib/requests/routes.js.erb';
import useSaveAction from '../../lib/hooks/useSaveAction';
import Errored from '../Requests/Errored';
import DelegateForm from './DelegateForm';
import Loading from '../Requests/Loading';

const groups = [{
  key: 'delegates',
  text: 'Delegates',
  value: 'Delegates',
}];

const delegateStatusOptions = ['trainee_delegate', 'candidate_delegate', 'delegate', 'senior_delegate'];

export default function RoleForm({ userId, roleId }) {
  const { data, loading, error } = useLoadedData(roleDataUrl(userId, roleId));
  const { save } = useSaveAction();
  const selectedGroup = groups[0].value;
  const [formValues, setFormValues] = React.useState({});
  const [apiError, setError] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setFormValues({
      ...{
        delegateStatus: delegateStatusOptions[0],
        location: '',
      },
      ...(data?.roleData || {}),
    });
  }, [data]);

  const updateRole = () => {
    setSaving(true);
    save(
      roleUpdateUrl,
      {
        userId,
        roleId,
        ...formValues,
      },
      () => {
        window.location.href = `/users/${userId}/edit?section=roles`;
      },
      { method: 'POST' },
      () => setError(true),
    );
  };

  const endRole = () => {
    setSaving(true);
    save(
      roleEndUrl,
      {
        userId,
        roleId,
      },
      () => {
        window.location.href = `/users/${userId}/edit?section=roles`;
      },
      { method: 'POST' },
      () => setError(true),
    );
  };

  if (loading) return <Loading />;
  if (error || apiError) return <Errored />;

  return (
    <Form
      onSubmit={updateRole}
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
            updateFormProperty={(values) => {
              setFormValues({
                ...formValues,
                ...values,
              });
            }}
            seniorDelegates={data?.seniorDelegates.map((seniorDelegate) => ({
              key: seniorDelegate.id,
              text: seniorDelegate.name,
              value: seniorDelegate.id,
            })) || []}
            delegateStatusOptions={delegateStatusOptions}
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
