import React from 'react';
import { Modal } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import ActiveStatus from './ActiveStatus';
import readUserGroup from '../api/readUserGroup';
import readUserRoles from '../api/readUserRoles';
import Loading from '../../../../Requests/Loading';
import Errored from '../../../../Requests/Errored';

export default function UpdateModal({
  open, onClose, title, userGroupId,
}) {
  const { data: userGroup, isLoading: isGroupLoading, error: groupError } = useQuery({
    queryKey: ['user_group', userGroupId],
    queryFn: () => readUserGroup({ id: userGroupId }),
    enabled: !!userGroupId,
  });

  const { data: nonLeadRolesData, isLoading: isRolesLoading, error: rolesError } = useQuery({
    queryKey: ['user_roles', userGroupId, { isActive: true, isLead: false }],
    queryFn: () => readUserRoles({ groupId: userGroupId, isActive: true, isLead: false }),
    enabled: !!userGroupId,
  });

  const isLoading = isGroupLoading || isRolesLoading;
  const error = groupError || rolesError;

  return (
    <Modal open={open} onClose={onClose}>
      {!isLoading && !error && (
        <Modal.Header>{title || 'Edit User Group'}</Modal.Header>
      )}
      <Modal.Content>
        {isLoading && <Loading />}
        {error && <Errored error={error.message || error} />}
        {!isLoading && !error && userGroup && (
          <ActiveStatus userGroup={userGroup} nonLeadRoles={nonLeadRolesData || []} />
        )}
      </Modal.Content>
    </Modal>
  );
}
