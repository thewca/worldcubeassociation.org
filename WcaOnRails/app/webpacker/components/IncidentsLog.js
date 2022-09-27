import React, { useState } from 'react';
import {
  Button,
  Dropdown,
  Icon,
  Input,
  Table,
} from 'semantic-ui-react';
import useLoadedData from '../lib/hooks/useLoadedData';
import {
  incidentsUrl,
  newIncidentUrl,
  incidentUrl,
} from '../lib/requests/routes.js.erb';
import Loading from './Requests/Loading';
import Errored from './Requests/Errored';
import PaginationFooter from './PaginationFooter';
import usePagination from './usePagination';
import { MiscTag, CompetitionTag, RegulationTag } from './Tags';

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
  } else {
    return '';
  }
}

// incidents log //

export default function IncidentsLog({
  canManageIncidents = false,
  canViewDelegateMatters = false,
  allTags = [],
}) {
  const pagination = usePagination();
  const [searchString, setSearchString] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const isUsingFilter = filterTags.length > 0;

  const { data, headers, loading, error } = useLoadedData(incidentsUrl(
    pagination.entriesPerPage,
    pagination.activePage,
    filterTags,
    searchString,
  ));
  const totalEntries = parseInt(headers.get("total"))
  const entriesPerPage = parseInt(headers.get("per-page"))
  const totalPages = Math.ceil(totalEntries / entriesPerPage)

  function addTagToSearch(tag) {
    setFilterTags((tags) => (tags.includes(tag) ? tags : [...tags, tag]));
    pagination.setActivePage(1);
  }

  const allTagsAsOptions = allTags.map((tag) => (
    { key: tag, text: tag, value: tag }
  ));

  return (
    <>
      <h1>Incidents log</h1>

      <div className="incidents-log-table-container">
        <Input
          placeholder="Search incidents..."
          icon="search"
          loading={loading}
          onChange={(_, newData) => {
            setSearchString(newData.value);
            pagination.setActivePage(1);
          }}
        />

        <Dropdown
          placeholder="Filter by tags"
          multiple
          search
          selection
          options={allTagsAsOptions}
          onChange={(_, newData) => {
            setFilterTags(newData.value);
            pagination.setActivePage(1);
          }}
          value={filterTags}
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
              <IncidentsLogHead
                canViewDelegateMatters={canViewDelegateMatters}
              />
              {/* if a tag filter is being applied, adding any visible tags
                  would be redundant, so don't bother showing the option */}
              {/* // todo: nevermind, remove above */}
              <IncidentsLogBody
                incidents={data}
                canViewDelegateMatters={canViewDelegateMatters}
                addTagToSearch={isUsingFilter ? null : addTagToSearch}
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
          content='New Incident'
          href={newIncidentUrl}
        />
      )}
    </>
  );
}

function IncidentsLogHead({ canViewDelegateMatters }) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell width={4}>
          Title
        </Table.HeaderCell>

        <Table.HeaderCell width={1}>
          Tags
        </Table.HeaderCell>

        <Table.HeaderCell width={1}>
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
  canViewDelegateMatters,
  addTagToSearch,
}) {
  return (
    <Table.Body>
      {incidents.map((incident) => (
        <IncidentsLogRow
          key={incident.id}
          incident={incident}
          canViewDelegateMatters={canViewDelegateMatters}
          addTagToSearch={addTagToSearch}
        />
      ))}
    </Table.Body>
  );
}

function IncidentsLogRow({
  incident,
  canViewDelegateMatters,
  addTagToSearch,
}) {
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

      <Table.Cell className="tags-cell">
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
                type={url.indexOf("guideline") === -1 ? 'Regulation' : 'Guideline'}
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

      <Table.Cell className="comps-cell">
        <div>
          {competitions.map(({
            id,
            name,
            comments,
          }) => (
            <CompetitionTag
              key={id}
              id={id}
              name={name}
              canViewDelegateMatters={canViewDelegateMatters}
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
