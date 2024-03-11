import React from 'react';
import { Modal } from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';
import Loading from '../Requests/Loading';
import RoleForm from './RoleForm';
import ActiveRoles from './ActiveRoles';
import PastRoles from './PastRoles';

const sortParams = 'groupTypeRank,status';

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

  const hasNoRoles = activeRoles?.length === 0 && pastRoles?.length === 0;

  if (activeRolesLoading || pastRolesLoading) return <Loading />;
  if (activeRolesError || pastRolesError) return <Errored />;

  return (
    <>
      {activeRoles?.length > 0 && (<ActiveRoles activeRoles={activeRoles} setOpen={setOpen} />)}
      {pastRoles?.length > 0 && (<PastRoles pastRoles={pastRoles} />)}
      {hasNoRoles && <p>No Roles...</p>}

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
          <RoleForm userId={userId} />
        </Modal.Content>
      </Modal>
    </>
  );
}
