import React from 'react';
import {
  Modal,
  Button,
  Header,
  List,
} from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import useSaveAction from '../../lib/hooks/useSaveAction';
import {
  roleListUrl,
  currentUserUrl,
  teamUrl,
} from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import RoleForm from './RoleForm';
import I18n from '../../lib/i18n';

// let i18n-tasks know the key is used
// i18n-tasks-use t('enums.user.role_status.trainee_delegate')
// i18n-tasks-use t('enums.user.role_status.candidate_delegate')
// i18n-tasks-use t('enums.user.role_status.delegate')
// i18n-tasks-use t('enums.user.role_status.senior_delegate')
// i18n-tasks-use t('enums.user.role_status.member')
// i18n-tasks-use t('enums.user.role_status.senior_member')
// i18n-tasks-use t('enums.user.role_status.leader')

export default function RolesTab({ userId }) {
  const loggedInUserFetch = useLoadedData(currentUserUrl);
  const roleListFetch = useLoadedData(roleListUrl(userId));
  const { data, sync } = roleListFetch;
  const { save, saving } = useSaveAction();

  const [open, setOpen] = React.useState(false);
  const [currentUserRoles, setCurrentUserRoles] = React.useState(null);
  const [error, setError] = React.useState(null);

  const activeNonHiddenRoles = React.useMemo(
    () => {
      if (data) {
        return data.activeRoles.filter((role) => role.group.is_hidden === false);
      }
      return [];
    },
    [data],
  );
  const isDelegate = React.useMemo(
    () => {
      if (data) {
        return data.activeRoles.some((role) => role.group.group_type === 'delegate_regions');
      }
      return false;
    },
    [data],
  );

  React.useEffect(() => {
    if (!loggedInUserFetch.loading) {
      save(roleListUrl(loggedInUserFetch.data.id), {}, (roles) => {
        setCurrentUserRoles(roles.activeRoles.reduce((roleMap, role) => ({
          ...roleMap,
          [role.group.id]: role,
        }), {}));
      }, { method: 'GET', body: null }, setError);
    }
  }, [loggedInUserFetch.data, loggedInUserFetch.loading, save]);

  const canEditRole = (role) => role.group.group_type === 'delegate_regions' && (
    !!currentUserRoles.admin || currentUserRoles[role.group.id].status === 'senior_delegate'
  );

  const canEditTeamOfRole = (role) => role.group.group_type !== 'delegate_regions' && (
    !!currentUserRoles.admin || currentUserRoles[role.group.name]?.status === 'leader'
  );

  if (
    roleListFetch.loading || loggedInUserFetch.loading || saving || currentUserRoles === null
  ) return <Loading />;
  if (roleListFetch.error || loggedInUserFetch.error || error) return <Errored />;

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
                      {`${I18n.t(`enums.user.role_status.${role.status}`)}, ${role.group.name}`}
                    </List.Header>
                    )}
                    {!canEditTeamOfRole(role) && (
                    <List.Header>
                      {`${I18n.t(`enums.user.role_status.${role.status}`)}, ${role.group.name}`}
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
          sync();
          window.location.reload(); // TODO: This is a hack to force the page to reload after
          // closing the modal, so that avatar tab will be visible.
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
