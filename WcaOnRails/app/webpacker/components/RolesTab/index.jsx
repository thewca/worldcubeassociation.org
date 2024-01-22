import React from 'react';
import { Modal, Button } from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import RoleForm from './RoleForm';
import { groupTypes } from '../../lib/wca-data.js.erb';
import ActiveRoles from './ActiveRoles';
import PastRoles from './PastRoles';

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

const sortParams = 'status';

export default function RolesTab({ userId }) {
  const {
    data: activeRoles,
    loading: activeRolesLoading,
    error: activeRolesError,
    sync: activeRolesSync,
  } = useLoadedData(apiV0Urls.userRoles.listOfUser(
    userId,
    sortParams,
    { isActive: true, isGroupHidden: false },
  ));
  const {
    data: pastRoles,
    loading: pastRolesLoading,
    error: pastRolesError,
    sync: pastRolesSync,
  } = useLoadedData(apiV0Urls.userRoles.listOfUser(
    userId,
    sortParams,
    { isActive: false, isGroupHidden: false },
  ));

  const [open, setOpen] = React.useState(false);

  const isDelegate = activeRoles?.some(
    (role) => role.group.group_type === groupTypes.delegate_regions,
  );

  const hasNoRoles = activeRoles?.length === 0 && pastRoles?.length === 0;

  if (activeRolesLoading || pastRolesLoading) return <Loading />;
  if (activeRolesError || pastRolesError) return <Errored />;

  return (
    <>
      {activeRoles?.length > 0 && (<ActiveRoles activeRoles={activeRoles} setOpen={setOpen} />)}
      {pastRoles?.length > 0 && (<PastRoles pastRoles={pastRoles} />)}
      {hasNoRoles && <p>No Roles...</p>}
      <Button onClick={() => setOpen(true)} disabled={isDelegate}>New Role</Button>

      <Modal
        size="fullscreen"
        onClose={() => {
          setOpen(false);
          activeRolesSync();
          pastRolesSync();
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
