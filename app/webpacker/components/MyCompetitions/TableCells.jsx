import { Icon, Popup, Table } from 'semantic-ui-react';
import React from 'react';
import I18n from '../../lib/i18n';
import { competitionReportUrl, competitionReportEditUrl } from '../../lib/requests/routes.js.erb';
import { countries } from '../../lib/wca-data.js.erb';

export function NameTableCell({ competition }) {
  return (
    <Table.Cell>
      <a href={competition.url}>{competition.short_display_name}</a>
    </Table.Cell>
  );
}

export function LocationTableCell({ competition }) {
  return (
    <Table.Cell>
      {countries.byIso2[competition.country_iso2].name}
      {`, ${competition.city}`}
    </Table.Cell>
  );
}

export function DateTableCell({ competition }) {
  return (
    <Table.Cell>
      {competition.date_range}
    </Table.Cell>
  );
}

export function ReportTableCell({ permissions, competitionId, isReportPosted }) {
  return (
    <Table.Cell>
      {(permissions.can_administer_competitions.scope === '*' || permissions.can_administer_competitions.scope.includes(competitionId)) && (
        <>
          <Popup
            content={I18n.t('competitions.my_competitions_table.report')}
            trigger={(
              <a href={competitionReportUrl(competitionId)}>
                <Icon name="file alternate" />
              </a>
            )}
          />
          <Popup
            content={I18n.t('competitions.my_competitions_table.edit_report')}
            trigger={(
              <a href={competitionReportEditUrl(competitionId)}>
                <Icon name="edit" />
              </a>
            )}
          />
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
      )}
    </Table.Cell>
  );
}
