import React, { useMemo, useReducer } from 'react';
import {
  Ref, Segment, Table, TableFooter,
} from 'semantic-ui-react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { noop } from 'lodash';
import I18n from '../../../lib/i18n';
import TableHeader from './AdministrationTableHeader';
import TableRow from './AdministrationTableRow';
import RegistrationAdministrationTableFooter from './RegistrationAdministrationTableFooter';
import { sortRegistrations } from '../../../lib/utils/registrationAdmin';
import { WCA_EVENT_IDS } from '../../../lib/wca-data.js.erb';
import { createSortReducer } from '../../../lib/reducers/sortReducer';

export const sortReducer = createSortReducer([
  'name',
  'wca_id',
  'country',
  'paid_on_with_registered_on_fallback',
  'registered_on',
  'amount',
  'events',
  'guests',
  'paid_on',
  'comment',
  'dob',
  ...WCA_EVENT_IDS,
]);

export default function RegistrationAdministrationTable({
  columnsExpanded,
  registrations,
  selected,
  onSelect,
  onUnselect,
  onToggle,
  initialSortColumn,
  initialSortDirection = 'ascending',
  competitionInfo,
  draggable = false,
  sortable = true,
  withPosition = false,
  handleOnDragEnd,
  color,
  distinguishPaidUnpaid = false,
}) {
  const [sortState, dispatchSortChange] = useReducer(sortReducer, {
    column: initialSortColumn ?? (competitionInfo['using_payment_integrations?']
      ? 'paid_on_with_registered_on_fallback'
      : 'registered_on'
    ),
    direction: initialSortDirection,
  });

  const handleHeaderCheck = (_, data) => {
    if (data.checked) {
      onSelect(...registrations.map(({ user }) => user.id));
    } else {
      onUnselect(...registrations.map(({ user }) => user.id));
    }
  };

  const sortedRegistrations = useMemo(
    () => sortRegistrations(registrations, sortState.column, sortState.direction),
    [registrations, sortState],
  );

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
    <div style={{ overflowX: 'auto' }}>
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
          sortState={sortState}
          onColumnClick={sortable ? dispatchSortChange : noop}
          competitionInfo={competitionInfo}
          withCheckbox={!draggable}
          withPosition={withPosition}
        />

        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="droppable-table">
            {(providedDroppable) => (
              <Ref innerRef={providedDroppable.innerRef}>
                <Table.Body {...providedDroppable.droppableProps}>
                  {sortedRegistrations.map((w, i) => (
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
