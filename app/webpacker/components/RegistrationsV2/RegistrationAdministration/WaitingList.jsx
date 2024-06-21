import React from 'react';
import {
  Checkbox,
  Header, Ref, Segment, Table,
} from 'semantic-ui-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import i18n from '../../../lib/i18n';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';

function DraggableTable({ items, handleOnDragEnd, editable }) {
  // TODO: use native ref= when we switch to semantic v3
  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="droppable-table">
        {(providedDroppable) => (
          <Ref innerRef={providedDroppable.innerRef}>
            <Table.Body {...providedDroppable.droppableProps}>
              {items.map((w, i) => (
                <Draggable
                  key={w.user_id.toString()}
                  draggableId={w.user_id.toString()}
                  index={i}
                  isDragDisabled={!editable}
                >
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

export default function WaitingList({ competitionInfo, waiting, updateWaitingList }) {
  const [editable, setEditable] = useCheckboxState(false);
  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    await updateWaitingList({
      competition_id: competitionInfo.id,
      user_id: waiting[result.source.index].user_id,
      competing: {
        waiting_list_position: waiting[result.destination.index].waiting_list_position,
      },
    });
  };
  return (
    <>
      <Header>{i18n.t('registrations.list.waiting_list')}</Header>
      <Checkbox toggle value={editable} onChange={setEditable} label="Enable Waiting List Edit Mode" />
      { waiting?.length > 0
        ? (
          <Table collapsing>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Position</Table.HeaderCell>
                <Table.HeaderCell>{i18n.t('delegates_page.table.name')}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <DraggableTable items={waiting} handleOnDragEnd={handleOnDragEnd} editable={editable} />
          </Table>
        ) : (
          <Segment>
            None
          </Segment>
        )}
    </>
  );
}
