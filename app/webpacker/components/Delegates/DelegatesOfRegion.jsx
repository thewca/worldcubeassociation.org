import React, { useCallback, useMemo } from 'react';
import { Grid, Label, Segment } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
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
    <Grid padded centered>
      <Grid.Row>
        <Segment raised compact textAlign="center">
          <Label ribbon>
            {I18n.t('enums.user_roles.status.delegate_regions.senior_delegate')}
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
    </Grid>

  );
}

export default function DelegatesOfRegion({ activeRegion, delegateSubregions, isAdminMode }) {
  const { data: delegates, loading, error } = useLoadedData(apiV0Urls.userRoles.listOfGroup(
    activeRegion.id,
    'location,name',
    { isActive: true },
  ));

  const getSeniorDelegate = useCallback(
    () => delegates?.find((delegate) => delegate.metadata.status === 'senior_delegate'),
    [delegates],
  );

  const nonSeniorDelegates = useMemo(
    () => delegates?.filter((delegate) => delegate.metadata.status !== 'senior_delegate'),
    [delegates],
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      <SeniorDelegate seniorDelegate={getSeniorDelegate()} />
      {nonSeniorDelegates.length > 0 && (
        <DelegatesTable
          delegates={nonSeniorDelegates}
          isAdminMode={isAdminMode}
        />
      )}
      {delegateSubregions.map((subregion) => (
        <DelegatesOfSubregion subregion={subregion} isAdminMode={isAdminMode} />
      ))}
    </>
  );
}
