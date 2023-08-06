import _ from 'lodash'
import React, { useState, useEffect } from 'react';
import { Table } from "semantic-ui-react";
import { countries } from '../../lib/wca-data.js.erb';
import { competitionUrl } from '../../lib/requests/routes.js.erb';
import moment from 'moment';

function dateRangeBetween(fromDate, toDate) {
    const format = new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
    const date1 = new Date(fromDate);
    const date2 = new Date(toDate);
    const ans = format.formatRange(date1, date2);
    return ans;
}

function exampleReducer(state, action) {
    switch (action.type) {
        case 'CHANGE_SORT':
            if (state.column === action.column) {
                return {
                    ...state,
                    data: state.data.slice().reverse(),
                    direction:
                        state.direction === 'ascending' ? 'descending' : 'ascending',
                }
            }

            return {
                column: action.column,
                data: _.sortBy(state.data, [action.column]),
                direction: 'ascending',
            }
        default:
            throw new Error()
    }
}


export default function MediaTable({ media, competition }) {
    const [mediaaComb, setMediaComb] = useState(media.map((medium, idx) => {
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
            country_name: country ? country.name : "",
            city: competition[idx].city,
            startDate: competition[idx].start_date,
            endDate: competition[idx].end_date,
        };
    }));

    const [state, dispatch] = React.useReducer(exampleReducer, {
        column: null,
        data: mediaaComb,
        direction: null,
    })
    const { column, data, direction } = state
    return (
        <>
            <Table sortable celled fixed>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell
                            sorted={column === 'timestampSubmitted' ? direction : null}
                            onClick={() => dispatch({ type: 'CHANGE_SORT', column: 'timestampSubmitted' })}
                        >Submission Date</Table.HeaderCell>
                        <Table.HeaderCell
                            sorted={column === 'timestampDecided' ? direction : null}
                            onClick={() => dispatch({ type: 'CHANGE_SORT', column: 'timestampDecided' })}
                        >Competition Date</Table.HeaderCell>
                        <Table.HeaderCell >{I18n.t('activerecord.attributes.competition_medium.competitionId')}</Table.HeaderCell>
                        <Table.HeaderCell >{I18n.t('media.media_table.location')}</Table.HeaderCell>
                        <Table.HeaderCell >{I18n.t('activerecord.attributes.competition_medium.type')}</Table.HeaderCell>
                        <Table.HeaderCell >{I18n.t('activerecord.attributes.competition_medium.uri')}</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>

                    {data.map((media_row) => {
                        return (
                            <Table.Row>
                                <Table.Cell>
                                    {moment.utc(media_row.timestampSubmitted).format("MMMM DD, YYYY HH:mm UTC")}
                                </Table.Cell>
                                <Table.Cell>
                                    {dateRangeBetween(media_row.startDate,media_row.endDate)}
                                </Table.Cell>
                                <Table.Cell>
                                    <a href={competitionUrl(media_row.id)}>{media_row.name}</a>
                                </Table.Cell>
                                <Table.Cell>
                                    {media_row.country_name}, {media_row.city}
                                </Table.Cell>
                                <Table.Cell>
                                    {media_row.type}
                                </Table.Cell>
                                <Table.Cell>
                                    <a href={media_row.uri}>{media_row.text}</a>
                                </Table.Cell>
                            </Table.Row>
                        )
                    })}

                </Table.Body>
            </Table>
        </>
    );
}