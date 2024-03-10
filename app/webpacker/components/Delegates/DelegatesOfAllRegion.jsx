import React from 'react';
import { Header } from 'semantic-ui-react';
import DelegatesTable from './DelegatesTable';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';

export default function DelegatesOfAllRegion() {
  const {
    data: leadDelegates,
    loading: leadDelegatesLoading,
    error: leadDelegatesError,
  } = useLoadedData(
    apiV0Urls.userRoles.listOfGroupType(groupTypes.delegate_regions, 'name', {
      isActive: true,
      extraMetadata: true,
      isLead: true,
    }),
  );
  const {
    data: otherDelegates,
    loading: otherDelegatesLoading,
    error: otherDelegatesError,
  } = useLoadedData(
    apiV0Urls.userRoles.listOfGroupType(groupTypes.delegate_regions, 'name', {
      isActive: true,
      extraMetadata: true,
      isLead: false,
    }),
  );

  if (leadDelegatesLoading || otherDelegatesLoading) return <Loading />;
  if (leadDelegatesError || otherDelegatesError) return <Errored />;

  return (
    <>
      <Header as="h3">Lead Delegates</Header>
      <DelegatesTable
        delegates={leadDelegates}
        isAdminMode
        isAllLeadDelegates
      />
      <Header as="h3">Other Delegates</Header>
      <DelegatesTable
        delegates={otherDelegates}
        isAdminMode
        isAllNonLeadDelegates
      />
    </>
  );
}
