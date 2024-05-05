import { useState } from 'react';

/**
 * For use when fetching paginated data from an API endpoint via [useLoadedDate].
 * @param {Int} initialEntriesPerPage Defaults to 10.
 * @param {Int} initialActivePage Defaults to 1.
 * @returns {Object}
 */
export default function usePagination(
  initialEntriesPerPage = 10,
  initialActivePage = 1,
) {
  const [entriesPerPage, _setEntriesPerPage] = useState(initialEntriesPerPage);
  const [activePage, setActivePage] = useState(initialActivePage);

  function setEntriesPerPage(newEntriesPerPage) {
    // the old active page may now be out of range, so safest to change back to 1
    setActivePage(1);
    _setEntriesPerPage(newEntriesPerPage);
  }

  return {
    entriesPerPage,
    setEntriesPerPage,

    activePage,
    setActivePage,
  };
}
