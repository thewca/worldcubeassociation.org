import React from 'react';
import {
  Modal,
  Button,
  Header,
  List,
  Icon,
} from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { rolesOfUser, teamUrl } from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import RoleForm from './RoleForm';
import I18n from '../../lib/i18n';
import useLoggedInUserPermissions from '../../lib/hooks/useLoggedInUserPermissions';
import { groupTypes } from '../../lib/wca-data.js.erb';

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

const isHyperlinkableGroup = (groupType) => groupType === groupTypes.teams_committees;

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
                    href={isHyperlinkableGroup(role.group.group_type) ? `${teamUrl(role.group.id)}/edit` : null}
                  >
                    <Icon
                      name="edit"
                      size="large"
                      link
                      disabled={!loggedInUserPermissions.canEditRole(role)}
                      onClick={isHyperlinkableGroup(role.group.group_type)
                        ? null : () => setOpen(true)}
                    />
                  </List.Content>
                  <List.Content>
                    <List.Header>
                      {`${I18n.t(`enums.user.role_status.${role.group.group_type}.${role.metadata.status}`)}, ${role.group.name}`}
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
