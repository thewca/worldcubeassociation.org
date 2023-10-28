import React from 'react';

import { Form } from 'semantic-ui-react';

import _ from 'lodash';
import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  roleDataUrl,
  roleUpdateUrl,
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
  const { save, saving } = useSaveAction();
  const selectedGroup = groups[0].value;
  const [formValues, setFormValues] = React.useState({});
  const [apiError, setError] = React.useState(false);
  const [finished, setFinished] = React.useState(false);

  React.useEffect(() => {
    setFormValues({
      delegateStatus: delegateStatusOptions[0],
      location: '',
      ...(data?.roleData || {}),
    });
  }, [data]);

  const updateRole = () => {
    save(
      roleUpdateUrl,
      {
        userId,
        roleId,
        ...formValues,
      },
      () => {
        setFinished(true);
      },
      { method: 'PATCH' },
      () => setError(true),
    );
  };

  const endRole = () => {
    save(
      roleUpdateUrl,
      {
        userId,
        roleId,
      },
      () => {
        setFinished(true);
      },
      { method: 'DELETE' },
      () => setError(true),
    );
  };

  if (loading) return <Loading />;
  if (error || apiError) return <Errored />;
  if (finished) return 'Success...';

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
          disabled={(_.isEqual(formValues, data?.roleData))}
        >
          {roleId ? 'Update Role' : 'Create Role'}
        </Form.Button>
        <Form.Button
          secondary
          type="button"
          onClick={endRole}
          disabled={!roleId}
        >
          End Role
        </Form.Button>
      </div>
    </Form>
  );
}
