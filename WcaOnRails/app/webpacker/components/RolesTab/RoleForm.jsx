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
  const { data: regionsData, loading: regionsLoading, error: regionsError } = useLoadedData(
    apiV0Urls.userGroups.list(groupTypes.delegate_regions),
  );
  const { save, saving } = useSaveAction();
  const selectedGroup = groups[0].value;
  const [formValues, setFormValues] = React.useState({});
  const [apiError, setError] = React.useState(false);
  const [finished, setFinished] = React.useState(false);

  const regions = React.useMemo(() => regionsData?.filter(
    (group) => !group.parent_group_id,
  ), [regionsData]);

  const subRegions = React.useMemo(() => {
    const subRegionsList = regionsData?.filter((group) => group.parent_group_id) || [];
    return Object.groupBy(subRegionsList, (group) => group.parent_group_id);
  }, [regionsData]);

  React.useEffect(() => {
    const loadingCompleted = !loading && !regionsLoading;
    let regionId = null;
    let subRegionId = null;
    if (loadingCompleted) {
      const roleData = data?.roleData || {};
      // roleData.regionId is the id of either a region or a subRegion. If the user is part of a
      // subRegion, roleData.regionId will be the id of the subRegion and if the user is not part
      // of any subRegion, roleData.regionId will be the id of the region.
      if (roleData.regionId && !regions.find((region) => region.id === roleData.regionId)) {
        // In this case, the regionId is actually the subRegionId because the regionId is not
        // present in the regions list. So, we need to find the regionId from the subRegions list.
        subRegionId = roleData.regionId;
        regionId = parseInt(Object.keys(subRegions)
          .find((regionIndex) => subRegions[regionIndex]
            .find((subRegion) => subRegion.id === roleData.regionId)), 10);
      } else {
        // In this case, the regionId is actually the regionId because the regionId is present in
        // the regions list.
        regionId = roleData.regionId;
      }
      setFormValues({
        delegateStatus: delegateStatusOptions[0],
        location: '',
        ...(data?.roleData || {}),
        regionId,
        subRegionId,
      });
    }
  }, [data, loading, regions, regionsLoading, subRegions]);

  React.useEffect(() => {
    if (formValues.regionId && formValues.subRegionId) {
      const subRegionList = subRegions[formValues.regionId] || [];
      const selectedSubRegion = subRegionList.find(
        (subRegion) => subRegion.id === formValues.subRegionId,
      );
      if (!selectedSubRegion) {
        setFormValues({
          ...formValues,
          subRegionId: null,
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

  if (loading || regionsLoading || !formValues) return <Loading />;
  if (error || apiError || regionsError) return <Errored />;
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
