import React from 'react';
import { Icon, Pagination } from 'semantic-ui-react';

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

  // todo: show different bottom when no results

  const [topEntryIndex, bottomEntryIndex] = [
    (activePage - 1) * entriesPerPage,
    Math.min(activePage * entriesPerPage, totalEntries) - 1,
  ];

  // todo: CSS needs improving; classNames below don't seem to be working
  return (
    <>
      {allowChangingEntriesPerPage && (
        <div className="fixed-table-pagination">
          <div className="pull-left pagination-detail">
            <span className="pagination-info">
              {`Showing ${topEntryIndex + 1} to ${bottomEntryIndex + 1} of ${totalEntries} entries with `}
            </span>
            <span className="page-list">
              <span className="btn-group dropup">
                <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown">
                  <span className="page-size">{entriesPerPage}</span>
                  <span className="caret" />
                </button>
                <ul className="dropdown-menu" role="menu">
                  {entriesPerPageOptions.map((entries) => (
                    <li
                      key={entries}
                      role="menuitem"
                      className={entries === entriesPerPage ? 'active' : ''}
                      onClick={() => setEntriesPerPage(entries)}
                    >
                      {entries}
                    </li>
                  ))}
                </ul>
              </span>
              {' '}
              entries per page
            </span>
          </div>
        </div>
      )}

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
    </>
  );
}
