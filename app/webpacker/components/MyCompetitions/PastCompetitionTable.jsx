import {
  Icon, Message, Popup, Table,
} from 'semantic-ui-react';
import React from 'react';
import I18n from '../../lib/i18n';
import {
  DateTableCell, LocationTableCell, NameTableCell, ReportTableCell,
} from './TableCells';
import I18nHTMLTranslate from '../I18nHTMLTranslate';

export default function PastCompetitionsTable({
  competitions,
  permissions,
  fallbackMessage = null,
}) {
  if (competitions.length === 0 && fallbackMessage) {
    return (
      <Message info>
        <I18nHTMLTranslate i18nKey={fallbackMessage.key} options={fallbackMessage.options} />
      </Message>
    );
  }

  return (
    <Table striped compact basic="very">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>
            {I18n.t('competitions.competition_info.name')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.competition_info.location')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.competition_info.date')}
          </Table.HeaderCell>
          <Table.HeaderCell />
          <Table.HeaderCell />
          <Table.HeaderCell />
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {competitions.map((competition) => (
          <Table.Row key={competition.id}>
            <NameTableCell competition={competition} />
            <LocationTableCell competition={competition} />
            <DateTableCell competition={competition} />
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
            <ReportTableCell
              competitionId={competition.id}
              permissions={permissions}
              isReportPosted={competition['report_posted?']}
              isPastCompetition
            />
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
