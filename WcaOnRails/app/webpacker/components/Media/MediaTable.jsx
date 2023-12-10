import React, { useEffect, useMemo, useState } from 'react';

import _ from 'lodash';
import { Table, Confirm } from 'semantic-ui-react';

import { competitionUrl } from '../../lib/requests/routes.js.erb';
import { countries } from '../../lib/wca-data.js.erb';
import { dateRangeBetween } from '../../lib/helpers/media-table';
import useLoadedData from '../../lib/hooks/useLoadedData';


function handleSort(previousState, action) {
  switch (action.type) {
    case 'SET_MEDIA_DATA':
            return { ...previousState, mediaData: action.mediaData };
    case 'CHANGE_SORT':
      if (previousState.sortedColumn === action.column) {
        // If the column is already the one being sorted, reverse the data order
        return {
          ...previousState,
          sortedData: previousState.sortedData.slice().reverse(),
          sortDirection: previousState.sortDirection === 'ascending' ? 'descending' : 'ascending',
        };
      }

      // If a different column is selected, sort the data by the new column
      return {
        sortedColumn: action.column,
        sortedData: _.sortBy(previousState.sortedData, [action.column]),
        sortDirection: 'ascending',
      };
    default:
      throw new Error();
  }
}

export default function MediaTable({ isValidate }) {
  const { loading, error, data } = useLoadedData(
    "/api/v0/media?status=pending",
  );


  const mediaCombined = data?.map((medium, idx) => {
    const iso2 = medium.competition.country_iso2;

    const country = countries.byIso2[iso2];

    return {
      timestampSubmitted: new Date(medium.timestampSubmitted).toString(),
      timestampDecided: medium.timestampDecided,
      id: medium.competition.id,
      name: medium.competition.name,
      type: medium.type,
      text: medium.text,
      uri: medium.uri,
      country_iso2: iso2,
      country_name: country ? country.name : '',
      city: medium.competition.city,
      startDate: medium.competition.start_date,
      endDate: medium.competition.end_date,
      mediaId: medium.id,
    };
  });
  const [sortingState, dispatchSorting] = React.useReducer(handleSort, {
    column: null,
    mediaData: [],
    direction: null,
  });
  const { column,mediaData, direction } = sortingState;
  React.useEffect(() => {
    if (mediaCombined) {
        dispatchSorting({ type: 'SET_MEDIA_DATA', mediaData: mediaCombined });
    }
}, [mediaCombined]);
  console.log(sortingState)
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const openConfirm = () => {
    setConfirmOpen(true);
  }
  const confimMedia = () => {
    setConfirmOpen(false);
    setEndProbationParams(null);
  };
  return (
    <Table sortable celled fixed>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell
            sorted={column === 'timestampSubmitted' ? direction : null}
            onClick={() => dispatchSorting({ type: 'CHANGE_SORT', column: 'timestampSubmitted' })}
          >
            Submission Date
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={column === 'timestampDecided' ? direction : null}
            onClick={() => dispatchSorting({ type: 'CHANGE_SORT', column: 'timestampDecided' })}
          >
            Competition Date
          </Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('activerecord.attributes.competition_medium.competitionId')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('media.media_table.location')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('activerecord.attributes.competition_medium.type')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('activerecord.attributes.competition_medium.uri')}</Table.HeaderCell>
          {isValidate && <Table.HeaderCell></Table.HeaderCell>}
        </Table.Row>
      </Table.Header>
      <Table.Body>

        {mediaData?.map((media_row) => (
          <Table.Row>
            <Table.Cell>
              {moment.utc(media_row.timestampSubmitted).format('MMMM DD, YYYY HH:mm UTC')}
            </Table.Cell>
            <Table.Cell>
              {dateRangeBetween(media_row.startDate, media_row.endDate)}
            </Table.Cell>
            <Table.Cell>
              <a href={competitionUrl(media_row.id)}>{media_row.name}</a>
            </Table.Cell>
            <Table.Cell>
              {media_row.country_name}
              ,
              {media_row.city}
            </Table.Cell>
            <Table.Cell>
              {media_row.type}
            </Table.Cell>
            <Table.Cell>
              <a href={media_row.uri}>{media_row.text}</a>
            </Table.Cell>
            {isValidate &&
              <Table.Cell>
                <a href="#" onClick={openConfirm}>
                  <i className="check icon"></i>
                </a>
                <a href={`/media/${media_row.mediaId}/edit`}>
                  <i class="edit icon"></i>
                </a>
                <a href="https://example.com">
                  <i class="trash icon"></i>
                </a>
              </Table.Cell>
            }
          </Table.Row>
        ))}
        <Confirm
          open={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confimMedia}
          content="Are you sure you want to accept this media?"
        />
      </Table.Body>
    </Table>

  );
}
