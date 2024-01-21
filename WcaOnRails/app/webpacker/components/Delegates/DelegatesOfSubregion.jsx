import React from 'react';
import { Header } from 'semantic-ui-react';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import useLoadedData from '../../lib/hooks/useLoadedData';
import DelegatesTable from './DelegatesTable';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';

export default function DelegatesOfSubregion({ subregion, isAdminMode }) {
  const { data: delegates, loading, error } = useLoadedData(
    apiV0Urls.userRoles.listOfGroup(subregion.id, 'location,name', {
      isActive: true,
    }),
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      <Header as="h4" key={subregion.id}>
        {subregion.name}
      </Header>
      <DelegatesTable
        delegates={delegates}
        isAdminMode={isAdminMode}
      />
    </>
  );
}
