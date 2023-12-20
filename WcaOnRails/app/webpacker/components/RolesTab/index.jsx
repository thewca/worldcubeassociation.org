import React from 'react';
import {
  Modal,
  Button,
  Header,
  List,
} from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { rolesOfUser, teamUrl } from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import RoleForm from './RoleForm';
import I18n from '../../lib/i18n';

// let i18n-tasks know the key is used
// i18n-tasks-use t('enums.user.role_status.delegate_regions.trainee_delegate')
// i18n-tasks-use t('enums.user.role_status.delegate_regions.candidate_delegate')
// i18n-tasks-use t('enums.user.role_status.delegate_regions.delegate')
// i18n-tasks-use t('enums.user.role_status.delegate_regions.senior_delegate')
// i18n-tasks-use t('enums.user.role_status.teams_committees.member')
// i18n-tasks-use t('enums.user.role_status.teams_committees.senior_member')
// i18n-tasks-use t('enums.user.role_status.teams_committees.leader')
// i18n-tasks-use t('enums.user.role_status.councils.member')
// i18n-tasks-use t('enums.user.role_status.councils.senior_member')
// i18n-tasks-use t('enums.user.role_status.councils.leader')

export default function RolesTab({ userId, loggedInUserId }) {
  const roleListFetch = useLoadedData(rolesOfUser(userId));
  const loggedInUserRolesFetch = useLoadedData(rolesOfUser(loggedInUserId));

  const [open, setOpen] = React.useState(false);

  const activeNonHiddenRoles = React.useMemo(
    () => {
      if (roleListFetch.data) {
        return roleListFetch.data.filter((role) => role.group.is_hidden === false);
      }
      return [];
    },
    [roleListFetch.data],
  );

  const loggedInUserRoles = React.useMemo(
    () => {
      if (loggedInUserRolesFetch.data) {
        return loggedInUserRolesFetch.data.reduce((roleMap, role) => ({
          ...roleMap,
          [role.group.id]: role,
        }), {});
      }
      return {};
    },
    [loggedInUserRolesFetch.data],
  );

  const isDelegate = roleListFetch.data && roleListFetch.data.some(
    (role) => role.group.group_type === 'delegate_regions',
  );

  const canEditRole = (role) => role.group.group_type === 'delegate_regions' && (
    !!loggedInUserRoles.admin || loggedInUserRoles[role.group.id]?.metadata.status === 'senior_delegate'
  );

  const canEditTeamOfRole = (role) => role.group.group_type !== 'delegate_regions' && (
    !!loggedInUserRoles.admin || loggedInUserRoles[role.group.name]?.metadata.status === 'leader'
  );

  if (roleListFetch.loading || loggedInUserRolesFetch.loading) return <Loading />;
  if (roleListFetch.error || loggedInUserRolesFetch.error) return <Errored />;

  return (
    <>
      {activeNonHiddenRoles.length > 0
        ? (
          <>
            <Header>Active Roles</Header>
            <List divided relaxed>
              {activeNonHiddenRoles.map((role) => (
                <List.Item>
                  <List.Icon
                    name="edit"
                    size="large"
                    verticalAlign="middle"
                    link
                    disabled={!canEditRole(role)}
                    onClick={() => setOpen(true)}
                  />
                  <List.Content>
                    {canEditTeamOfRole(role) && (
                      <List.Header as="a" href={`${teamUrl(role.group.id)}/edit`}>
                        {`${I18n.t(`enums.user.role_status.${role.group.group_type}.${role.metadata.status}`)}, ${role.group.name}`}
                      </List.Header>
                    )}
                    {!canEditTeamOfRole(role) && (
                      <List.Header>
                        {`${I18n.t(`enums.user.role_status.${role.group.group_type}.${role.metadata.status}`)}, ${role.group.name}`}
                      </List.Header>
                    )}
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
          <p>No Active Delegate Roles...</p>
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
