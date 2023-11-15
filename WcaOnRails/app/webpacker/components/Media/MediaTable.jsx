import React, { useState } from 'react';

import _ from 'lodash';
import moment from 'moment';
import { Table } from 'semantic-ui-react';

import { competitionUrl } from '../../lib/requests/routes.js.erb';
import { countries } from '../../lib/wca-data.js.erb';
import { dateRangeBetween } from '../../lib/helpers/media-table';

function handleSort(previousState, action) {
  switch (action.type) {
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

export default function MediaTable({ media, competition }) {
  const [mediaCombined, setMediaCombined] = useState(media.map((medium, idx) => {
    const iso2 = competition[idx].country_iso2;
    const country = countries.byIso2[iso2];
    return {
      timestampSubmitted: new Date(medium.timestampSubmitted).toString(),
      timestampDecided: medium.timestampDecided,
      id: competition[idx].id,
      name: competition[idx].name,
      type: medium.type,
      text: medium.text,
      uri: medium.uri,
      country_iso2: iso2,
      country_name: country ? country.name : '',
      city: competition[idx].city,
      startDate: competition[idx].start_date,
      endDate: competition[idx].end_date,
    };
  }));

  const [sortingState, dispatchSorting] = React.useReducer(handleSort, {
    column: null,
    data: mediaCombined,
    direction: null,
  });
  const { column, data, direction } = sortingState;
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
        </Table.Row>
      </Table.Header>
      <Table.Body>

        {data.map((media_row) => (
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
          </Table.Row>
        ))}

      </Table.Body>
    </Table>
  );
}
