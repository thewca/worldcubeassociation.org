import {
  Ref, Segment, Table, TableFooter,
} from 'semantic-ui-react';
import React from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import I18n from '../../../lib/i18n';
import TableHeader from './AdministrationTableHeader';
import TableRow from './AdministrationTableRow';
import RegistrationAdministrationTableFooter from './RegistrationAdministrationTableFooter';

export default function RegistrationAdministrationTable({
  columnsExpanded,
  registrations,
  selected,
  onSelect,
  onUnselect,
  onToggle,
  sortDirection,
  sortColumn,
  changeSortColumn,
  competitionInfo,
  draggable = false,
  sortable = true,
  withPosition = false,
  handleOnDragEnd,
  color,
  distinguishPaidUnpaid = false,
}) {
  const handleHeaderCheck = (_, data) => {
    if (data.checked) {
      onSelect(...registrations.map(({ user }) => user.id));
    } else {
      onUnselect(...registrations.map(({ user }) => user.id));
    }
  };

  if (registrations.length === 0) {
    return (
      <Segment>
        {I18n.t('competitions.registration_v2.list.empty')}
      </Segment>
    );
  }
  // TODO: use native ref= when we switch to semantic v3
  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <div style={{ overflowX: 'scroll' }}>
      <Table
        sortable={sortable}
        striped
        unstackable
        compact
        singleLine
        textAlign="left"
        color={color}
      >
        <TableHeader
          columnsExpanded={columnsExpanded}
          isChecked={registrations.length === selected.length}
          onCheckboxChanged={handleHeaderCheck}
          sortDirection={sortDirection}
          sortColumn={sortColumn}
          changeSortColumn={changeSortColumn}
          competitionInfo={competitionInfo}
          withCheckbox={!draggable}
          withPosition={withPosition}
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
                      onCheckboxChange={() => onToggle(w.user.id)}
                      index={i}
                      draggable={draggable}
                      isSelected={selected.includes(w.user.id)}
                      withPosition={withPosition}
                      color={color}
                      distinguishPaidUnpaid={distinguishPaidUnpaid}
                    />
                  ))}
                  {providedDroppable.placeholder}
                </Table.Body>
              </Ref>
            )}
          </Droppable>
        </DragDropContext>
        <TableFooter>
          <RegistrationAdministrationTableFooter
            columnsExpanded={columnsExpanded}
            registrations={registrations}
            competitionInfo={competitionInfo}
            withPosition={withPosition}
          />
        </TableFooter>
      </Table>
    </div>
  );
}
