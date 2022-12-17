import React, { useContext, useState } from 'react';
import {
  Button,
  Dropdown,
  Icon,
  Input,
  Table,
} from 'semantic-ui-react';

import { MiscTag, CompetitionTag, RegulationTag } from './Tags';
import PaginationFooter from '../PaginationFooter';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';

import DelegateMattersContext from '../../lib/contexts';
import useLoadedData from '../../lib/hooks/useLoadedData';
import useDebounce from '../../lib/hooks/useDebounce';
import usePagination from '../../lib/hooks/usePagination';

import {
  incidentsUrl,
  newIncidentUrl,
  incidentUrl,
} from '../../lib/requests/routes.js.erb';

// incident helper functions //

function incidentStatusClass({ resolved_at: resolvedAt }) {
  return resolvedAt ? 'success' : 'warning';
}

function incidentStatusText({ resolved_at: resolvedAt }) {
  return resolvedAt ? 'Resolved' : 'Pending';
}

function incidentDigestClass({ digest_worthy: digestWorthy, digest_sent_at: digestSentAt }) {
  return digestWorthy && !digestSentAt ? 'warning' : 'success';
}

function incidentDigestText({ digest_worthy: digestWorthy, digest_sent_at: digestSentAt }) {
  if (digestWorthy) {
    return digestSentAt ? 'Sent' : 'Pending';
  }
  return '';
}

// constants //

const DEBOUNCE_MS = 300;
const SEARCH = 'search';
const TAGS = 'tags';

// incidents log //

export default function IncidentsLog({
  canManageIncidents = false,
  canViewDelegateMatters = false,
  allTags = [],
}) {
  const pagination = usePagination();

  // note: page will not render after setting url search params
  const searchParams = new URLSearchParams(window.location.search);

  const [searchString, setSearchStringState] = useState(
    searchParams.get(SEARCH) || '',
  );
  const setSearchString = (string) => {
    setSearchStringState(string);
    searchParams.set(SEARCH, string);
    window.history.replaceState({}, '', `${window.location.pathname}?${searchParams}`);
  };

  const [filterTags, setFilterTagsState] = useState(
    (searchParams.get(TAGS) || '').split(',').filter(Boolean),
  );
  const setFilterTags = (tagArray) => {
    setFilterTagsState(tagArray);
    searchParams.set(TAGS, tagArray.join(','));
    window.history.replaceState({}, '', `${window.location.pathname}?${searchParams}`);
  };

  const debouncedSearchString = useDebounce(searchString, DEBOUNCE_MS);

  const {
    data,
    headers,
    loading,
    error,
  } = useLoadedData(incidentsUrl(
    pagination.entriesPerPage,
    pagination.activePage,
    filterTags,
    debouncedSearchString,
  ));
  const totalEntries = parseInt(headers.get('total'), 10);
  const entriesPerPage = parseInt(headers.get('per-page'), 10);
  const totalPages = Math.ceil(totalEntries / entriesPerPage);

  const allTagsAsOptions = allTags.map((tag) => (
    { key: tag, text: tag, value: tag }
  ));

  return (
    <DelegateMattersContext.Provider value={canViewDelegateMatters}>
      <h1>Incidents log</h1>

      <div>
        <Input
          id="incidents-log-search-container"
          placeholder="Search incidents..."
          icon="search"
          loading={loading}
          value={searchString}
          onChange={(_, newData) => {
            setSearchString(newData.value);
            pagination.setActivePage(1);
          }}
        />

        <Dropdown
          id="incidents-log-tags-container"
          placeholder="Filter by tags"
          multiple
          search
          selection
          options={allTagsAsOptions}
          value={filterTags}
          onChange={(_, newData) => {
            setFilterTags(newData.value);
            pagination.setActivePage(1);
          }}
        />

        {error && (
          <Errored componentName="IncidentsLog" />
        )}
        {loading && (
          <Loading />
        )}
        {!loading && data && (
          <>
            <Table striped>
              <IncidentsLogHead />
              <IncidentsLogBody
                incidents={data}
                addTagToSearch={(tag) => {
                  setFilterTags(
                    filterTags.includes(tag) ? filterTags : [...filterTags, tag],
                  );
                  pagination.setActivePage(1);
                }}
              />
            </Table>
            <PaginationFooter
              pagination={pagination}
              totalPages={totalPages}
              totalEntries={totalEntries}
              allowChangingEntriesPerPage
            />
          </>
        )}
      </div>

      <br />

      {canManageIncidents && (
        <Button
          positive
          icon={<Icon name="plus" />}
          content="New Incident"
          href={newIncidentUrl}
        />
      )}
    </DelegateMattersContext.Provider>
  );
}

function IncidentsLogHead() {
  const canViewDelegateMatters = useContext(DelegateMattersContext);

  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell width={4}>
          Title
        </Table.HeaderCell>

        <Table.HeaderCell width={1}>
          Tags
        </Table.HeaderCell>

        <Table.HeaderCell width={2}>
          Happened during
        </Table.HeaderCell>

        <Table.HeaderCell width={1}>
          Status
        </Table.HeaderCell>

        {canViewDelegateMatters && (
          <Table.HeaderCell width={1}>
            Sent in digest
          </Table.HeaderCell>
        )}
      </Table.Row>
    </Table.Header>
  );
}

function IncidentsLogBody({
  incidents,
  addTagToSearch,
}) {
  return (
    <Table.Body>
      {incidents.map((incident) => (
        <IncidentsLogRow
          key={incident.id}
          incident={incident}
          addTagToSearch={addTagToSearch}
        />
      ))}
    </Table.Body>
  );
}

function IncidentsLogRow({
  incident,
  addTagToSearch,
}) {
  const canViewDelegateMatters = useContext(DelegateMattersContext);
  const {
    id,
    title,
    tags,
    competitions,
  } = incident;

  return (
    <Table.Row>
      <Table.Cell>
        <a href={incidentUrl(id)}>{title}</a>
      </Table.Cell>

      <Table.Cell>
        {tags.map(
          ({
            name,
            id: tagId,
            url,
            content_html: contentHtml,
          }) => (
            // non-regulation/guideline tags will only have a name
            tagId !== undefined ? (
              <RegulationTag
                key={tagId}
                id={tagId}
                type={url.indexOf('guideline') === -1 ? 'Regulation' : 'Guideline'}
                link={url}
                description={contentHtml}
                addToSearch={addTagToSearch}
              />
            ) : (
              <MiscTag
                key={name}
                tag={name}
                addToSearch={addTagToSearch}
              />
            )
          ),
        )}
      </Table.Cell>

      <Table.Cell>
        <div>
          {competitions.map(({
            id: competitionId,
            name,
            comments,
          }) => (
            <CompetitionTag
              key={competitionId}
              id={competitionId}
              name={name}
              comments={comments}
            />
          ))}
        </div>
      </Table.Cell>

      <Table.Cell className={`text-${incidentStatusClass(incident)}`}>
        {incidentStatusText(incident)}
      </Table.Cell>

      {canViewDelegateMatters && (
        <Table.Cell className={`text-${incidentDigestClass(incident)}`}>
          {incidentDigestText(incident)}
        </Table.Cell>
      )}

    </Table.Row>
  );
}
