import React from 'react';
import { Icon, Pagination, Select } from 'semantic-ui-react';

/**
 * Pagination UI to navigate between pages, and optionally change the number of entries per page.
 * @param {Object} pagination Return of [usePagination].
 * @param {Int} totalPages
 * @param {Int} totalEntries
 * @param {Boolean} allowChangingEntriesPerPage Whether to show UI for changing entries per page.
 * @param {Array<Int>} entriesPerPageOptions Options user can select.
 * @returns {JSX.Element}
 */
export default function PaginationFooter({
  pagination,
  totalPages,
  totalEntries,
  allowChangingEntriesPerPage = true,
  entriesPerPageOptions = [10, 25, 50, 100],
}) {
  const {
    entriesPerPage,
    setEntriesPerPage,
    activePage,
    setActivePage,
  } = pagination;

  const [topEntryIndex, bottomEntryIndex] = [
    (activePage - 1) * entriesPerPage,
    Math.min(activePage * entriesPerPage, totalEntries) - 1,
  ];

  const options = entriesPerPageOptions.map((int) => (
    { key: int, text: int, value: int }
  ));

  return (
    totalEntries === 0
      ? <span>No results</span>
      : (
        <div>
          {allowChangingEntriesPerPage && (
            <span>
              <span>
                {`Showing entries ${topEntryIndex + 1} to ${bottomEntryIndex + 1} of ${totalEntries} with `}
                <Select
                  compact
                  options={options}
                  onChange={(_, newData) => {
                    setEntriesPerPage(newData.value);
                  }}
                  value={entriesPerPage}
                />
                {' '}
                per page
              </span>
            </span>
          )}

          <span style={{ float: 'right' }}>
            <Pagination
              activePage={activePage}
              onPageChange={(e, { activePage: newActivePage }) => setActivePage(newActivePage)}
              totalPages={totalPages}
              boundaryRange={0}
              siblingRange={2}
              ellipsisItem={null}
              firstItem={{ content: <Icon name="angle double left" />, icon: true }}
              lastItem={{ content: <Icon name="angle double right" />, icon: true }}
              prevItem={{ content: <Icon name="angle left" />, icon: true }}
              nextItem={{ content: <Icon name="angle right" />, icon: true }}
            />
          </span>
        </div>
      )
  );
}
