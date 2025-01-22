import { Icon, Popup, Table } from 'semantic-ui-react';
import React from 'react';
import I18n from '../../lib/i18n';
import { competitionReportUrl, competitionReportEditUrl } from '../../lib/requests/routes.js.erb';
import { countries } from '../../lib/wca-data.js.erb';
import { dateRange } from '../../lib/utils/dates';

export function NameTableCell({ competition }) {
  return (
    <Table.Cell>
      <a href={competition.url}>
        {competition.short_display_name}
        {' '}
        { competition.championships?.length > 0 && <Icon name="trophy" /> }
      </a>
    </Table.Cell>
  );
}

export function LocationTableCell({ competition }) {
  return (
    <Table.Cell>
      {competition.city}
      {`, ${countries.byIso2[competition.country_iso2].name}`}
    </Table.Cell>
  );
}

export function DateTableCell({ competition }) {
  return (
    <Table.Cell>
      {dateRange(competition.start_date, competition.end_date, { separator: '-' })}
    </Table.Cell>
  );
}

export function ReportTableCell({
  permissions, competitionId, isReportPosted, canViewDelegateReport,
}) {
  if (canViewDelegateReport) {
    return (
      <Table.Cell>
        <>
          {(permissions.can_view_delegate_report.scope === '*' || permissions.can_view_delegate_report.scope.includes(competitionId))
          && (
          <Popup
            content={I18n.t('competitions.my_competitions_table.report')}
            trigger={(
              <a href={competitionReportUrl(competitionId)}>
                <Icon name="file alternate" />
              </a>
            )}
          />
          )}

          {(permissions.can_edit_delegate_report.scope === '*' || permissions.can_edit_delegate_report.scope.includes(competitionId))
            && (
            <Popup
              content={I18n.t('competitions.my_competitions_table.edit_report')}
              trigger={(
                <a href={competitionReportEditUrl(competitionId)}>
                  <Icon name="edit" />
                </a>
              )}
            />
            )}

          { !isReportPosted
          && permissions.can_administer_competitions.scope.includes(competitionId) && (
            <Popup
              content={I18n.t('competitions.my_competitions_table.missing_report')}
              trigger={(
                <Icon name="warning" />
              )}
            />
          )}
        </>
      </Table.Cell>
    );
  }
}
