import {
  Icon, Popup, Table, TableBody, TableHeader,
} from 'semantic-ui-react';
import React from 'react';
import I18n from '../../lib/i18n';
import ReportTableCell from './ReportTableCell';
import { countries } from '../../lib/wca-data.js.erb';

export default function PastCompetitionsTable({ competitions, permissions }) {
  return (
    <Table striped>
      <TableHeader>
        <Table.Row>
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.name')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.location')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.date')}
          </Table.HeaderCell>
          <Table.HeaderCell />
          <Table.HeaderCell />
          <Table.HeaderCell />
        </Table.Row>
      </TableHeader>

      <TableBody>
        {competitions.map((competition) => (
          <Table.Row key={competition.id}>
            <Table.Cell>
              <a href={competition.url}>{competition.short_display_name}</a>
            </Table.Cell>
            <Table.Cell>
              {countries.byIso2[competition.country_iso2].name}
              {`, ${competition.city}`}
            </Table.Cell>
            <Table.Cell>
              {competition.date_range}
            </Table.Cell>
            <Table.Cell>
              {!competition['results_posted?'] && (
                <Icon name="calendar check" />
              )}
            </Table.Cell>
            <Table.Cell>
              {competition['results_posted?'] && (
                <Popup
                  content={I18n.t('competitions.my_competitions_table.results_up')}
                  trigger={(
                    <Icon name="check circle" />
                  )}
                />
              )}
            </Table.Cell>
            <ReportTableCell competitionId={competition.id} permissions={permissions} />
          </Table.Row>
        ))}
      </TableBody>
    </Table>
  );
}
