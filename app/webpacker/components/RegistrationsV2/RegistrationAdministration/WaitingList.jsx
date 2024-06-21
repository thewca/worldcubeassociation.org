import React from 'react';
import {
  Checkbox,
  Ref, Segment, Table,
} from 'semantic-ui-react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import TableHeader from './AdministrationTableHeader';
import TableRow from './AdministrationTableRow';

function DraggableTable({
  items, handleOnDragEnd, editable, selected, select, unselect, columnsExpanded, competitionInfo,
}) {
  // TODO: use native ref= when we switch to semantic v3
  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="droppable-table">
        {(providedDroppable) => (
          <Ref innerRef={providedDroppable.innerRef}>
            <Table.Body {...providedDroppable.droppableProps}>
              {items.map((w, i) => (
                <TableRow
                  competitionInfo={competitionInfo}
                  columnsExpanded={columnsExpanded}
                  registration={w}
                  onCheckboxChange={(_, data) => {
                    if (data.checked) {
                      select([w.user.id]);
                    } else {
                      unselect([w.user.id]);
                    }
                  }}
                  index={i}
                  draggable={editable}
                  isSelected={selected.includes(w.user.id)}
                />
              ))}
              {providedDroppable.placeholder}
            </Table.Body>
          </Ref>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default function WaitingList({
  competitionInfo,
  waiting,
  updateWaitingList,
  selected,
  select,
  unselect,
  sortDirection,
  sortColumn,
  changeSortColumn,
  columnsExpanded,
}) {
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

  if (waiting.length === 0) {
    return (
      <Segment>
        None
      </Segment>
    );
  }

  return (
    <>
      <Checkbox toggle value={editable} onChange={setEditable} label="Enable Waiting List Edit Mode" />
      <Table>
        <TableHeader
          columnsExpanded={columnsExpanded}
          changeSortColumn={changeSortColumn}
          competitionInfo={competitionInfo}
          sortColumn={sortColumn}
          waitingList
          sortDirection={sortDirection}
        />
        <DraggableTable
          items={waiting}
          handleOnDragEnd={handleOnDragEnd}
          editable={editable}
          selected={selected}
          select={select}
          unselect={unselect}
          competitionInfo={competitionInfo}
          columnsExpanded={columnsExpanded}
        />
      </Table>
    </>
  );
}
