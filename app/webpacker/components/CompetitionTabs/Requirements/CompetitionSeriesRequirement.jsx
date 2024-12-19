import React from 'react';
import { List } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import { competitionUrl } from '../../../lib/requests/routes.js.erb';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';

export default function CompetitionSeriesRequirement({ competition }) {
  return (
    <>
      {I18n.t('competitions.competition_info.part_of_a_series_list', {
        name: competition.competition_series.name,
      })}
      <List bulleted>
        {competition.series_sibling_competitions.map((comp) => (
          <List.Item key={comp.id} style={{ marginLeft: '2em' }}>
            <a href={competitionUrl(comp.id)}>{comp.name}</a>
          </List.Item>
        ))}
      </List>
      <br />
      {/* i18n-tasks-use t('competitions.competition_info.series_registration_warning_html') */}
      <I18nHTMLTranslate i18nKey="competitions.competition_info.series_registration_warning_html" />
    </>
  );
}
