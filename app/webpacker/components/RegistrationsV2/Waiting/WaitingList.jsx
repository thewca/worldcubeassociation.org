import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
  Header, Ref, Segment, Table,
} from 'semantic-ui-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getWaitingCompetitors } from '../api/registration/get/get_registrations';
import useWithUserData from '../hooks/useWithUserData';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';
import i18n from '../../../lib/i18n';
import updateRegistration from '../api/registration/patch/update_registration';

function DraggableTable({ items, handleOnDragEnd }) {
  // TODO: use native ref= when we switch to semantic v3
  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="droppable-table">
        {(providedDroppable) => (
          <Ref innerRef={providedDroppable.innerRef}>
            <Table.Body {...providedDroppable.droppableProps}>
              {items.map((w, i) => (
                <Draggable key={w.user_id.toString()} draggableId={w.user_id.toString()} index={i}>
                  {(provided) => (
                    <Ref innerRef={provided.innerRef}>
                      <Table.Row
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Table.Cell>{i + 1}</Table.Cell>
                        <Table.Cell>{w.user.name}</Table.Cell>
                      </Table.Row>
                    </Ref>
                  )}
                </Draggable>
              ))}
              {providedDroppable.placeholder}
            </Table.Body>
          </Ref>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default function WaitingList({ competitionInfo }) {
  const {
    isFetching: waitingLoading, data: waiting, isError, refetch,
  } = useQuery({
    queryKey: ['waiting', competitionInfo.id],
    queryFn: () => getWaitingCompetitors(competitionInfo.id),
    retry: false,
  });

  const { data: registrationsWithUser } = useWithUserData(waiting ?? []);

  const { mutateAsync: updateWaitingListMutation, isPending: listUpdating } = useMutation({
    mutationFn: updateRegistration,
  });

  const items = useMemo(() => (registrationsWithUser ?? []).toSorted(
    (w1, w2) => w1.waiting_list_position - w2.waiting_list_position,
  ), [registrationsWithUser]);

  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;

    const updatedItems = Array.from(items);
    const [reorderedItem] = updatedItems.splice(result.source.index, 1);
    updatedItems.splice(result.destination.index, 0, reorderedItem);

    await updateWaitingListMutation({
      competition_id: competitionInfo.id,
      user_id: items[result.source.index].user_id,
      competing: {
        waiting_list_position: items[result.destination.index].waiting_list_position,
      },
    });
    refetch();
  };

  if (isError) {
    return (
      <Errored componentName="WaitingList" />
    );
  }

  return !registrationsWithUser ? (
    <Loading />
  )
    : (
      <Segment loading={listUpdating || waitingLoading}>
        <Header>{i18n.t('registrations.list.waiting_list')}</Header>
        { registrationsWithUser.length > 0
          ? (
            <Table collapsing>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Position</Table.HeaderCell>
                  <Table.HeaderCell>{i18n.t('delegates_page.table.name')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <DraggableTable items={items} handleOnDragEnd={handleOnDragEnd} />
            </Table>
          ) : 'No one on the Waiting List.'}
      </Segment>
    );
}
