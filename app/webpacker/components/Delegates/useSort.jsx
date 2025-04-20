import { useState } from 'react';

/**
 * @param {string | number} a
 * @param {string | number} b
 */
export function compareColumns(a, b) {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

export function useSort(initialState, allowedColumns) {
  /** @type {[{column: 'user.name', direction: 'ascending' | 'descending'}, any]} */
  const [sortingState, setSortBy] = useState(initialState);

  /**
   * @param {'name'} column
   */
  function handleSortingChange(column) {
    if (!allowedColumns.includes(column)) throw new Error(`invalid column ${column}, expected: ${allowedColumns.join(' | ')}`);

    if (!sortingState || sortingState.column !== column) {
      setSortBy({ column, direction: 'ascending' });
      return;
    }

    setSortBy({ column, direction: sortingState.direction === 'ascending' ? 'descending' : 'ascending' });
  }

  return { sortingState, handleSortingChange };
}
