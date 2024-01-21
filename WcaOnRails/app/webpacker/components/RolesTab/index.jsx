import React from 'react';
import {
  Modal,
  Button,
  Header,
  List,
  Icon,
} from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { rolesOfUser, teamUrl, panelUrls } from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import RoleForm from './RoleForm';
import I18n from '../../lib/i18n';
import useLoggedInUserPermissions from '../../lib/hooks/useLoggedInUserPermissions';
import { groupTypes, delegateRegionsStatus } from '../../lib/wca-data.js.erb';

// let i18n-tasks know the key is used
// i18n-tasks-use t('enums.user.role_status.delegate_regions.trainee_delegate')
// i18n-tasks-use t('enums.user.role_status.delegate_regions.candidate_delegate')
// i18n-tasks-use t('enums.user.role_status.delegate_regions.delegate')
// i18n-tasks-use t('enums.user.role_status.delegate_regions.regional_delegate')
// i18n-tasks-use t('enums.user.role_status.delegate_regions.senior_delegate')
// i18n-tasks-use t('enums.user.role_status.teams_committees.member')
// i18n-tasks-use t('enums.user.role_status.teams_committees.senior_member')
// i18n-tasks-use t('enums.user.role_status.teams_committees.leader')
// i18n-tasks-use t('enums.user.role_status.councils.member')
// i18n-tasks-use t('enums.user.role_status.councils.senior_member')
// i18n-tasks-use t('enums.user.role_status.councils.leader')

export default function RolesTab({ userId }) {
  const roleListFetch = useLoadedData(rolesOfUser(
    userId,
    { isActive: true, isGroupHidden: false },
  ));
  const { loggedInUserPermissions, loading } = useLoggedInUserPermissions();

  const [open, setOpen] = React.useState(false);

  const isDelegate = roleListFetch.data && roleListFetch.data.some(
    (role) => role.group.group_type === 'delegate_regions',
  );

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

  function getRoleDescription(role) {
    let roleDescription = '';
    if (role.metadata.status) {
      roleDescription += `${I18n.t(`enums.user.role_status.${role.group.group_type}.${role.metadata.status}`)}, `;
    }
    roleDescription += role.group.name;
    return roleDescription;
  }

  if (roleListFetch.loading || loading) return <Loading />;
  if (roleListFetch.error) return <Errored />;

  return (
    <>
      {roleListFetch.data?.length > 0
        ? (
          <>
            <Header>Active Roles</Header>
            <List divided relaxed>
              {roleListFetch.data?.map((role) => (
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
                    <List.Header>
                      {getRoleDescription(role)}
                    </List.Header>
                    {!!role.start_date && (
                      <List.Description>
                        {`Since ${role.start_date}`}
                      </List.Description>
                    )}
                  </List.Content>
                </List.Item>
              ))}
            </List>
          </>
        ) : (
          <p>No Active Roles...</p>
        )}
      <Button onClick={() => setOpen(true)} disabled={isDelegate}>New Role</Button>

      <Modal
        size="fullscreen"
        onClose={() => {
          setOpen(false);
          roleListFetch.sync();
          window.location.reload(); // TODO: This is a hack to force the page to reload after
          // closing the modal, so that avatar tab will be visible. A common use case of a
          // Senior Delegate is that after creating a new delegate, they will want to crop the
          // thumbnail. But the avatar tab is not visible until the page is reloaded because that
          // part of code is still in erb. This can be fixed while migrating completely to React.
        }}
        open={open}
      >
        <Modal.Content>
          <RoleForm userId={userId} isActiveRole={isDelegate} />
        </Modal.Content>
      </Modal>
    </>
  );
}
