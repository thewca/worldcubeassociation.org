import React from 'react';

import { Form, Grid } from 'semantic-ui-react';

import _ from 'lodash';
import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  roleDataUrl,
  roleUpdateUrl,
  apiV0Urls,
} from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import useSaveAction from '../../lib/hooks/useSaveAction';
import Errored from '../Requests/Errored';
import DelegateForm from './DelegateForm';
import Loading from '../Requests/Loading';

const groups = [{
  key: 'delegates',
  text: 'Delegates',
  value: 'Delegates',
}];

const delegateStatusOptions = ['trainee_delegate', 'candidate_delegate', 'delegate'];

export default function RoleForm({ userId, isActiveRole }) {
  const { data, loading, error } = useLoadedData(roleDataUrl(userId, isActiveRole));
  const regionsFetching = useLoadedData(apiV0Urls.userGroups.list(groupTypes.delegate_regions));
  const { save, saving } = useSaveAction();
  const selectedGroup = groups[0].value;
  const [formValues, setFormValues] = React.useState({});
  const [apiError, setError] = React.useState(false);
  const [finished, setFinished] = React.useState(false);

  const regions = React.useMemo(() => regionsFetching.data?.filter(
    (group) => !group.parent_group_id,
  ), [regionsFetching.data]);

  const subRegions = React.useMemo(() => {
    const subRegionsList = regionsFetching.data?.filter((group) => group.parent_group_id) || [];
    return Object.groupBy(subRegionsList, (group) => group.parent_group_id);
  }, [regionsFetching.data]);

  React.useEffect(() => {
    const loadingCompleted = !loading && !regionsFetching.loading;
    let regionId = null;
    let subregionId = null;
    if (loadingCompleted) {
      const roleData = data?.roleData || {};
      if (roleData.regionId && !regions.find((region) => region.id === roleData.regionId)) {
        // In this case, the regionId is having the subregionId.
        subregionId = roleData.regionId;
        regionId = parseInt(Object.keys(subRegions)
          .find((regionIndex) => subRegions[regionIndex]
            .find((subregion) => subregion.id === roleData.regionId)), 10);
      } else {
        regionId = roleData.regionId;
      }
      setFormValues({
        delegateStatus: delegateStatusOptions[0],
        location: '',
        ...(data?.roleData || {}),
        regionId,
        subregionId,
      });
    }
  }, [data, loading, regions, regionsFetching.loading, subRegions]);

  React.useEffect(() => {
    if (formValues.regionId && formValues.subregionId) {
      const subRegionList = subRegions[formValues.regionId] || [];
      if (!subRegionList.find((subregion) => subregion.id === formValues.subregionId)) {
        setFormValues({
          ...formValues,
          subregionId: null,
        });
      }
    }
  }, [formValues, formValues.regionId, subRegions]);

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

  if (loading || regionsFetching.loading || !formValues) return <Loading />;
  if (error || apiError || regionsFetching.error) return <Errored />;
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
            regions={regions}
            subRegions={subRegions}
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
