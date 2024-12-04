import { Icon, Popup, Table } from 'semantic-ui-react';
import React from 'react';
import I18n from '../../lib/i18n';
import { competitionReportUrl, competitionReportEditUrl } from '../../lib/requests/routes.js.erb';

export default function ReportTableCell({ permissions, competitionId, isReportPosted }) {
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
