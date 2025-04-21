/**
 * @template T extends string
 * @param {T[]} columns
 */
export function createSortReducer(columns) {
  /**
   * @param {{column: T}} state
   * @param {T} column
   * @returns {{column: T, direction: 'ascending' | 'descending'}}
   */
  return (state, column) => {
    if (!columns.includes(column)) throw new Error(`Unknown column ${column}. Expected ${columns.join(' | ')}`);

    if (state.column === column) {
      return {
        column,
        direction: state.direction === 'ascending' ? 'descending' : 'ascending',
      };
    }

    return {
      column,
      sortDirection: 'ascending',
    };
  };
}

/**
 * @param {string | number} a
 * @param {string | number} b
 */
export function compareColumns(a, b) {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}
