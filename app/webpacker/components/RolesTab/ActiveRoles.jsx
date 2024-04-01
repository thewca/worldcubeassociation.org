import React from 'react';
import { Header, List, Icon } from 'semantic-ui-react';
import { panelUrls } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import useLoggedInUserPermissions from '../../lib/hooks/useLoggedInUserPermissions';
import { groupTypes, delegateRegionsStatus } from '../../lib/wca-data.js.erb';
import { getRoleDescription, getRoleSubDescription } from '../../lib/helpers/roles-tab';

function hyperlink(role) {
  if (role.group.group_type === groupTypes.delegate_regions) {
    if ([
      delegateRegionsStatus.senior_delegate,
      delegateRegionsStatus.regional_delegate,
    ].includes(role.metadata.status)) {
      return panelUrls.board.regionsManager;
    }
    return panelUrls.seniorDelegate.regions;
  }
  if (role.group.group_type === groupTypes.teams_committees) {
    // FIXME: Redirect to correct dropdown in groupsManager. Currently it only goes to the
    // groupsManager page without selecting the group of the user.
    return panelUrls.leader.groupsManager;
  }
  if (role.group.group_type === groupTypes.translators) {
    return panelUrls.wst.translators;
  }
  return null;
}

export default function ActiveRoles({ activeRoles }) {
  const { loggedInUserPermissions, loading } = useLoggedInUserPermissions();
  if (loading) {
    return <Loading />;
  }
  return (
    <>
      <Header>Active Roles</Header>
      <List divided relaxed>
        {activeRoles?.map((role) => (
          <List.Item
            key={role.id}
            disabled={!loggedInUserPermissions.canEditRole(role)}
          >
            <List.Content
              floated="left"
              href={hyperlink(role)}
            >
              <Icon
                name="edit"
                size="large"
                link
              />
            </List.Content>
            <List.Content>
              <List.Header>{getRoleDescription(role)}</List.Header>
              <List.Description>{getRoleSubDescription(role)}</List.Description>
            </List.Content>
          </List.Item>
        ))}
      </List>
    </>
  );
}
