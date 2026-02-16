import React from 'react';
import { Header, List, Icon } from 'semantic-ui-react';
import { panelPageUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import useLoggedInUserPermissions from '../../lib/hooks/useLoggedInUserPermissions';
import { groupTypes, delegateRegionsStatus, PANEL_PAGES } from '../../lib/wca-data.js.erb';
import { getRoleDescription, getRoleSubDescription } from '../../lib/helpers/roles-tab';

function hyperlink(role) {
  if (role.group.group_type === groupTypes.delegate_regions) {
    if ([
      delegateRegionsStatus.senior_delegate,
      delegateRegionsStatus.regional_delegate,
    ].includes(role.metadata.status)) {
      return panelPageUrl(PANEL_PAGES.regionsManager);
    }
    return panelPageUrl(PANEL_PAGES.regions);
  }
  if (role.group.group_type === groupTypes.teams_committees) {
    // FIXME: Redirect to correct dropdown in groupsManager. Currently it only goes to the
    // groupsManager page without selecting the group of the user.
    return panelPageUrl(PANEL_PAGES.groupsManager);
  }
  if (role.group.group_type === groupTypes.translators) {
    return panelPageUrl(PANEL_PAGES.translators);
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
        {activeRoles?.map((role) => {
          const editUrl = hyperlink(role);
          return (
            <List.Item
              key={role.id}
              disabled={!(loggedInUserPermissions.canEditGroup(role.group.id) && editUrl)}
            >
              <List.Content
                floated="left"
                href={editUrl}
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
          );
        })}
      </List>
    </>
  );
}
