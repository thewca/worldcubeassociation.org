import { Ref, Segment, Table } from 'semantic-ui-react';
import React from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import i18n from '../../../lib/i18n';
import TableHeader from './AdministrationTableHeader';
import TableRow from './AdministrationTableRow';

export default function RegistrationAdministrationTable({
  columnsExpanded,
  registrations,
  selected,
  select,
  unselect,
  sortDirection,
  sortColumn,
  changeSortColumn,
  competitionInfo,
  draggable = false,
  handleOnDragEnd,
}) {
  const handleHeaderCheck = (_, data) => {
    if (data.checked) {
      select(registrations.map(({ user }) => user.id));
    } else {
      unselect(registrations.map(({ user }) => user.id));
    }
  };

  if (registrations.length === 0) {
    return (
      <Segment>
        {i18n.t('competitions.registration_v2.list.empty')}
      </Segment>
    );
  }
  // TODO: use native ref= when we switch to semantic v3
  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <Table sortable={!draggable} striped textAlign="left">
      <TableHeader
        columnsExpanded={columnsExpanded}
        isChecked={registrations.length === selected.length}
        onCheckboxChanged={handleHeaderCheck}
        sortDirection={sortDirection}
        sortColumn={sortColumn}
        changeSortColumn={changeSortColumn}
        competitionInfo={competitionInfo}
        draggable={draggable}
      />

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="droppable-table">
          {(providedDroppable) => (
            <Ref innerRef={providedDroppable.innerRef}>
              <Table.Body {...providedDroppable.droppableProps}>
                {registrations.map((w, i) => (
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
                    draggable={draggable}
                    isSelected={selected.includes(w.user.id)}
                  />
                ))}
                {providedDroppable.placeholder}
              </Table.Body>
            </Ref>
          )}
        </Droppable>
      </DragDropContext>
    </Table>
  );
}
