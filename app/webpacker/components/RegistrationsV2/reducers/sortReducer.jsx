export default function createSortReducer(columns) {
  return (state, action) => {
    if (action.type === 'CHANGE_SORT') {
      if (state.sortColumn === action.sortColumn) {
        return {
          ...state,
          sortDirection:
            state.sortDirection === 'ascending' ? 'descending' : 'ascending',
        };
      }
      if (!columns.includes(action.sortColumn)) {
        throw new Error('Unknown Column');
      }
      return {
        sortColumn: action.sortColumn,
        sortDirection: 'ascending',
      };
    }
    throw new Error('Unknown Action');
  };
}
