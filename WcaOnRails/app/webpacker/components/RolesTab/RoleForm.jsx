import React from 'react';

import { Form, Grid } from 'semantic-ui-react';

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

export default function RoleForm({ userId, isActiveRole }) {
  const { data, loading, error } = useLoadedData(roleDataUrl(userId, isActiveRole));
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
        ...formValues,
      },
      () => setFinished(true),
      { method: 'PATCH' },
      () => setError(true),
    );
  };

  const endRole = () => {
    save(
      roleUpdateUrl,
      {
        userId,
      },
      () => setFinished(true),
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
            regions={data?.regions.map((region) => ({
              key: region.id,
              text: region.name,
              value: region.id,
            })) || []}
            delegateStatusOptions={delegateStatusOptions}
          />
        )}
      <Grid>
        <Form.Button
          primary
          type="submit"
          disabled={(_.isEqual(formValues, data?.roleData))}
        >
          {isActiveRole ? 'Update Role' : 'Create Role'}
        </Form.Button>
        <Form.Button
          secondary
          type="button"
          onClick={endRole}
          disabled={!isActiveRole}
        >
          End Role
        </Form.Button>
      </Grid>
    </Form>
  );
}
