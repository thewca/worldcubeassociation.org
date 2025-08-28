import React, { useState } from 'react';
import { Confirm, Modal } from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import EditPersonRequestedChangesList from './EditPersonRequestedChangesList';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import createEditPersonField from '../../api/competitionResult/createEditPersonField';
import updateEditPersonField from '../../api/competitionResult/updateEditPersonField';
import deleteEditPersonField from '../../api/competitionResult/deleteEditPersonField';
import EditPersonFieldEditor from './EditPersonFieldEditor';

export default function EditPersonRequestedChanges({
  ticketId,
  currentStakeholder,
  requestedChanges,
  person,
}) {
  const [editPersonFieldActionDetails, setEditPersonFieldActionDetails] = useState();

  const queryClient = useQueryClient();
  const {
    mutate: createEditPersonFieldMutate,
    isPending: isCreatePending,
    isError: isCreateError,
    error: createError,
  } = useMutation({
    mutationFn: createEditPersonField,
    onSuccess: (newEditField) => {
      setEditPersonFieldActionDetails(null);
      queryClient.setQueryData(
        ['ticket-details', ticketId],
        (oldTicketDetails) => ({
          ...oldTicketDetails,
          ticket: {
            ...oldTicketDetails.ticket,
            metadata: {
              ...oldTicketDetails.ticket.metadata,
              tickets_edit_person_fields: [
                ...oldTicketDetails.ticket.metadata.tickets_edit_person_fields,
                newEditField,
              ],
            },
          },
        }),
      );
    },
  });

  const {
    mutate: updateEditPersonFieldMutate,
    isPending: isUpdatePending,
    isError: isUpdateError,
    error: updateError,
  } = useMutation({
    mutationFn: updateEditPersonField,
    onSuccess: (_, { editPersonFieldId, newValue }) => {
      setEditPersonFieldActionDetails(null);
      queryClient.setQueryData(
        ['ticket-details', ticketId],
        (oldTicketDetails) => ({
          ...oldTicketDetails,
          ticket: {
            ...oldTicketDetails.ticket,
            metadata: {
              ...oldTicketDetails.ticket.metadata,
              tickets_edit_person_fields: (
                oldTicketDetails.ticket.metadata.tickets_edit_person_fields.map(
                  (editPersonField) => {
                    if (editPersonField.id === editPersonFieldId) {
                      return { ...editPersonField, new_value: newValue };
                    }
                    return editPersonField;
                  },
                )
              ),
            },
          },
        }),
      );
    },
  });

  const {
    mutate: deleteEditPersonFieldMutate,
    isPending: isDeletePending,
    isError: isDeleteError,
    error: deleteError,
  } = useMutation({
    mutationFn: deleteEditPersonField,
    onSuccess: (_, { editPersonFieldId }) => {
      setEditPersonFieldActionDetails(null);
      queryClient.setQueryData(
        ['ticket-details', ticketId],
        (oldTicketDetails) => ({
          ...oldTicketDetails,
          ticket: {
            ...oldTicketDetails.ticket,
            metadata: {
              ...oldTicketDetails.ticket.metadata,
              tickets_edit_person_fields: (
                oldTicketDetails.ticket.metadata.tickets_edit_person_fields.filter(
                  (editPersonField) => editPersonField.id !== editPersonFieldId,
                )
              ),
            },
          },
        }),
      );
    },
  });

  const actionMutateMap = {
    create: createEditPersonFieldMutate,
    update: updateEditPersonFieldMutate,
  };

  if (isCreatePending || isUpdatePending || isDeletePending) return <Loading />;
  if (isCreateError) return <Errored error={createError} />;
  if (isUpdateError) return <Errored error={updateError} />;
  if (isDeleteError) return <Errored error={deleteError} />;

  return (
    <>
      <EditPersonRequestedChangesList
        requestedChanges={requestedChanges}
        createChange={({ fieldName, oldValue }) => setEditPersonFieldActionDetails({
          action: 'create',
          fieldName,
          oldValue,
        })}
        updateChange={({
          id,
          field_name: fieldName,
          old_value: oldValue,
        }) => setEditPersonFieldActionDetails({
          action: 'update',
          id,
          fieldName,
          oldValue,
        })}
        deleteChange={(editPersonFieldId) => setEditPersonFieldActionDetails({
          action: 'delete',
          editPersonFieldId,
        })}
      />
      <Confirm
        open={editPersonFieldActionDetails?.action === 'delete'}
        content="Are you sure you want to delete this change?"
        onCancel={() => setEditPersonFieldActionDetails(null)}
        onConfirm={() => deleteEditPersonFieldMutate({
          ticketId,
          editPersonFieldId: editPersonFieldActionDetails?.editPersonFieldId,
          actingStakeholderId: currentStakeholder.id,
        })}
      />
      <Modal
        open={['create', 'update'].includes(editPersonFieldActionDetails?.action)}
        onClose={() => setEditPersonFieldActionDetails(null)}
        closeIcon
      >
        <Modal.Header>Edit Person Field Editor</Modal.Header>
        <Modal.Content>
          <EditPersonFieldEditor
            id={editPersonFieldActionDetails?.id}
            ticketId={ticketId}
            actingStakeholderId={currentStakeholder.id}
            fieldName={editPersonFieldActionDetails?.fieldName}
            oldValue={
              editPersonFieldActionDetails?.oldValue
              || person[editPersonFieldActionDetails?.fieldName]
            }
            actionMutate={actionMutateMap[editPersonFieldActionDetails?.action]}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
