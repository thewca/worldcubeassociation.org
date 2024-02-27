import React from 'react';
import { Header, List } from 'semantic-ui-react';
import {
  apiV0Urls,
  pendingClaimsUrl,
  competitionsForSeniorUrl,
} from '../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../lib/wca-data.js.erb';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';

export default function SeniorDelegatesList() {
  const { data: seniorDelegates, loading, error } = useLoadedData(
    apiV0Urls.userRoles.listOfGroupType(groupTypes.delegate_regions, 'name', {
      status: 'senior_delegate',
    }),
  );
  if (loading) return <Loading />;
  if (error) return <Errored />;
  return (
    <>
      <Header as="h2">Senior Delegates List</Header>
      {seniorDelegates.map((delegate) => (
        <>
          <Header as="h4" key={delegate.user.id}>{delegate.user.name}</Header>
          <List>
            <List.Item>
              <List.Content>
                <a href={pendingClaimsUrl(delegate.user.id)}>
                  List of subordinate pending WCA ID claims
                </a>
              </List.Content>
            </List.Item>
          </List>
          <List>
            <List.Item>
              <List.Content>
                <a href={competitionsForSeniorUrl(delegate.user.id)}>
                  List of subordinate upcoming competitions
                </a>
              </List.Content>
            </List.Item>
          </List>
        </>
      ))}
    </>
  );
}
