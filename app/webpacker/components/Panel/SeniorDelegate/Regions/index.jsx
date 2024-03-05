import React, { useEffect } from 'react';

import { Dropdown, Header } from 'semantic-ui-react';

import useInputState from '../../../../lib/hooks/useInputState';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { delegateRegionsStatus, groupTypes } from '../../../../lib/wca-data.js.erb';
import Errored from '../../../Requests/Errored';
import Loading from '../../../Requests/Loading';
import Region from './Region';

export default function Regions({ loggedInUserId }) {
  const {
    data: seniorDelegateRoles,
    loading, error,
  } = useLoadedData(apiV0Urls.userRoles.listOfUser(
    loggedInUserId,
    'groupName', // Sort params
    {
      isActive: true,
      isGroupHidden: false,
      status: delegateRegionsStatus.senior_delegate,
      groupType: groupTypes.delegate_region,
    },
  ));
  const [selectedGroupIndex, setSelectedGroupIndex] = useInputState();

  useEffect(() => {
    if (seniorDelegateRoles?.length > 0) setSelectedGroupIndex(0);
  }, [seniorDelegateRoles, setSelectedGroupIndex]);

  if (!loading && seniorDelegateRoles.length === 0) return <p>You cannot manage any regions..</p>;
  if (loading || selectedGroupIndex === undefined) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      <Header>Regions</Header>
      <div>
        <Dropdown
          options={seniorDelegateRoles.map((role, index) => ({
            key: role.id,
            text: role.group.name,
            value: index,
          }))}
          value={selectedGroupIndex}
          onChange={setSelectedGroupIndex}
        />
      </div>
      <Region group={seniorDelegateRoles[selectedGroupIndex].group} />
    </>
  );
}
