import React, { useMemo, useReducer } from 'react';
import { Button, Table } from 'semantic-ui-react';
import _ from 'lodash';
import cn from 'classnames';
import I18n from '../../lib/i18n';
import { competitionsUrl } from '../../lib/requests/routes.js.erb';
import UserBadge from '../UserBadge';
import { createSortReducer, compareColumns } from '../../lib/reducers/sortReducer';

const dasherize = (string) => _.kebabCase(string);

const COLUMN_TO_FIELD_PATH = {
  name: 'user.name',
  role: 'metadata.status',
  region: 'metadata.location',
  first_delegated: 'metadata.first_delegated',
  last_delegated: 'metadata.last_delegated',
  date_since_last_delegated: 'metadata.date_since_last_delegated',
  total_delegated: 'metadata.total_delegated',
};

/**
 * @param {{sortState: {column: string, direction: 'ascending' | 'descending'}}} props
 */
function DelegatesTableHeaderCell({
  onSortChange,
  column,
  title,
  sortState,
  isSortingEnabled,
}) {
  return (
    <Table.HeaderCell
      onClick={() => onSortChange(column)}
      sorted={isSortingEnabled && sortState.column === column ? sortState.direction : null}
    >
      {title ?? I18n.t(`delegates_page.table.${column}`)}
    </Table.HeaderCell>
  );
}

export default function DelegatesTable({
  delegates: allPassedDelegates,
  isAdminMode,
  isAllLeadDelegates,
  isAllNonLeadDelegates,
}) {
  const isSortEnabled = isAllNonLeadDelegates;
  const [sortState, dispatchSortChange] = useReducer(createSortReducer(
    [
      'name',
      'role',
      'region',
      'first_delegated',
      'last_delegated',
      'date_since_last_delegated',
      'total_delegated',
    ],
  ), { column: 'name', direction: 'descending' });

  const tableData = useMemo(() => {
    /** @type {Array} */
    const delegates = isAdminMode
      ? allPassedDelegates
      : allPassedDelegates.filter(
        (delegate) => delegate.metadata.status !== 'trainee_delegate',
      );
    if (!isSortEnabled) return delegates;

    return delegates.toSorted((delegateA, delegateB) => {
      const columnValueA = _.get(
        delegateA,
        COLUMN_TO_FIELD_PATH[sortState.column],
      );
      const columnValueB = _.get(
        delegateB,
        COLUMN_TO_FIELD_PATH[sortState.column],
      );

      const comparatorResult = compareColumns(columnValueA, columnValueB);
      return sortState.direction === 'ascending'
        ? comparatorResult
        : -comparatorResult;
    });
  }, [allPassedDelegates, isAdminMode, isSortEnabled, sortState]);

  return (
    <div style={{ overflowX: 'scroll' }}>
      <Table unstackable sortable={isSortEnabled}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell collapsing />

            <DelegatesTableHeaderCell
              column="name"
              isSortingEnabled={isSortEnabled}
              sortState={sortState}
              onSortChange={dispatchSortChange}
            />
            <DelegatesTableHeaderCell
              column="role"
              isSortingEnabled={isSortEnabled}
              sortState={sortState}
              onSortChange={dispatchSortChange}
            />

            {!isAllLeadDelegates && (
              <DelegatesTableHeaderCell
                column="region"
                languageKey="delegates_page.table.region"
                isSortingEnabled={isSortEnabled}
                sortState={sortState}
                onSortChange={dispatchSortChange}
              />
            )}

            {isAllNonLeadDelegates && (
              <>
                <DelegatesTableHeaderCell
                  column="first_delegated"
                  isSortingEnabled={isSortEnabled}
                  sortState={sortState}
                  onSortChange={dispatchSortChange}
                />
                <DelegatesTableHeaderCell
                  column="last_delegated"
                  isSortingEnabled={isSortEnabled}
                  sortState={sortState}
                  onSortChange={dispatchSortChange}
                />
                <DelegatesTableHeaderCell
                  column="date_since_last_delegated"
                  title={
                    /* NOTE: No i18n because this is only visible to admins */
                    'Date Since Last Delegated'
                  }
                  isSortingEnabled={isSortEnabled}
                  sortState={sortState}
                  onSortChange={dispatchSortChange}
                />
                <DelegatesTableHeaderCell
                  column="total_delegated"
                  isSortingEnabled={isSortEnabled}
                  sortState={sortState}
                  onSortChange={dispatchSortChange}
                />
              </>
            )}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {tableData.map((delegate) => (
            <Table.Row
              className={cn(`${dasherize(delegate.metadata.status)}`)}
              key={delegate.user.id}
            >
              <Table.Cell verticalAlign="middle">
                <Button.Group vertical>
                  <Button href={`mailto:${delegate.user.email}`} icon="envelope" />
                  {isAdminMode && (
                    <Button href={`users/${delegate.user.id}/edit`} icon="edit" />
                  )}
                </Button.Group>
              </Table.Cell>
              <Table.Cell>
                <UserBadge
                  user={delegate.user}
                  hideBorder
                  leftAlign
                  subtexts={delegate.user.wca_id ? [delegate.user.wca_id] : []}
                />
              </Table.Cell>
              <Table.Cell>
                {I18n.t(`enums.user_roles.status.delegate_regions.${delegate.metadata.status}`)}
              </Table.Cell>
              {!isAllLeadDelegates && <Table.Cell>{delegate.metadata.location}</Table.Cell>}
              {isAllNonLeadDelegates && (
                <>
                  <Table.Cell>{delegate.metadata.first_delegated}</Table.Cell>
                  <Table.Cell>{delegate.metadata.last_delegated}</Table.Cell>
                  <Table.Cell>{delegate.date_since_last_delegated}</Table.Cell>
                  <Table.Cell>{delegate.metadata.total_delegated}</Table.Cell>
                  <Table.Cell href={competitionsUrl({
                    display: 'admin',
                    years: 'all',
                    delegate: delegate.user.id,
                  })}
                  >
                    {I18n.t('delegates_page.table.history')}
                  </Table.Cell>
                </>
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}
