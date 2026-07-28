import React from 'react';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../../lib/wca-data.js.erb';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import Subregion from './Subregion';

export default function Region({ group }) {
  const { data: subregions, loading, error } = useLoadedData(
    apiV0Urls.userGroups.list(groupTypes.delegate_regions, 'name', {
      isActive: true,
      parentGroupId: group.id,
    }),
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      {subregions.map((subregion) => (
        <Subregion
          key={subregion.id}
          group={subregion}
        />
      ))}
      <Subregion
        key="no-subregion"
        group={group}
      />
    </>
  );
}
