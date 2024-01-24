import React from 'react';
import { Header, List, Icon } from 'semantic-ui-react';
import { teamUrl, panelUrls } from '../../lib/requests/routes.js.erb';
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
    return null;
  }
  if (role.group.group_type === groupTypes.teams_committees) {
    return `${teamUrl(role.group.id.split('_').pop())}/edit`;
  }
  if (role.group.group_type === groupTypes.translators) {
    return panelUrls.wst.translators;
  }
  return null;
}

function isHyperlinkableRole(role) {
  if (role.group.group_type === groupTypes.delegate_regions) {
    return [
      delegateRegionsStatus.senior_delegate,
      delegateRegionsStatus.regional_delegate,
    ].includes(role.metadata.status);
  }
  return [groupTypes.teams_committees, groupTypes.translators].includes(role.group.group_type);
}

export default function ActiveRoles({ activeRoles, setOpen }) {
  const { loggedInUserPermissions, loading } = useLoggedInUserPermissions();
  if (loading) {
    return <Loading />;
  }
  return (
    <>
      <Header>Active Roles</Header>
      <List divided relaxed>
        {activeRoles?.map((role) => (
          <List.Item key={role.id}>
            <List.Content
              floated="left"
              href={hyperlink(role)}
            >
              <Icon
                name="edit"
                size="large"
                link
                disabled={!loggedInUserPermissions.canEditRole(role)}
                onClick={isHyperlinkableRole(role) ? null : () => setOpen(true)}
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
