import React, { useMemo, useReducer } from 'react';
import {
  Ref, Segment, Table, TableFooter,
} from 'semantic-ui-react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { noop } from 'lodash';
import I18n from '../../../lib/i18n';
import TableHeader from './AdministrationTableHeader';
import TableRow from './AdministrationTableRow';
import RegistrationAdministrationTableFooter from './RegistrationAdministrationTableFooter';
import { sortRegistrations } from '../../../lib/utils/registrationAdmin';
import { WCA_EVENT_IDS } from '../../../lib/wca-data.js.erb';
import createSortReducer from '../reducers/sortReducer';

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
  'administrative_notes',
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
  isReadOnly = false,
}) {
  const [{ sortColumn, sortDirection }, dispatchSort] = useReducer(sortReducer, {
    sortColumn: initialSortColumn ?? (competitionInfo['using_payment_integrations?']
      ? 'paid_on_with_registered_on_fallback'
      : 'registered_on'
    ),
    sortDirection: initialSortDirection,
  });
  const changeSortColumn = (name) => dispatchSort({ type: 'CHANGE_SORT', sortColumn: name });

  const handleHeaderCheck = (_, data) => {
    if (data.checked) {
      onSelect(...registrations.map(({ user }) => user.id));
    } else {
      onUnselect(...registrations.map(({ user }) => user.id));
    }
  };

  const sortedRegistrations = useMemo(
    () => sortRegistrations(registrations, sortColumn, sortDirection),
    [registrations, sortColumn, sortDirection],
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
          sortDirection={sortDirection}
          sortColumn={sortColumn}
          onColumnClick={sortable ? changeSortColumn : noop}
          competitionInfo={competitionInfo}
          withCheckbox={!isReadOnly && !draggable}
          withPosition={withPosition}
          isReadOnly={isReadOnly}
        />

        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="droppable-table">
            {(providedDroppable) => (
              <Ref innerRef={providedDroppable.innerRef}>
                <Table.Body {...providedDroppable.droppableProps}>
                  {sortedRegistrations.map((w, i) => (
                    <TableRow
                      key={w.user.id}
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
                      isReadOnly={isReadOnly}
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
            isReadOnly={isReadOnly}
          />
        </TableFooter>
      </Table>
    </div>
  );
}
