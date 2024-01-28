import React, { useCallback } from 'react';
import { Grid, Label, Segment } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import useLoadedData from '../../lib/hooks/useLoadedData';
import UserBadge from '../UserBadge';
import DelegatesTable from './DelegatesTable';
import DelegatesOfSubregion from './DelegatesOfSubregion';

export const ALL_REGIONS = {
  id: 'all',
  name: I18n.t('delegates_page.all_regions'),
};

function SeniorDelegate({ seniorDelegate }) {
  return (
    <>
      <Grid.Row only="computer">
        <Segment raised>
          <Label ribbon>
            {I18n.t('enums.user.delegate_status.senior_delegate')}
          </Label>

          {seniorDelegate && (
            <UserBadge
              user={seniorDelegate.user}
              hideBorder
              leftAlign
              subtexts={seniorDelegate.user.wca_id ? [seniorDelegate.user.wca_id] : []}
            />
          )}
        </Segment>
      </Grid.Row>
      { /* TODO: Fix Senior Delegate ribbon CSS for tablet and mobile view,
           and enable the 'senior delegate' component for all devices */ }
    </>

  );
}

export default function DelegatesOfRegion({ activeRegion, delegateSubregions, isAdminMode }) {
  const isAllRegions = activeRegion.id === ALL_REGIONS.id;
  const { data: delegates, loading, error } = useLoadedData(
    isAllRegions
      ? apiV0Urls.userRoles.listOfGroupType(groupTypes.delegate_regions, 'name', {
        isActive: true,
      })
      : apiV0Urls.userRoles.listOfGroup(activeRegion.id, 'location,name', {
        isActive: true,
      }),
  );

  const getSeniorDelegate = useCallback(
    () => delegates?.find((delegate) => delegate.metadata.status === 'senior_delegate'),
    [delegates],
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      {!isAllRegions && <SeniorDelegate seniorDelegate={getSeniorDelegate()} />}
      <Grid.Row style={{ overflowX: 'scroll' }}>
        <DelegatesTable
          delegates={delegates}
          isAdminMode={isAdminMode}
          isAllRegions={isAllRegions}
        />
        {delegateSubregions.map((subregion) => (
          <DelegatesOfSubregion subregion={subregion} isAdminMode={isAdminMode} />
        ))}
      </Grid.Row>
    </>
  );
}
